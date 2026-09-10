-- Optional: run after schema.sql if Auth already contains users created before this schema.
insert into public.profiles(id,username,full_name,email,role,status)
select
  u.id,
  coalesce(
    nullif(lower(u.raw_user_meta_data->>'username'),''),
    nullif(lower(u.raw_user_meta_data->>'handle'),''),
    lower(split_part(coalesce(u.email,'user'), '@', 1)) || '_' || substr(u.id::text,1,6)
  ),
  coalesce(nullif(u.raw_user_meta_data->>'full_name',''), split_part(coalesce(u.email,'User'),'@',1)),
  u.email,
  'user'::public.app_role,
  'active'::public.user_status
from auth.users u
where not exists (select 1 from public.profiles p where p.id=u.id)
on conflict (id) do nothing;

insert into public.wallets(user_id,wallet_address)
select p.id, public.make_wallet_address()
from public.profiles p
where not exists (select 1 from public.wallets w where w.user_id=p.id);
