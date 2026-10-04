-- V Coin net-amount charge accounting patch
-- Run this ONCE in Supabase SQL Editor after deploying the matching web code.
-- Business rule:
-- TOPUP: request 10000, fee 20 => wallet CREDIT 9980, commission 20.
-- BANK/CRYPTO: displayed/processed payout is request amount minus business charge (and crypto network charge where applicable).
-- CASH_OUT: request 10000, fee 20 => wallet DEBIT 10000, cash received/displayed 9980, commission 20.

-- Cash-out request creation: requested amount is the TOTAL wallet debit.
create or replace function public.create_cashout_token_request(
 p_requested_vcoin numeric,p_city text,p_area text,p_area_code text,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare p profiles%rowtype;w wallets%rowtype;rid text;tok text;ch numeric;net_cash numeric;i int:=0;
begin
 select * into p from profiles where id=auth.uid();
 if p.id is null then raise exception 'Not authenticated';end if;
 if p.status<>'active' then raise exception 'Account not active';end if;
 if p_requested_vcoin is null or p_requested_vcoin<=0 then raise exception 'Invalid amount';end if;
 select * into w from wallets where user_id=p.id for update;
 if w.status<>'active' then raise exception 'Wallet frozen';end if;
 ch:=calc_charge(p.master_id,'CASH_OUT',p_requested_vcoin);
 net_cash:=p_requested_vcoin-ch;
 if net_cash<=0 then raise exception 'Charge must be less than cash-out amount';end if;
 if w.vcoin_balance-w.locked_balance<p_requested_vcoin then raise exception 'Insufficient available balance';end if;
 if exists(select 1 from cashout_requests where idempotency_key=p_idempotency_key) then
   return(select jsonb_build_object('request_id',request_id,'city',city,'area',area,'area_code',area_code,'amount',requested_vcoin,'charge',cashout_charge,'total_debit',total_debit,'net_cash',requested_vcoin-cashout_charge,'status',status) from cashout_requests where idempotency_key=p_idempotency_key);
 end if;
 rid:='CSH-'||upper(substr(encode(gen_random_bytes(9),'hex'),1,18));
 loop tok:=lpad((floor(random()*10000000000))::bigint::text,10,'0');exit when not exists(select 1 from cashout_requests where token_no=tok);i:=i+1;if i>20 then raise exception 'Unable to generate token';end if;end loop;
 insert into cashout_requests(request_id,user_id,master_id,requested_vcoin,cashout_charge,total_debit,city,area,area_code,token_no,status,idempotency_key)
 values(rid,p.id,p.master_id,p_requested_vcoin,ch,p_requested_vcoin,trim(p_city),trim(p_area),trim(p_area_code),tok,'pending',p_idempotency_key);
 insert into notifications(user_id,title,message,type,reference_id) values(p.id,'Cash-out request sent','Your cash-out request is waiting for admin confirmation.','CASH_OUT',rid);
 return jsonb_build_object('request_id',rid,'city',trim(p_city),'area',trim(p_area),'area_code',trim(p_area_code),'amount',p_requested_vcoin,'charge',ch,'total_debit',p_requested_vcoin,'net_cash',net_cash,'status','pending');
end$$;
grant execute on function public.create_cashout_token_request(numeric,text,text,text,text) to authenticated;

-- Cash-out completion: debit requested amount only; fee is included inside it.
create or replace function public.process_cashout_request(p_request_id text,p_action text,p_note text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare me profiles%rowtype;r cashout_requests%rowtype;w wallets%rowtype;a text:=upper(p_action);afterb numeric;net_cash numeric;
begin
 select * into me from profiles where id=auth.uid();
 if me.role not in ('super_admin','admin','master') or me.status<>'active' then raise exception 'Not authorized';end if;
 select * into r from cashout_requests where id=p_request_id::uuid for update;
 if r.id is null then raise exception 'Request not found';end if;
 if me.role='master' and r.master_id is distinct from me.id then raise exception 'Not your assigned request';end if;
 if r.status in ('completed','rejected','cancelled') then raise exception 'Request already finalized';end if;
 select * into w from wallets where user_id=r.user_id for update;
 if a='COMPLETE' then
   if coalesce(trim(r.offered_address),'')='' or coalesce(trim(r.offered_city),'')='' or coalesce(trim(r.offered_area),'')='' or coalesce(trim(r.offered_area_code),'')='' then raise exception 'Cash location and address are required before Cash Paid';end if;
   if w.status<>'active' then raise exception 'Wallet frozen';end if;
   if w.vcoin_balance-w.locked_balance<r.requested_vcoin then raise exception 'Insufficient available balance';end if;
   net_cash:=r.requested_vcoin-r.cashout_charge;
   if net_cash<=0 then raise exception 'Charge must be less than cash-out amount';end if;
   afterb:=w.vcoin_balance-r.requested_vcoin;
   update wallets set vcoin_balance=afterb,updated_at=now() where id=w.id;
   insert into wallet_transactions(transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,idempotency_key)
   values(r.request_id||'-D',w.id,'CASH_OUT','DEBIT',r.requested_vcoin,w.vcoin_balance,afterb,r.request_id,'Cash out completed; cash paid '||net_cash||' VC; fee '||r.cashout_charge||' VC','PROC-'||r.request_id);
   update cashout_requests set total_debit=requested_vcoin,status='completed',updated_at=now() where id=r.id;
   if r.cashout_charge>0 then
     insert into charge_history(user_id,master_id,transaction_type,reference_id,amount) values(r.user_id,r.master_id,'CASH_OUT',r.request_id,r.cashout_charge);
     perform record_charge_commission(r.user_id,r.master_id,'CASH_OUT',r.request_id,r.requested_vcoin,r.cashout_charge);
   end if;
   insert into notifications(user_id,title,message,type,reference_id) values(r.user_id,'Cash paid - token ready','Cash payment confirmed. Your 10-digit cash-out token is now visible in Request Activity.','CASH_OUT',r.request_id);
 elsif a in ('REJECTED','CANCELLED') then
   update cashout_requests set status=lower(a)::request_status,updated_at=now() where id=r.id;
 else raise exception 'Use COMPLETE or REJECTED action';end if;
 return jsonb_build_object('success',true,'request_id',r.request_id,'action',a,'wallet_debit',case when a='COMPLETE' then r.requested_vcoin else 0 end,'charge',r.cashout_charge,'net_cash',case when a='COMPLETE' then r.requested_vcoin-r.cashout_charge else 0 end);
end$$;
grant execute on function public.process_cashout_request(text,text,text) to authenticated;

-- Main request completion accounting.
create or replace function public.process_request(p_kind text,p_request_id text,p_action text,p_note text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare me profiles%rowtype;uid uuid;mid uuid;wid uuid;amt numeric;business_charge numeric:=0;network_chg numeric:=0;net_amt numeric;rid text;before numeric;locked_before numeric;afterb numeric;current_status request_status;k text:=upper(p_kind);a text:=upper(p_action);
begin
 select * into me from profiles where id=auth.uid();if me.role not in ('super_admin','admin','master') or me.status<>'active' then raise exception 'Not authorized';end if;if me.role='master' and not has_permission('APPROVE_REQUESTS') then raise exception 'APPROVE_REQUESTS permission required';end if;if a not in ('APPROVED','COMPLETE','REJECTED','CANCELLED','PAYMENT_PENDING','PAYMENT_SUBMITTED','PAYMENT_CONFIRMED') then raise exception 'Invalid action';end if;
 if k='TOPUP' then
  select user_id,master_id,requested_vcoin,topup_charge,request_id,status into uid,mid,amt,business_charge,rid,current_status from topup_requests where id=p_request_id::uuid for update;if uid is null then raise exception 'Request not found';end if;if me.role='master' and mid is distinct from me.id then raise exception 'Not your assigned request';end if;if current_status in ('completed','rejected','cancelled') then raise exception 'Request already finalized';end if;
  if a='COMPLETE' then
   net_amt:=amt-business_charge;if net_amt<=0 then raise exception 'Charge must be less than top-up amount';end if;
   select id,vcoin_balance into wid,before from wallets where user_id=uid for update;afterb:=before+net_amt;update wallets set vcoin_balance=afterb,updated_at=now() where id=wid;
   insert into wallet_transactions(transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,idempotency_key) values(rid||'-C',wid,'TOPUP','CREDIT',net_amt,before,afterb,rid,'Top-up net credit; requested '||amt||' VC; fee '||business_charge||' VC','PROC-'||rid);
   update topup_requests set status='completed',updated_at=now() where id=p_request_id::uuid;
   if business_charge>0 then insert into charge_history(user_id,master_id,transaction_type,reference_id,amount) values(uid,mid,'VCOIN_TOPUP',rid,business_charge);perform record_charge_commission(uid,mid,'VCOIN_TOPUP',rid,amt,business_charge);end if;
   insert into notifications(user_id,title,message,type,reference_id) values(uid,'Top-up completed',net_amt||' VC credited after '||business_charge||' VC fee','TOPUP',rid);
  else update topup_requests set status=lower(a)::request_status,updated_at=now() where id=p_request_id::uuid;end if;
 elsif k='CRYPTO' then
  select user_id,master_id,vcoin_amount,conversion_charge,network_charge,request_id,status into uid,mid,amt,business_charge,network_chg,rid,current_status from crypto_conversion_requests where id=p_request_id::uuid for update;if uid is null then raise exception 'Request not found';end if;if me.role='master' and mid is distinct from me.id then raise exception 'Not your assigned request';end if;if current_status in ('completed','rejected','cancelled') then raise exception 'Request already finalized';end if;
  select id,vcoin_balance,locked_balance into wid,before,locked_before from wallets where user_id=uid for update;
  if a='COMPLETE' then
   if locked_before<amt then raise exception 'Locked balance mismatch';end if;net_amt:=amt-business_charge-network_chg;if net_amt<0 then raise exception 'Charges exceed crypto amount';end if;afterb:=before-amt;update wallets set vcoin_balance=afterb,locked_balance=locked_balance-amt,updated_at=now() where id=wid;
   insert into wallet_transactions(transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,idempotency_key) values(rid||'-D',wid,'CRYPTO_CONVERSION','DEBIT',amt,before,afterb,rid,'Crypto request total debit; net after fees '||net_amt||' VC','PROC-'||rid);
   update crypto_conversion_requests set status='completed',updated_at=now() where id=p_request_id::uuid;
   if business_charge>0 then insert into charge_history(user_id,master_id,transaction_type,reference_id,amount) values(uid,mid,'CRYPTO_CONVERSION',rid,business_charge);perform record_charge_commission(uid,mid,'CRYPTO_CONVERSION',rid,amt,business_charge);end if;if network_chg>0 then insert into charge_history(user_id,master_id,transaction_type,reference_id,amount) values(uid,mid,'CRYPTO_NETWORK',rid,network_chg);end if;
   insert into crypto_transactions(crypto_request_id,crypto_asset_id,wallet_address,crypto_amount,transaction_hash,network,processed_by,processed_at) select c.id,c.crypto_asset_id,c.destination_wallet,c.final_crypto_amount,nullif(p_note,''),a2.network,auth.uid(),now() from crypto_conversion_requests c join crypto_assets a2 on a2.id=c.crypto_asset_id where c.id=p_request_id::uuid;
  elsif a in ('REJECTED','CANCELLED') then update wallets set locked_balance=greatest(locked_balance-amt,0),updated_at=now() where id=wid;update crypto_conversion_requests set status=lower(a)::request_status,updated_at=now() where id=p_request_id::uuid;else update crypto_conversion_requests set status=lower(a)::request_status,updated_at=now() where id=p_request_id::uuid;end if;
 elsif k='BANK' then
  select user_id,master_id,vcoin_amount,transfer_charge,request_id,status into uid,mid,amt,business_charge,rid,current_status from bank_transfer_requests where id=p_request_id::uuid for update;if uid is null then raise exception 'Request not found';end if;if me.role='master' and mid is distinct from me.id then raise exception 'Not your assigned request';end if;if current_status in ('completed','rejected','cancelled') then raise exception 'Request already finalized';end if;
  select id,vcoin_balance,locked_balance into wid,before,locked_before from wallets where user_id=uid for update;
  if a='COMPLETE' then
   if locked_before<amt then raise exception 'Locked balance mismatch';end if;net_amt:=amt-business_charge;if net_amt<0 then raise exception 'Charge exceeds bank amount';end if;afterb:=before-amt;update wallets set vcoin_balance=afterb,locked_balance=locked_balance-amt,updated_at=now() where id=wid;
   insert into wallet_transactions(transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,idempotency_key) values(rid||'-D',wid,'BANK_TRANSFER','DEBIT',amt,before,afterb,rid,'Bank request total debit; net payout '||net_amt||' VC','PROC-'||rid);
   update bank_transfer_requests set status='completed',updated_at=now() where id=p_request_id::uuid;
   if business_charge>0 then insert into charge_history(user_id,master_id,transaction_type,reference_id,amount) values(uid,mid,'BANK_TRANSFER',rid,business_charge);perform record_charge_commission(uid,mid,'BANK_TRANSFER',rid,amt,business_charge);end if;
   insert into bank_transfer_transactions(bank_request_id,bank_reference_number,amount,processed_by,processed_at,remarks) select id,nullif(p_note,''),net_amt,auth.uid(),now(),p_note from bank_transfer_requests where id=p_request_id::uuid;
  elsif a in ('REJECTED','CANCELLED') then update wallets set locked_balance=greatest(locked_balance-amt,0),updated_at=now() where id=wid;update bank_transfer_requests set status=lower(a)::request_status,updated_at=now() where id=p_request_id::uuid;else update bank_transfer_requests set status=lower(a)::request_status,updated_at=now() where id=p_request_id::uuid;end if;
 else raise exception 'Unknown request kind';end if;
 insert into audit_logs(user_id,action,module,reference_id,new_data) values(auth.uid(),a,k,p_request_id,jsonb_build_object('note',coalesce(p_note,''),'request_id',rid));return jsonb_build_object('success',true,'kind',k,'action',a,'request_id',rid);
end$$;
revoke all on function public.process_request(text,text,text,text) from public;grant execute on function public.process_request(text,text,text,text) to authenticated;
