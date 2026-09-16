-- Fix wallet ledger accuracy and repair balances from the immutable ledger.
-- IMPORTANT: review the verification SELECT at the bottom before running the repair UPDATE in production.

create or replace function public.transfer_vcoin(p_recipient text,p_amount numeric,p_method text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare sprof profiles%rowtype;rprof profiles%rowtype;sw wallets%rowtype;rw wallets%rowtype;charge numeric;total numeric;txid text;sender_before numeric;receiver_before numeric;sender_after numeric;receiver_after numeric;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'Amount must be greater than zero'; end if;
 if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then raise exception 'Idempotency key required'; end if;
 if exists(select 1 from vcoin_transfers where idempotency_key=p_idempotency_key) then return (select jsonb_build_object('transaction_id',transaction_id,'duplicate',true) from vcoin_transfers where idempotency_key=p_idempotency_key); end if;
 select * into sprof from profiles where id=auth.uid(); if sprof.status<>'active' then raise exception 'Sender is not active'; end if;
 if p_method='USERNAME' then select * into rprof from profiles where lower(username)=lower(trim(leading '@' from p_recipient)); else select p.* into rprof from profiles p join wallets w on w.user_id=p.id where w.wallet_address=p_recipient; end if;
 if rprof.id is null then raise exception 'Recipient not found'; end if; if rprof.id=sprof.id then raise exception 'Cannot transfer to yourself'; end if; if rprof.status<>'active' then raise exception 'Recipient is not active'; end if;
 -- Deterministic lock order prevents deadlocks.
 if sprof.id::text < rprof.id::text then select * into sw from wallets where user_id=sprof.id for update;select * into rw from wallets where user_id=rprof.id for update; else select * into rw from wallets where user_id=rprof.id for update;select * into sw from wallets where user_id=sprof.id for update; end if;
 if sw.status<>'active' or rw.status<>'active' then raise exception 'Wallet is frozen'; end if;
 charge:=calc_charge(sprof.master_id,'INTERNAL_TRANSFER',p_amount); total:=p_amount+charge;
 if sw.vcoin_balance-sw.locked_balance<total then raise exception 'Insufficient available balance'; end if;
 sender_before:=sw.vcoin_balance;receiver_before:=rw.vcoin_balance;sender_after:=sender_before-total;receiver_after:=receiver_before+p_amount;
 txid:='VCT-'||upper(substr(encode(gen_random_bytes(10),'hex'),1,20));
 update wallets set vcoin_balance=sender_after,updated_at=now() where id=sw.id;update wallets set vcoin_balance=receiver_after,updated_at=now() where id=rw.id;
 insert into vcoin_transfers(transaction_id,sender_user_id,receiver_user_id,sender_wallet_id,receiver_wallet_id,amount,charge,total_debit,transfer_method,status,idempotency_key,completed_at) values(txid,sprof.id,rprof.id,sw.id,rw.id,p_amount,charge,total,p_method,'completed',p_idempotency_key,now());
 insert into wallet_transactions(transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,idempotency_key) values
 (txid||'-D',sw.id,'TRANSFER_SEND','DEBIT',total,sender_before,sender_after,txid,'Transfer to @'||rprof.username,p_idempotency_key||'-D'),
 (txid||'-C',rw.id,'TRANSFER_RECEIVE','CREDIT',p_amount,receiver_before,receiver_after,txid,'Transfer from @'||sprof.username,p_idempotency_key||'-C');
 if charge>0 then insert into charge_history(user_id,master_id,transaction_type,reference_id,amount) values(sprof.id,sprof.master_id,'INTERNAL_TRANSFER',txid,charge);perform record_charge_commission(sprof.id,sprof.master_id,'INTERNAL_TRANSFER',txid,p_amount,charge);end if;
 insert into notifications(user_id,title,message,type,reference_id) values(rprof.id,'V Coin received',p_amount||' VC received from @'||sprof.username,'TRANSFER',txid);
 return jsonb_build_object('transaction_id',txid,'amount',p_amount,'charge',charge,'total_debit',total,'recipient',rprof.username,'balance',sender_after);
end$$;

-- Verification: these values should normally be equal. This does not change data.
select p.username,w.vcoin_balance as wallet_balance,
       coalesce((select wt.balance_after from wallet_transactions wt where wt.wallet_id=w.id order by wt.created_at desc,wt.id desc limit 1),w.vcoin_balance) as latest_ledger_balance
from wallets w join profiles p on p.id=w.user_id
order by p.username;

-- If old wallet balances are already corrupted, run ONLY AFTER reviewing the SELECT above:
-- update wallets w set vcoin_balance=x.balance_after,updated_at=now()
-- from (select distinct on(wallet_id) wallet_id,balance_after from wallet_transactions order by wallet_id,created_at desc,id desc) x
-- where x.wallet_id=w.id and w.vcoin_balance is distinct from x.balance_after;
