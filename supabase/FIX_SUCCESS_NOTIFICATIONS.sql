-- V Coin success notification patch
-- Run this ONCE in Supabase SQL Editor AFTER NET_AMOUNT_CHARGE_ACCOUNTING.sql
-- This keeps wallet/accounting rules unchanged and only adds reliable success notifications.

-- 1) Generic trigger for TOPUP / CRYPTO / BANK when status changes to completed.
create or replace function public.notify_request_completed()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  n_title text;
  n_message text;
  n_type text;
  n_ref text;
  n_user uuid;
begin
  if new.status::text <> 'completed' or coalesce(old.status::text,'') = 'completed' then
    return new;
  end if;

  n_user := new.user_id;
  n_ref := new.request_id;

  if tg_table_name='topup_requests' then
    n_title := 'Top up successful';
    n_type := 'TOPUP';
    n_message := greatest(new.requested_vcoin-new.topup_charge,0)||' VC added to your wallet successfully.';
  elsif tg_table_name='crypto_conversion_requests' then
    n_title := 'Crypto transfer successful';
    n_type := 'CRYPTO';
    n_message := 'Your crypto transfer of '||new.vcoin_amount||' VC was completed successfully.';
  elsif tg_table_name='bank_transfer_requests' then
    n_title := 'Bank transfer successful';
    n_type := 'BANK';
    n_message := 'Your bank transfer was completed successfully. Wallet debit: '||new.vcoin_amount||' VC; bank amount: '||greatest(new.vcoin_amount-new.transfer_charge,0)||' VC.';
  else
    return new;
  end if;

  if not exists(select 1 from notifications where user_id=n_user and type=n_type and reference_id=n_ref and title=n_title) then
    insert into notifications(user_id,title,message,type,reference_id)
    values(n_user,n_title,n_message,n_type,n_ref);
  end if;
  return new;
end$$;

drop trigger if exists notify_topup_completed on public.topup_requests;
create trigger notify_topup_completed after update of status on public.topup_requests
for each row execute function public.notify_request_completed();

drop trigger if exists notify_crypto_completed on public.crypto_conversion_requests;
create trigger notify_crypto_completed after update of status on public.crypto_conversion_requests
for each row execute function public.notify_request_completed();

drop trigger if exists notify_bank_completed on public.bank_transfer_requests;
create trigger notify_bank_completed after update of status on public.bank_transfer_requests
for each row execute function public.notify_request_completed();

-- 2) Cash-out completion notification.
create or replace function public.notify_cashout_completed()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status::text='completed' and coalesce(old.status::text,'')<>'completed' then
    if not exists(select 1 from notifications where user_id=new.user_id and type='CASH_OUT' and reference_id=new.request_id and title='Cash out successful') then
      insert into notifications(user_id,title,message,type,reference_id)
      values(new.user_id,'Cash out successful','Your cash out was completed successfully. Cash amount: '||greatest(new.requested_vcoin-new.cashout_charge,0)||' VC.','CASH_OUT',new.request_id);
    end if;
  end if;
  return new;
end$$;

drop trigger if exists notify_cashout_completed on public.cashout_requests;
create trigger notify_cashout_completed after update of status on public.cashout_requests
for each row execute function public.notify_cashout_completed();

-- 3) V Coin received notification is already written by transfer_vcoin.
-- This trigger is a fallback so every completed receiver credit has a notification,
-- even if a future transfer function forgets to insert one.
create or replace function public.notify_vcoin_received()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare uid uuid; sender_name text;
begin
  if new.transaction_type='TRANSFER_RECEIVE' and new.direction::text='CREDIT' then
    select user_id into uid from wallets where id=new.wallet_id;
    sender_name := nullif(substring(coalesce(new.description,'') from 'Transfer from @([^; ]+)'),'');
    if not exists(select 1 from notifications where user_id=uid and type='TRANSFER' and reference_id=new.reference_id) then
      insert into notifications(user_id,title,message,type,reference_id)
      values(uid,'V Coin received',new.amount||' VC received'||case when sender_name is not null then ' from @'||sender_name else '' end,'TRANSFER',new.reference_id);
    end if;
  end if;
  return new;
end$$;

drop trigger if exists notify_vcoin_received on public.wallet_transactions;
create trigger notify_vcoin_received after insert on public.wallet_transactions
for each row execute function public.notify_vcoin_received();

-- RLS: users can see and mark only their own notifications.
alter table public.notifications enable row level security;
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated using(user_id=auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

grant select,update on public.notifications to authenticated;

-- Ensure notifications can be delivered by Supabase Realtime.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
