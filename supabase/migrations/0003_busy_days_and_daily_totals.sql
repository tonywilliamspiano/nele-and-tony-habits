create table public.busy_days (
  owner_id uuid not null references public.profiles (id),
  day date not null,
  primary key (owner_id, day)
);

revoke all on public.busy_days from anon, authenticated;
grant select, insert, delete on public.busy_days to authenticated;

alter table public.busy_days enable row level security;

create policy "members read busy days" on public.busy_days
  for select to authenticated
  using ((select public.is_member()));

create policy "owners insert busy days" on public.busy_days
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_member()));

create policy "owners delete busy days" on public.busy_days
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_member()));

alter publication supabase_realtime add table public.busy_days;

-- One row per habit and day, so streak history stays under the API's 1000-row page.
-- security_invoker: the caller's row-level security on entries applies.
create view public.daily_totals with (security_invoker = true) as
  select habit_id, day, sum(value)::integer as total
  from public.entries
  group by habit_id, day;

revoke all on public.daily_totals from anon, authenticated;
grant select on public.daily_totals to authenticated;
