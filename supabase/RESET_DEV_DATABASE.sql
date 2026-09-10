-- V COIN CLEAN RESET
-- WARNING: deletes all V Coin public-schema data. It DOES NOT delete Supabase Auth users.
-- Use this only for a development/test project or when you intentionally want a clean install.

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.user_status_history cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.notifications cascade;
drop table if exists public.bank_transfer_transactions cascade;
drop table if exists public.bank_transfer_requests cascade;
drop table if exists public.bank_accounts cascade;
drop table if exists public.crypto_transactions cascade;
drop table if exists public.crypto_conversion_requests cascade;
drop table if exists public.crypto_assets cascade;
drop table if exists public.wallet_maintenance_rules cascade;
drop table if exists public.commissions cascade;
drop table if exists public.commission_rules cascade;
drop table if exists public.charge_history cascade;
drop table if exists public.charge_rules cascade;
drop table if exists public.topup_payments cascade;
drop table if exists public.topup_requests cascade;
drop table if exists public.vcoin_transfers cascade;
drop table if exists public.wallet_transactions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.user_permissions cascade;
drop table if exists public.permissions cascade;
drop table if exists public.system_settings cascade;
drop table if exists public.profiles cascade;

drop function if exists public.current_role() cascade;
drop function if exists public.app_current_role() cascade;
drop function if exists public.has_permission(text) cascade;
drop function if exists public.calc_charge(uuid,text,numeric) cascade;
drop function if exists public.transfer_vcoin(text,numeric,text,text) cascade;
drop function if exists public.admin_adjust_vcoin(text,numeric,text,text,text) cascade;
drop function if exists public.create_topup_request(numeric,text) cascade;
drop function if exists public.create_crypto_request(numeric,text,text) cascade;
drop function if exists public.create_crypto_request(text,numeric,text,text) cascade;
drop function if exists public.create_bank_request(numeric,text,text) cascade;
drop function if exists public.process_request(text,text,text,text) cascade;
drop function if exists public.run_wallet_maintenance() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.make_wallet_address() cascade;

drop type if exists public.request_status cascade;
drop type if exists public.tx_direction cascade;
drop type if exists public.wallet_status cascade;
drop type if exists public.user_status cascade;
drop type if exists public.app_role cascade;

-- After this script succeeds, run schema.sql and then seed.sql.
