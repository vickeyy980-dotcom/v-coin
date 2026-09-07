-- V Coin — Supabase database setup
-- Run this entire file in Supabase Dashboard -> SQL Editor -> New query.
-- Safe to run again: policies/triggers/functions are recreated where needed.

create extension if not exists pgcrypto;

-- ================================================================
-- 1. PROFILES
-- ================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique not null,
  full_name text,
  created_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,24}$')
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by anyone signed in" on public.profiles;
create policy "profiles are viewable by anyone signed in"
  on public.profiles for select to authenticated using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ================================================================
-- 2. WALLETS
-- ================================================================
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users (id) on delete cascade,
  address text unique not null default encode(gen_random_bytes(16), 'hex'),
  balance numeric(18, 2) not null default 0 check (balance >= 0),
  currency text not null default 'VC',
  created_at timestamptz not null default now()
);

alter table public.wallets enable row level security;

drop policy if exists "users can view their own wallet" on public.wallets;
create policy "users can view their own wallet"
  on public.wallets for select to authenticated
  using (user_id = auth.uid());

-- No client insert/update/delete wallet policies. Balances are changed only
-- by the SECURITY DEFINER transfer function below.

-- ================================================================
-- 3. TRANSACTIONS
-- ================================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  sender_wallet_id uuid not null references public.wallets (id),
  receiver_wallet_id uuid not null references public.wallets (id),
  amount numeric(18, 2) not null check (amount > 0),
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists transactions_sender_created_idx
  on public.transactions (sender_wallet_id, created_at desc);
create index if not exists transactions_receiver_created_idx
  on public.transactions (receiver_wallet_id, created_at desc);

alter table public.transactions enable row level security;

drop policy if exists "users can view transactions they sent or received" on public.transactions;
create policy "users can view transactions they sent or received"
  on public.transactions for select to authenticated
  using (
    sender_wallet_id in (select id from public.wallets where user_id = auth.uid())
    or receiver_wallet_id in (select id from public.wallets where user_id = auth.uid())
  );

-- ================================================================
-- 4. CREATE PROFILE + WALLET AUTOMATICALLY AFTER AUTH SIGNUP
-- Uses signup metadata sent by app/signup/page.tsx.
-- If a requested handle is already used, a short random suffix is added.
-- ================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_handle text;
  final_handle text;
begin
  requested_handle := lower(coalesce(new.raw_user_meta_data->>'handle', ''));
  requested_handle := regexp_replace(requested_handle, '[^a-z0-9_]', '', 'g');

  if length(requested_handle) < 3 then
    requested_handle := 'user_' || substr(new.id::text, 1, 8);
  end if;

  requested_handle := left(requested_handle, 24);
  final_handle := requested_handle;

  if exists (select 1 from public.profiles where handle = final_handle) then
    final_handle := left(requested_handle, 17) || '_' || substr(new.id::text, 1, 6);
  end if;

  insert into public.profiles (id, handle, full_name)
  values (
    new.id,
    final_handle,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill users that existed before this schema/trigger was installed.
insert into public.profiles (id, handle, full_name)
select
  u.id,
  'user_' || substr(u.id::text, 1, 8),
  nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict do nothing;

insert into public.wallets (user_id)
select u.id
from auth.users u
where not exists (select 1 from public.wallets w where w.user_id = u.id)
on conflict do nothing;

-- ================================================================
-- 5. ATOMIC P2P TRANSFER
-- receiver_handle accepts either a user's handle (with/without @) OR the
-- wallet address contained in the Receive QR code.
-- ================================================================
create or replace function public.transfer_funds(
  receiver_handle text,
  transfer_amount numeric
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_wallet public.wallets;
  receiver_wallet public.wallets;
  new_transaction public.transactions;
  recipient text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if transfer_amount is null or transfer_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  -- Currency supports 2 decimals in this MVP.
  if transfer_amount <> round(transfer_amount, 2) then
    raise exception 'Amount can have at most 2 decimal places';
  end if;

  recipient := trim(receiver_handle);
  if recipient = '' then
    raise exception 'Recipient is required';
  end if;

  select * into sender_wallet
  from public.wallets
  where user_id = auth.uid()
  for update;

  if sender_wallet is null then
    raise exception 'Sender wallet not found';
  end if;

  select w.* into receiver_wallet
  from public.wallets w
  join public.profiles p on p.id = w.user_id
  where lower(p.handle) = lower(trim(leading '@' from recipient))
     or w.address = recipient
  limit 1
  for update of w;

  if receiver_wallet is null then
    raise exception 'Recipient not found';
  end if;

  if receiver_wallet.id = sender_wallet.id then
    raise exception 'Cannot send funds to yourself';
  end if;

  if sender_wallet.currency <> receiver_wallet.currency then
    raise exception 'Wallet currencies do not match';
  end if;

  if sender_wallet.balance < transfer_amount then
    raise exception 'Insufficient balance';
  end if;

  update public.wallets
  set balance = balance - transfer_amount
  where id = sender_wallet.id;

  update public.wallets
  set balance = balance + transfer_amount
  where id = receiver_wallet.id;

  insert into public.transactions (sender_wallet_id, receiver_wallet_id, amount, status)
  values (sender_wallet.id, receiver_wallet.id, transfer_amount, 'completed')
  returning * into new_transaction;

  return new_transaction;
end;
$$;

revoke all on function public.transfer_funds(text, numeric) from public;
revoke all on function public.transfer_funds(text, numeric) from anon;
grant execute on function public.transfer_funds(text, numeric) to authenticated;
