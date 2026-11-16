-- Run once in the Supabase SQL editor on a fresh project.
-- RLS is the only thing protecting this data: the site and the publishable key are public.

begin;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  -- No cascade: deleting a person must not silently delete their habits.
  owner_id uuid not null references public.profiles (id),
  name text not null,
  emoji text not null,
  direction text not null check (direction in ('at_least', 'at_most')),
  target integer not null check (target > 0),
  period text not null check (period in ('day', 'week')),
  step integer not null default 1 check (step > 0),
  unit text,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  day date not null,
  value integer not null check (value > 0),
  created_at timestamptz not null default now()
);

create index entries_habit_id_day_idx on public.entries (habit_id, day);

-- Policies on profiles cannot query profiles directly (infinite recursion), so membership goes
-- through this definer function.
create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()));
$$;

revoke execute on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

-- Explicit grants instead of Supabase's default "all to anon and authenticated".
revoke all on public.profiles, public.habits, public.entries from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.habits, public.entries to authenticated;

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.entries enable row level security;

-- profiles: read-only. Rows are inserted by hand in the SQL editor.
create policy "members read profiles" on public.profiles
  for select to authenticated
  using ((select public.is_member()));

-- habits
create policy "members read habits" on public.habits
  for select to authenticated
  using ((select public.is_member()));

create policy "owners insert habits" on public.habits
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_member()));

create policy "owners update habits" on public.habits
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_member()))
  with check (owner_id = (select auth.uid()));

create policy "owners delete habits" on public.habits
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_member()));

-- entries: writable only on habits the caller owns.
create policy "members read entries" on public.entries
  for select to authenticated
  using ((select public.is_member()));

create policy "owners insert entries" on public.entries
  for insert to authenticated
  with check (
    (select public.is_member())
    and exists (select 1 from public.habits h where h.id = habit_id and h.owner_id = (select auth.uid()))
  );

create policy "owners update entries" on public.entries
  for update to authenticated
  using (
    (select public.is_member())
    and exists (select 1 from public.habits h where h.id = habit_id and h.owner_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.habits h where h.id = habit_id and h.owner_id = (select auth.uid()))
  );

create policy "owners delete entries" on public.entries
  for delete to authenticated
  using (
    (select public.is_member())
    and exists (select 1 from public.habits h where h.id = habit_id and h.owner_id = (select auth.uid()))
  );

alter publication supabase_realtime add table public.habits, public.entries;

commit;
