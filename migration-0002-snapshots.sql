-- nessa-lite migration 0002 (Phase 2 review): snapshots so rosettes can't be
-- lost and posters never change. Additive only; safe to run on the live
-- project. Applied through the Supabase connector on 24 Oct 2026.
--
-- The look columns on rehearsals stay editable all evening (free play after
-- "Open the curtains"), so the look a dance was first danced in is kept here.
alter table rehearsals
  add column if not exists danced_costume text null,   -- costume at the evening's first "Start the dance"
  add column if not exists danced_stage   text null,   -- stage at the same moment
  -- Written once, in the update that sets recital_program: the poster dances of
  -- that Program and of any skipped Program before it, { "<program>": [[move, ...], ...] }.
  add column if not exists poster_dances  jsonb null;

-- The "100 moves" rosette counts completed movements; undo and Reopen lower
-- the live count, so the highest count reached is kept, like high_water_n.
alter table settings
  add column if not exists high_water_moves int not null default 0;
