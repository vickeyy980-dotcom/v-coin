-- V Coin cash-out: user requests first, admin offers same/alternate location, user accepts, then admin pays cash.
create table if not exists public.cashout_requests(
 id uuid primary key default gen_random_uuid(), request_id text unique not null, user_id uuid not null references public.profiles(id),
 master_id uuid references public.profiles(id), requested_vcoin numeric(24,8) not null check(requested_vcoin>0),
 cashout_charge numeric(24,8) not null default 0, total_debit numeric(24,8) not null,
 city text not null, area text not null, area_code text not null, token_no text unique not null,
 payment_address text, offered_city text, offered_area text, offered_area_code text, offered_address text,
 status public.request_status not null default 'pending', idempotency_key text unique not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.cashout_requests add column if not exists offered_city text;
alter table public.cashout_requests add column if not exists offered_area text;
alter table public.cashout_requests add column if not exists offered_area_code text;
alter table public.cashout_requests add column if not exists offered_address text;
alter table public.cashout_requests alter column payment_address drop not null;
alter table public.cashout_requests enable row level security;
drop policy if exists cashout_select on public.cashout_requests;
create policy cashout_select on public.cashout_requests for select to authenticated using(user_id=auth.uid() or public.app_current_role() in ('super_admin','admin') or (master_id=auth.uid() and public.app_current_role()='master'));
do $$ begin alter publication supabase_realtime add table public.cashout_requests; exception when duplicate_object then null; end $$;
alter table public.cashout_requests replica identity full;

create or replace function public.create_cashout_token_request(p_requested_vcoin numeric,p_city text,p_area text,p_area_code text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p profiles%rowtype;w wallets%rowtype;rid text;tok text;ch numeric;i int:=0;
begin
 select * into p from profiles where id=auth.uid(); if p.id is null then raise exception 'Not authenticated'; end if;
 if p.status<>'active' then raise exception 'Account not active'; end if;
 if p_requested_vcoin is null or p_requested_vcoin<=0 then raise exception 'Invalid amount'; end if;
 select * into w from wallets where user_id=p.id for update; if w.status<>'active' then raise exception 'Wallet frozen'; end if;
 ch:=calc_charge(p.master_id,'CASH_OUT',p_requested_vcoin);
 if w.vcoin_balance-w.locked_balance < p_requested_vcoin+ch then raise exception 'Insufficient available balance'; end if;
 if exists(select 1 from cashout_requests where idempotency_key=p_idempotency_key) then return (select jsonb_build_object('request_id',request_id,'token_no',token_no,'city',city,'area',area,'area_code',area_code,'amount',requested_vcoin,'charge',cashout_charge,'total_debit',total_debit,'status',status) from cashout_requests where idempotency_key=p_idempotency_key); end if;
 rid:='CSH-'||upper(substr(encode(gen_random_bytes(9),'hex'),1,18));
 loop tok:=lpad((floor(random()*10000000000))::bigint::text,10,'0'); exit when not exists(select 1 from cashout_requests where token_no=tok); i:=i+1;if i>20 then raise exception 'Unable to generate token';end if;end loop;
 insert into cashout_requests(request_id,user_id,master_id,requested_vcoin,cashout_charge,total_debit,city,area,area_code,token_no,status,idempotency_key)
 values(rid,p.id,p.master_id,p_requested_vcoin,ch,p_requested_vcoin+ch,trim(p_city),trim(p_area),trim(p_area_code),tok,'pending',p_idempotency_key);
 insert into notifications(user_id,title,message,type,reference_id) values(p.id,'Cash-out request sent','Your cash-out request is waiting for admin location confirmation.','CASH_OUT',rid);
 return jsonb_build_object('request_id',rid,'token_no',tok,'city',trim(p_city),'area',trim(p_area),'area_code',trim(p_area_code),'amount',p_requested_vcoin,'charge',ch,'total_debit',p_requested_vcoin+ch,'status','pending');
end$$;
grant execute on function public.create_cashout_token_request(numeric,text,text,text,text) to authenticated;

create or replace function public.admin_offer_cashout_location(p_request_id text,p_city text,p_area text,p_area_code text,p_address text,p_note text default '') returns jsonb language plpgsql security definer set search_path=public as $$
declare me profiles%rowtype;r cashout_requests%rowtype;
begin
 select * into me from profiles where id=auth.uid(); if me.role not in ('super_admin','admin','master') or me.status<>'active' then raise exception 'Not authorized'; end if;
 select * into r from cashout_requests where id=p_request_id::uuid for update; if r.id is null then raise exception 'Request not found'; end if;
 if me.role='master' and r.master_id is distinct from me.id then raise exception 'Not your assigned request'; end if;
 if r.status not in ('pending','approved') then raise exception 'Request cannot be offered now'; end if;
 if coalesce(trim(p_city),'')='' or coalesce(trim(p_area),'')='' or coalesce(trim(p_area_code),'')='' or coalesce(trim(p_address),'')='' then raise exception 'City, Area, Area Code and Address are required'; end if;
 if array_length(regexp_split_to_array(trim(p_address),'\\s+'),1)>100 then raise exception 'Address maximum is 100 words'; end if;
 update cashout_requests set offered_city=trim(p_city),offered_area=trim(p_area),offered_area_code=trim(p_area_code),offered_address=trim(p_address),payment_address=trim(p_address),status='approved',updated_at=now() where id=r.id;
 insert into notifications(user_id,title,message,type,reference_id) values(r.user_id,'Cash-out location ready','Admin has offered a cash collection location. Open Cash out and accept the offer.','CASH_OUT',r.request_id);
 insert into audit_logs(user_id,action,module,reference_id,new_data) values(auth.uid(),'LOCATION_OFFER','CASHOUT',r.id::text,jsonb_build_object('city',p_city,'area',p_area,'area_code',p_area_code,'address',p_address,'note',p_note));
 return jsonb_build_object('success',true);
end$$;
grant execute on function public.admin_offer_cashout_location(text,text,text,text,text,text) to authenticated;

create or replace function public.accept_cashout_offer(p_request_id text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r cashout_requests%rowtype;w wallets%rowtype;
begin
 select * into r from cashout_requests where id=p_request_id::uuid and user_id=auth.uid() for update; if r.id is null then raise exception 'Request not found'; end if;
 if r.status<>'approved' or r.offered_address is null then raise exception 'No admin location offer is ready'; end if;
 select * into w from wallets where user_id=r.user_id for update; if w.status<>'active' then raise exception 'Wallet frozen'; end if;
 if w.vcoin_balance-w.locked_balance<r.total_debit then raise exception 'Insufficient available balance'; end if;
 update wallets set locked_balance=locked_balance+r.total_debit,updated_at=now() where id=w.id;
 update cashout_requests set status='processing',updated_at=now() where id=r.id;
 insert into notifications(user_id,title,message,type,reference_id) values(r.user_id,'Cash-out offer accepted','Your V Coin is reserved. Give the token to admin and collect cash.','CASH_OUT',r.request_id);
 return jsonb_build_object('success',true,'token_no',r.token_no,'status','processing');
end$$;
grant execute on function public.accept_cashout_offer(text) to authenticated;

create or replace function public.process_cashout_request(p_request_id text,p_action text,p_note text) returns jsonb language plpgsql security definer set search_path=public as $$
declare me profiles%rowtype;r cashout_requests%rowtype;w wallets%rowtype;a text:=upper(p_action);afterb numeric;
begin
 select * into me from profiles where id=auth.uid();if me.role not in ('super_admin','admin','master') or me.status<>'active' then raise exception 'Not authorized';end if;
 select * into r from cashout_requests where id=p_request_id::uuid for update;if r.id is null then raise exception 'Request not found';end if;
 if me.role='master' and r.master_id is distinct from me.id then raise exception 'Not your assigned request';end if;
 if r.status in ('completed','rejected','cancelled') then raise exception 'Request already finalized';end if;
 select * into w from wallets where user_id=r.user_id for update;
 if a='COMPLETE' then
   if r.status<>'processing' then raise exception 'User must accept the location before cash is paid';end if;
   if w.locked_balance<r.total_debit then raise exception 'Locked balance mismatch';end if;
   afterb:=w.vcoin_balance-r.total_debit;if afterb<0 then raise exception 'Insufficient balance';end if;
   update wallets set vcoin_balance=afterb,locked_balance=locked_balance-r.total_debit,updated_at=now() where id=w.id;
   insert into wallet_transactions(transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,idempotency_key) values(r.request_id||'-D',w.id,'CASH_OUT','DEBIT',r.total_debit,w.vcoin_balance,afterb,r.request_id,'Cash out completed','PROC-'||r.request_id);
   update cashout_requests set status='completed',updated_at=now() where id=r.id;
   if r.cashout_charge>0 then insert into charge_history(user_id,master_id,transaction_type,reference_id,amount) values(r.user_id,r.master_id,'CASH_OUT',r.request_id,r.cashout_charge);perform record_charge_commission(r.user_id,r.master_id,'CASH_OUT',r.request_id,r.requested_vcoin,r.cashout_charge);end if;
   insert into notifications(user_id,title,message,type,reference_id) values(r.user_id,'Cash out completed',r.requested_vcoin||' VC cash out completed','CASH_OUT',r.request_id);
 elsif a in ('REJECTED','CANCELLED') then
   if r.status='processing' then update wallets set locked_balance=greatest(locked_balance-r.total_debit,0),updated_at=now() where id=w.id; end if;
   update cashout_requests set status=lower(a)::request_status,updated_at=now() where id=r.id;
 else raise exception 'Use location offer or COMPLETE/REJECTED action';
 end if;
 insert into audit_logs(user_id,action,module,reference_id,new_data) values(auth.uid(),a,'CASHOUT',p_request_id,jsonb_build_object('note',coalesce(p_note,''),'request_id',r.request_id));
 return jsonb_build_object('success',true,'request_id',r.request_id,'action',a);
end$$;
grant execute on function public.process_cashout_request(text,text,text) to authenticated;

insert into public.charge_rules(master_id,charge_type,charge_mode,charge_value,minimum_charge,maximum_charge,is_active,created_by)
select null,'CASH_OUT','FIXED',0,null,null,true,auth.uid() where not exists(select 1 from public.charge_rules where master_id is null and charge_type='CASH_OUT' and is_active=true);