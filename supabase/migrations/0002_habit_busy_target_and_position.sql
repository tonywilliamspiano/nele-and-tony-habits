alter table public.habits
  -- Target on a busy day; null means the habit rests that day.
  add column busy_target integer check (busy_target > 0 and busy_target <= target),
  -- Display order within one owner's list. Seeded rows share a created_at, so that cannot order them.
  add column position integer not null default 0;
