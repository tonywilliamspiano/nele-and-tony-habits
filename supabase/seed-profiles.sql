-- Run after 0001_init.sql, once both users exist in Authentication -> Users.

insert into public.profiles (id, name)
select id, initcap(split_part(email, '@', 1))
from auth.users
where email in ('tony@habits.invalid', 'nele@habits.invalid');
