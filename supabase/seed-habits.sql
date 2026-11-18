-- Run after 0002, on an empty habits table. Not idempotent: running it twice duplicates the habits.

insert into public.habits (owner_id, position, name, emoji, direction, target, busy_target, period, step, unit)
select p.id, h.position, h.name, h.emoji, 'at_least', h.target, h.busy_target, h.period, h.step, h.unit
from public.profiles p
join (values
    ('Tony',  1, 'Glass of water',                '💧', 1,    1,             'day',  1,   null),
    ('Tony',  2, 'Brush teeth',                   '🪥', 1,    1,             'day',  1,   null),
    ('Tony',  3, 'Creatine',                      '🥄', 1,    1,             'day',  1,   null),
    ('Tony',  4, 'Vitamins',                      '💊', 1,    1,             'day',  1,   null),
    ('Tony',  5, 'Handstand balance and kickups', '🤸', 2,    2,             'day',  1,   null),
    ('Tony',  6, 'Crow pose and pike lifts',      '🐦', 2,    2,             'day',  1,   null),
    ('Tony',  7, 'Splits training',               '🦵', 1,    null::integer, 'day',  1,   null),
    ('Tony',  8, 'One-arm pushup practice',       '💪', 3,    3,             'day',  1,   null),
    ('Tony',  9, 'Meditation',                    '🧘', 1,    null,          'day',  1,   null),
    ('Tony', 10, 'Calories',                      '🍽️', 2500, null,          'day',  100, 'kcal'),
    ('Tony', 11, 'Actual workouts',               '🏋️', 4,    null,          'week', 1,   null),
    ('Tony', 12, 'Send Nele a selfie',            '🤳', 1,    1,             'day',  1,   null),
    ('Nele',  1, 'Glasses of Water',              '💧', 5,    3,             'day',  1,   'glasses'),
    ('Nele',  2, 'Skin care routine',             '🧴', 2,    1,             'day',  1,   null),
    ('Nele',  3, 'Eat breakfast before 12',       '🥣', 1,    null,          'day',  1,   null),
    ('Nele',  4, 'Strength training',             '🏋️', 4,    null,          'week', 1,   null),
    ('Nele',  5, 'Send Tony a selfie',            '🤳', 1,    1,             'day',  1,   null)
  ) as h (owner, position, name, emoji, target, busy_target, period, step, unit) on h.owner = p.name;
