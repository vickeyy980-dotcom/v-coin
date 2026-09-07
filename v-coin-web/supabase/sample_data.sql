-- V Coin optional TEST DATA helper
-- Run schema.sql first. Then create test users through /signup or Supabase Auth.
-- After those users exist, you can credit a TEST wallet for development.
-- NEVER use manual balance updates as a production minting workflow.

-- Example (uncomment and replace the handle):
-- update public.wallets w
-- set balance = 1000.00
-- from public.profiles p
-- where p.id = w.user_id
--   and p.handle = 'your_test_handle';

-- Check users and wallets:
select p.handle, p.full_name, w.address, w.balance, w.currency, w.created_at
from public.profiles p
join public.wallets w on w.user_id = p.id
order by w.created_at desc;
