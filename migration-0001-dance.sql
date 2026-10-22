-- migration-0001-dance.sql — run in the nessa-lite Supabase SQL editor after schema.sql.
-- The stage (GAME-DESIGN.md §8): what she chooses each evening, the dances she
-- makes, the "Done for today" curtain, and the stage preferences. Everything
-- else about the game is derived from the completed-workout count.

-- "Done for today" closes the curtains for the day; "Open the curtains" clears it.
alter table workouts add column if not exists stage_closed_at timestamptz null;

-- Dances: the two presets plus everything she makes in the editor.
create table if not exists dances (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  moves text[] not null check (array_length(moves, 1) between 1 and 12),
  is_preset boolean not null default false,
  preset_key text unique null,
  created_at timestamptz not null default now(),
  archived_at timestamptz null                                        -- "Put away"
);
insert into dances (name, moves, is_preset, preset_key) values
  ('Little Waltz', '{plie,reach,twirl,plie,reach,arabesque}', true, 'little_waltz'),
  ('Twirl Song',   '{reach,twirl,arabesque,twirl}',          true, 'twirl_song')
on conflict (preset_key) do nothing;

-- One row per evening on the stage: her look, and a snapshot of what she danced.
create table if not exists rehearsals (
  workout_id      uuid primary key references workouts(id) on delete cascade,
  costume         text not null default 'classic',
  stage           text not null default 'practice_room',
  music           text not null default 'music_box',                   -- 'quiet' allowed
  sparkle         text not null default 'gold',                        -- 'none' allowed
  dance_id        uuid null references dances(id) on delete set null,  -- null = Pirouette's choice
  dance_name      text null,                                           -- snapshot at "Start the dance"
  moves           text[] null,                                         -- snapshot of what was performed
  recital_program int  unique null,                                    -- set at "Start the recital" only
  sparkles_caught int  not null default 0,
  danced_at       timestamptz null                                     -- set at "Start the dance" / "Start the recital"
);

-- Stage preferences (the Friends tab card) and the unlock high-water mark.
alter table settings
  add column if not exists music          boolean not null default true,
  add column if not exists volume         text    not null default 'soft'  check (volume in ('soft','medium')),
  add column if not exists sparkle_amount text    not null default 'lots'  check (sparkle_amount in ('some','lots')),
  add column if not exists sparkle_taps   boolean not null default true,   -- Jose: on from the first evening
  add column if not exists sparkle_count  boolean not null default false,
  add column if not exists bow_showers    boolean not null default true,
  add column if not exists high_water_n   int     not null default 0;      -- highest N ever reached; bumped at Finish, never lowered

alter table dances enable row level security;
alter table rehearsals enable row level security;
