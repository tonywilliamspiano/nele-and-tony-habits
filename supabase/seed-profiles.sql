-- Run after 0001_init.sql. Replace both placeholders with the user ids (UUIDs) shown in
-- Authentication -> Users for tony@habits.invalid and nele@habits.invalid.

insert into public.profiles (id, name) values
  ('TONY_USER_ID', 'Tony'),
  ('NELE_USER_ID', 'Nele');
