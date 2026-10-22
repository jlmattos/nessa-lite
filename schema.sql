-- nessa-lite schema — run once in the Supabase SQL editor of the nessa-lite project.
-- Deliberately tiny: a visual routine she taps through, one workout per day,
-- and a settings row for how the app should feel. No weights, no progression
-- engine — Jose decides the routine; the app presents it and celebrates it.

create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default '⭐',          -- emoji shown on the card and in the schedule strip
  cue text,                                 -- one gentle reminder, optional
  created_at timestamptz not null default now()
);

create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null,
  created_at timestamptz not null default now()
);

create table if not exists routine_movements (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  movement_id uuid not null references movements(id) on delete cascade,
  position int not null,
  target_reps int,                          -- "10 times" …
  target_secs int,                          -- … or "30 seconds"; both null = "until it feels done"
  unique (routine_id, movement_id)
);

-- One workout per calendar day (in HOME_TZ). completed_at set = the dance is
-- unlocked for that day. routine_name is denormalized so history survives edits.
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  performed_on date not null unique,
  routine_id uuid references routines(id) on delete set null,
  routine_name text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- One row per movement she tapped Done on. A double tap is harmless.
create table if not exists movement_completions (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  movement_id uuid not null references movements(id) on delete cascade,
  reps int,
  secs int,
  created_at timestamptz not null default now(),
  unique (workout_id, movement_id)
);

-- How the app should feel. Single row.
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  sound boolean not null default true,            -- she likes calming sounds
  reduced_motion boolean not null default false,  -- "calm mode"
  updated_at timestamptz not null default now()
);
insert into settings (id) values (1) on conflict (id) do nothing;

create index if not exists movement_completions_workout_idx on movement_completions (workout_id);
create index if not exists routine_movements_routine_idx on routine_movements (routine_id);

-- Lock the public (anon) role out entirely; the app talks to the database
-- server-side with the secret key, which bypasses RLS.
alter table movements enable row level security;
alter table routines enable row level security;
alter table routine_movements enable row level security;
alter table workouts enable row level security;
alter table movement_completions enable row level security;
alter table settings enable row level security;
