-- V Coin cash-out token workflow. Run once in Supabase SQL Editor AFTER TOPUP_TOKEN_LOCATIONS.sql.
create table if not exists public.cashout_requests(
 id uuid primary key default gen_random_uuid(), request_id text unique not null, user_id uuid not null references public.profiles(id),
 master_id uuid references public.profiles(id), requested_vcoin numeric(24,8) not null check(requested_vcoin>0),
 cashout_charge numeric(24,8) not null default 0, total_debit numeric(24,8) not null,
 city text not null, area text not null, area_code text not null, token_no text unique not null, payment_address text not null,
 status public.request_status not null default 'pending', idempotency_key text unique not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.cashout_requests enable row level security;
drop policy if exists cashout_select on public.cashout_requests;
create policy cashout_select on public.cashout_requests for select to authenticated using(user_id=auth.uid() or public.app_current_role() in ('super_admin','admin') or (master_id=auth.uid() and public.app_current_role()='master'));
do $$ begin alter publication supabase_realtime add table public.cashout_requests; exception when duplicate_object then null; end $$;
alter table public.cashout_requests replica identity full;

create or replace function public.create_cashout_token_request(p_requested_vcoin numeric,p_city text,p_area text,p_area_code text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p profiles%rowtype;w wallets%rowtype;loc topup_locations%rowtype;rid text;tok text;ch numeric;i int:=0;
begin
 select * into p from profiles where id=auth.uid(); if p.id is null then raise exception 'Not authenticated'; end if;
 if p.status<>'active' then raise exception 'Account not active'; end if;
 if p_requested_vcoin is null or p_requested_vcoin<=0 then raise exception 'Invalid amount'; end if;
 select * into w from wallets where user_id=p.id for update; if w.status<>'active' then raise exception 'Wallet frozen'; end if;
 ch:=calc_charge(p.master_id,'CASH_OUT',p_requested_vcoin);
 if w.vcoin_balance-w.locked_balance < p_requested_vcoin+ch then raise exception 'Insufficient available balance'; end if;
 select * into loc from topup_locations where is_active=true and lower(city)=lower(trim(p_city)) and lower(area)=lower(trim(p_area)) and lower(area_code)=lower(trim(p_area_code)) limit 1;
 if loc.id is null then raise exception 'No cash-out location configured for this City / Area / Area Code'; end if;
 if exists(select 1 from cashout_requests where idempotency_key=p_idempotency_key) then return (select jsonb_build_object('request_id',request_id,'token_no',token_no,'address',payment_address,'city',city,'area',area,'area_code',area_code,'amount',requested_vcoin,'charge',cashout_charge,'total_debit',total_debit,'status',status) from cashout_requests where idempotency_key=p_idempotency_key); end if;
 rid:='CSH-'||upper(substr(encode(gen_random_bytes(9),'hex'),1,18));
 loop tok:=lpad((floor(random()*10000000000))::bigint::text,10,'0'); exit when not exists(select 1 from cashout_requests where token_no=tok); i:=i+1;if i>20 then raise exception 'Unable to generate token';end if;end loop;
 update wallets set locked_balance=locked_balance+p_requested_vcoin+ch,updated_at=now() where id=w.id;
 insert into cashout_requests(request_id,user_id,master_id,requested_vcoin,cashout_charge,total_debit,city,area,area_code,token_no,payment_address,status,idempotency_key)
 values(rid,p.id,p.master_id,p_requested_vcoin,ch,p_requested_vcoin+ch,trim(p_city),trim(p_area),trim(p_area_code),tok,loc.payment_address,'pending',p_idempotency_key);
 return jsonb_build_object('request_id',rid,'token_no',tok,'address',loc.payment_address,'city',trim(p_city),'area',trim(p_area),'area_code',trim(p_area_code),'amount',p_requested_vcoin,'charge',ch,'total_debit',p_requested_vcoin+ch,'status','pending');
end$$;
grant execute on function public.create_cashout_token_request(numeric,text,text,text,text) to authenticated;

create or replace function public.process_cashout_request(p_request_id text,p_action text,p_note text) returns jsonb language plpgsql security definer set search_path=public as $$
declare me profiles%rowtype;r cashout_requests%rowtype;w wallets%rowtype;a text:=upper(p_action);afterb numeric;
begin
 select * into me from profiles where id=auth.uid();if me.role not in ('super_admin','admin','master') or me.status<>'active' then raise exception 'Not authorized';end if;
 select * into r from cashout_requests where id=p_request_id::uuid for update;if r.id is null then raise exception 'Request not found';end if;
 if me.role='master' and r.master_id is distinct from me.id then raise exception 'Not your assigned request';end if;
 if r.status in ('completed','rejected','cancelled') then raise exception 'Request already finalized';end if;
 select * into w from wallets where user_id=r.user_id for update;
 if a='COMPLETE' then
   if w.locked_balance<r.total_debit then raise exception 'Locked balance mismatch';end if;
   afterb:=w.vcoin_balance-r.total_debit;if afterb<0 then raise exception 'Insufficient balance';end if;
   update wallets set vcoin_balance=afterb,locked_balance=locked_balance-r.total_debit,updated_at=now() where id=w.id;
   insert into wallet_transactions(transaction_id,wallet_id,transaction_type,direction,amount,balance_before,balance_after,reference_id,description,idempotency_key)
   values(r.request_id||'-D',w.id,'CASH_OUT','DEBIT',r.total_debit,w.vcoin_balance,afterb,r.request_id,'Cash out completed','PROC-'||r.request_id);
   update cashout_requests set status='completed',updated_at=now() where id=r.id;
   if r.cashout_charge>0 then insert into charge_history(user_id,master_id,transaction_type,reference_id,amount) values(r.user_id,r.master_id,'CASH_OUT',r.request_id,r.cashout_charge);perform record_charge_commission(r.user_id,r.master_id,'CASH_OUT',r.request_id,r.requested_vcoin,r.cashout_charge);end if;
   insert into notifications(user_id,title,message,type,reference_id) values(r.user_id,'Cash out completed',r.requested_vcoin||' VC cash out completed','CASH_OUT',r.request_id);
 elsif a in ('REJECTED','CANCELLED') then
   update wallets set locked_balance=greatest(locked_balance-r.total_debit,0),updated_at=now() where id=w.id;
   update cashout_requests set status=lower(a)::request_status,updated_at=now() where id=r.id;
 else update cashout_requests set status=lower(a)::request_status,updated_at=now() where id=r.id;
 end if;
 insert into audit_logs(user_id,action,module,reference_id,new_data) values(auth.uid(),a,'CASHOUT',p_request_id,jsonb_build_object('note',coalesce(p_note,''),'request_id',r.request_id));
 return jsonb_build_object('success',true,'request_id',r.request_id,'action',a);
end$$;
grant execute on function public.process_cashout_request(text,text,text) to authenticated;

insert into public.charge_rules(master_id,charge_type,charge_mode,charge_value,minimum_charge,maximum_charge,is_active,created_by)
select null,'CASH_OUT','FIXED',0,null,null,true,auth.uid()
where not exists(select 1 from public.charge_rules where master_id is null and charge_type='CASH_OUT' and is_active=true);
