-- V Coin internal transfer net-amount patch
-- Run once in Supabase SQL Editor.
-- Rule: user enters 10000 VC, fee 750 VC => sender wallet debit 10000 VC,
-- receiver wallet credit 9250 VC, and 750 VC is recorded as commission/charge.

create or replace function public.transfer_vcoin(
 p_recipient text,
 p_amount numeric,
 p_method text,
 p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
 sprof profiles%rowtype;
 rprof profiles%rowtype;
 sw wallets%rowtype;
 rw wallets%rowtype;
 charge numeric;
 net_amount numeric;
 txid text;
 master_comm numeric:=0;
 company_comm numeric:=0;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'Amount must be greater than zero'; end if;
 if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then raise exception 'Idempotency key required'; end if;

 if exists(select 1 from vcoin_transfers where idempotency_key=p_idempotency_key) then
  return (select jsonb_build_object('transaction_id',transaction_id,'duplicate',true) from vcoin_transfers where idempotency_key=p_idempotency_key);
 end if;

 select * into sprof from profiles where id=auth.uid();
 if sprof.status<>'active' then raise exception 'Sender is not active'; end if;

 if p_method='USERNAME' then
  select * into rprof from profiles where lower(username)=lower(trim(leading '@' from p_recipient));
 else
  select p.* into rprof from profiles p join wallets w on w.user_id=p.id where w.wallet_address=p_recipient;
 end if;
 if rprof.id is null then raise exception 'Recipient not found'; end if;
 if rprof.id=sprof.id then raise exception 'Cannot transfer to yourself'; end if;
 if rprof.status<>'active' then raise exception 'Recipient is not active'; end if;

 select * into sw from wallets where user_id=sprof.id for update;
 select * into rw from wallets where user_id=rprof.id for update;
 if sw.status<>'active' or rw.status<>'active' then raise exception 'Wallet is frozen'; end if;

 charge:=calc_charge(sprof.master_id,'INTERNAL_TRANSFER',p_amount);
 net_amount:=p_amount-charge;
 if net_amount<=0 then raise exception 'Charge must be less than transfer amount'; end if;
 if sw.vcoin_balance-sw.locked_balance<p_amount then raise exception 'Insufficient available balance'; end if;

 txid:='VCT-'||upper(substr(encode(gen_random_bytes(10),'hex'),1,20));
 update wallets set vcoin_balance=vcoin_balance-p_amount,updated_at=now() where id=sw.id;
 update wallets set vcoin_balance=vcoin_balance+net_amount,updated_at=now() where id=rw.id;

 insert into vcoin_transfers(transaction_id,sender_user_id,receiver_user_id,sender_wallet_id,receiver_wallet_id,amount,charge,total_debit,transfer_method,status,idempotency_key,completed_at)
 values(txid,sprof.id,rprof.id,sw.id,rw.id,net_amount,charge,p_amount,p_method,'completed',p_idempotency_key,now());

 insert into wallet_transactions(transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,idempotency_key)
 values
 (txid||'-D',sw.id,'TRANSFER_SEND','DEBIT',p_amount,sw.vcoin_balance,sw.vcoin_balance-p_amount,txid,'Transfer to @'||rprof.username||'; received '||net_amount||' VC; fee '||charge||' VC',p_idempotency_key||'-D'),
 (txid||'-C',rw.id,'TRANSFER_RECEIVE','CREDIT',net_amount,rw.vcoin_balance,rw.vcoin_balance+net_amount,txid,'Transfer from @'||sprof.username||'; fee '||charge||' VC',p_idempotency_key||'-C');

 if charge>0 then
  insert into charge_history(user_id,master_id,transaction_type,reference_id,amount)
  values(sprof.id,sprof.master_id,'INTERNAL_TRANSFER',txid,charge);
  if sprof.master_id is not null then
   select round(charge*master_percentage/100,8),round(charge*company_percentage/100,8)
   into master_comm,company_comm from commission_rules where master_id=sprof.master_id and is_active=true;
  end if;
  company_comm:=coalesce(company_comm,charge-master_comm);
  insert into commissions(master_id,user_id,transaction_type,transaction_reference,transaction_amount,total_charge,master_commission,company_commission)
  values(sprof.master_id,sprof.id,'INTERNAL_TRANSFER',txid,p_amount,charge,coalesce(master_comm,0),coalesce(company_comm,charge));
 end if;

 insert into notifications(user_id,title,message,type,reference_id)
 values(rprof.id,'V Coin received',net_amount||' VC received from @'||sprof.username,'TRANSFER',txid);

 return jsonb_build_object('transaction_id',txid,'requested_amount',p_amount,'amount',net_amount,'charge',charge,'total_debit',p_amount,'recipient',rprof.username);
end$$;

revoke all on function public.transfer_vcoin(text,numeric,text,text) from public;
grant execute on function public.transfer_vcoin(text,numeric,text,text) to authenticated;
