-- Sign up in the app first, then replace the email below and run this file once.
update public.profiles
set role='admin'::public.app_role, status='active'::public.user_status, updated_at=now()
where id=(select id from auth.users where lower(email)=lower('YOUR-ADMIN-EMAIL@example.com') limit 1);

select p.username,p.full_name,p.role,p.status,u.email
from public.profiles p
join auth.users u on u.id=p.id
where lower(u.email)=lower('YOUR-ADMIN-EMAIL@example.com');
