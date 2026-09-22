-- V Coin top-up token + payment location workflow. Run once in Supabase SQL Editor.
create table if not exists public.topup_locations(
 id uuid primary key default gen_random_uuid(), city text not null, area text not null, area_code text not null,
 payment_address text not null, is_active boolean not null default true, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(city,area,area_code)
);
alter table public.topup_requests add column if not exists city text;
alter table public.topup_requests add column if not exists area text;
alter table public.topup_requests add column if not exists area_code text;
alter table public.topup_requests add column if not exists token_no text;
alter table public.topup_requests add column if not exists payment_address text;
create unique index if not exists topup_requests_token_no_key on public.topup_requests(token_no) where token_no is not null;
alter table public.topup_locations enable row level security;
drop policy if exists topup_locations_read on public.topup_locations;
create policy topup_locations_read on public.topup_locations for select to authenticated using (is_active=true or public.app_current_role() in ('super_admin','admin'));
drop policy if exists topup_locations_admin_insert on public.topup_locations;
create policy topup_locations_admin_insert on public.topup_locations for insert to authenticated with check (public.app_current_role() in ('super_admin','admin'));
drop policy if exists topup_locations_admin_update on public.topup_locations;
create policy topup_locations_admin_update on public.topup_locations for update to authenticated using (public.app_current_role() in ('super_admin','admin')) with check (public.app_current_role() in ('super_admin','admin'));
do $$ begin alter publication supabase_realtime add table public.topup_locations; exception when duplicate_object then null; end $$;
alter table public.topup_locations replica identity full;
create or replace function public.create_topup_token_request(p_requested_vcoin numeric,p_city text,p_area text,p_area_code text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p profiles%rowtype;loc topup_locations%rowtype;rid text;tok text;ch numeric;i int:=0;
begin
 select * into p from profiles where id=auth.uid(); if p.id is null then raise exception 'Not authenticated'; end if;
 if p.status<>'active' then raise exception 'Account not active'; end if;
 if p_requested_vcoin is null or p_requested_vcoin<=0 then raise exception 'Invalid amount'; end if;
 select * into loc from topup_locations where is_active=true and lower(city)=lower(trim(p_city)) and lower(area)=lower(trim(p_area)) and lower(area_code)=lower(trim(p_area_code)) limit 1;
 if loc.id is null then raise exception 'No payment address configured for this City / Area / Area Code'; end if;
 if exists(select 1 from topup_requests where idempotency_key=p_idempotency_key) then
  return (select jsonb_build_object('request_id',request_id,'token_no',token_no,'address',payment_address,'city',city,'area',area,'area_code',area_code,'amount',requested_vcoin,'charge',topup_charge,'total_payment',total_payment,'status',status) from topup_requests where idempotency_key=p_idempotency_key);
 end if;
 ch:=calc_charge(p.master_id,'VCOIN_TOPUP',p_requested_vcoin); rid:='TOP-'||upper(substr(encode(gen_random_bytes(9),'hex'),1,18));
 loop tok:=lpad((floor(random()*10000000000))::bigint::text,10,'0'); exit when not exists(select 1 from topup_requests where token_no=tok); i:=i+1; if i>20 then raise exception 'Unable to generate token'; end if; end loop;
 insert into topup_requests(request_id,user_id,master_id,requested_vcoin,topup_charge,total_payment,idempotency_key,city,area,area_code,token_no,payment_address,status)
 values(rid,p.id,p.master_id,p_requested_vcoin,ch,p_requested_vcoin+ch,p_idempotency_key,trim(p_city),trim(p_area),trim(p_area_code),tok,loc.payment_address,'pending');
 return jsonb_build_object('request_id',rid,'token_no',tok,'address',loc.payment_address,'city',trim(p_city),'area',trim(p_area),'area_code',trim(p_area_code),'amount',p_requested_vcoin,'charge',ch,'total_payment',p_requested_vcoin+ch,'status','pending');
end$$;
grant execute on function public.create_topup_token_request(numeric,text,text,text,text) to authenticated;