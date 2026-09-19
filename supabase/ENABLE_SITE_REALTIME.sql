-- V Coin realtime publication patch
-- Safe to run more than once.
do $$
declare t text;
begin
  foreach t in array array[
    'wallets','wallet_transactions','topup_requests',
    'crypto_conversion_requests','bank_transfer_requests',
    'notifications','commissions'
  ]
  loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I replica identity full',t);
      if not exists (
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename=t
      ) then
        execute format('alter publication supabase_realtime add table public.%I',t);
      end if;
    end if;
  end loop;
end $$;

select schemaname,tablename
from pg_publication_tables
where pubname='supabase_realtime'
and tablename in ('wallets','wallet_transactions','topup_requests','crypto_conversion_requests','bank_transfer_requests','notifications','commissions')
order by tablename;
