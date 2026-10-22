# nessa-lite

Nessa's workout app. Nessa is 13 and autistic. She loves lift-lite, the app
her dad Jose built for her mom Meghan — especially the little cat figurines
and the rewards — and asked for her own app where finishing a workout earns a
game with a ballerina cat. The cat is Pirouette.

This repo began as a trimmed copy of lift-lite (same stack, theme, and cat
art) with fresh git history. Nothing from Meghan's data came along, and
nothing here should ever reach back into lift-lite.

**Who the app is for.** Nessa taps through her workout on an iPad and plays.
Jose builds the routine in the Routine tab and sets preferences. Jose knows
what works for her; when a design choice depends on how she experiences
things, ask him rather than reasoning from "autism" in general.

## Design principles

- **Predictable.** Same four tabs in the same order, same card layout, same
  words every day. Nothing rearranges itself or appears unannounced.
- **A visual schedule.** Today shows every step of the session as an icon
  strip with the current step highlighted and the dance at the end, then the
  same steps as big cards. She can always see where she is and what is next.
- **Clear beginning and ending.** Start → steps → Finish → Stage. Finishing
  is one explicit tap with a confirmation, and it unlocks the dance for that day.
- **Nothing can be done wrong.** Every action is undoable in one tap. The
  app never scores, times, or penalizes a workout. Partial sessions can still
  be finished.
- **Sparkle and calm sounds, both controllable.** She loves sparkle and likes
  calming sounds. Soft synthesized chimes are on by default; "calm mode"
  turns every animation off and is honoured in CSS from the root element.
  Never add sound that plays without a tap, and never add motion that can't
  be switched off by calm mode.
- **Literal, short copy.** Plain words, no jokes that need decoding, no
  figurative instructions. Celebrate warmly but not loudly.
- **She never decides what the app can decide.** One clear next action per
  screen. Choice lives in the game, not in the workout.
- **The more workouts, the better the game gets.** Rewards are derived from
  workout history. See `GAME-DESIGN.md`.

## The game (read GAME-DESIGN.md before touching /dance)

`GAME-DESIGN.md` is the source of truth for everything on the stage. It came
out of a judged design pass (four independent proposals, three judges, two
adversarial critiques) and is written to be built from directly. The short
version:

- **Recital Season.** One finished workout is one rehearsal. Five workouts
  (by count, never by calendar) make a Program; the fifth is recital day.
  Ten Programs are Season One (50 workouts, same cap as the cat shelf).
- **One fixed stage session**, drawn with the same schedule strip as Today:
  Get ready (costume, stage, music, sparkle style) · Choose a dance
  (presets, her saved dances, the editor from workout 7) · Dance (the
  performance, with the Sparkle catch layer on from the first evening) · Bow
  ("The end.", then "Done for today"). No menu of games.
- **Everything is derived** from the completed-workout count and the rows
  she creates (`dances`, `rehearsals`), exactly like the cats. Unlocks use a
  persisted high-water mark so nothing ever relocks.
- **A number she has seen never changes.** Catalog items carry `shipped`;
  an unshipped item shows no workout number and the "Next:" line skips it.
- **One new thing per workout at most**, never on a cat day or a recital day.
- **Motion budget and sound rules** are in §7 of the doc and are not optional.
- **Build order** is §9: Phase 0 is an iPad spike of the Pirouette rig and
  one music loop on the real device before anything else ships.
- **Recital day is marked big**: the Dance step becomes a larger gold star
  labelled "Recital" on both strips (Jose's call).
- **Calm mode is a kill switch only.** Jose: she does not need it. New
  animation classes still go in the calm block; per-move static poses are
  not built.
- **§10 records Jose's decisions** on the twenty open questions (22 Oct 2026).
  If one changes, change the doc first, then the code.

Status: Phase 0 is built (the rig, five moves including Big spin, the Bow,
two loops, the beat clock) and waits for Jose's iPad test at `/spike`.
`/dance` still shows only a Twirl button, and none of the §8 tables exist
yet. The copy already uses the doc's names ("Stage" tab, "Go to the stage",
"Finish today's workout?").

## Commands

```bash
npm run dev -- --port 3002    # dev server (matches .claude/launch.json)
npm run typecheck             # next typegen && tsc --noEmit — the only automated check
npm run build
node scripts/backup.mjs       # dump every table to backups/ (needs Supabase env)
```

Env vars (`.env.local` locally, Vercel in prod; never committed):
`SUPABASE_URL` (or lift-lite's `NEXT_PUBLIC_SUPABASE_URL`; either is read),
`SUPABASE_SECRET_KEY`, optional `HOME_TZ` (default `America/New_York`). Cloud sessions have none unless added as
environment secrets; without them the app builds and the layout still
renders (settings fall back to defaults), but every data query throws.

## Layout

- `src/app/` — App Router, all pages `force-dynamic`. Tabs: `/` Today,
  `/dance` Pirouette's stage (tab label "Stage"), `/collection` cat friends + stats + preferences,
  `/routine` the editor Jose uses. `layout.tsx` reads settings and sets
  `data-reduced-motion` on `<html>`.
- `src/actions/*.ts` — server actions (`"use server"`), the only place the
  database is touched. `workouts.ts` builds the Today screen and handles
  start / done / undo / finish; `routine.ts` is the editor; `progress.ts`
  feeds the collection page; `dance.ts` says whether today is unlocked;
  `settings.ts` never throws.
- `src/components/` — `today-view.tsx` (schedule strip, movement cards,
  finish flow), `dance-stage.tsx`, `cats.tsx` (the ten figurine cats,
  unchanged from lift-lite), `routine-editor.tsx`, `collection-view.tsx`,
  `settings-card.tsx`, `bottom-nav.tsx`, `number-input.tsx`.
- `src/components/dance/` — `pirouette.tsx` (the rig: named SVG groups moved
  by `data-move`, costume colours as CSS variables) and `spike-view.tsx` (the
  Phase 0 test harness behind `/spike`, off the nav, no database needed).
  Remove the spike once Phase 1a replaces the Twirl button.
- `src/lib/` — `collection.ts` (cats by workout count), `sound.ts` (the one
  AudioContext, master gain + low-pass, chimes and notes), `music.ts` (the
  beat-clock sequencer and the song loops), `dance-player.ts`
  (`useDancePlayer`: drives the rig from the clock, Bow at the end, stops on
  hide/unmount), `dance-content.ts` (the stage catalog: moves, presets),
  `settings.ts` (type + defaults), `dates.ts` (`todayLocal`), `format.ts`,
  `db.ts` (lazy Supabase client, server-only).
- `schema.sql` — run by hand in the Supabase SQL editor. No migration
  runner; add numbered `migration-000N-*.sql` files for schema changes.
- `scripts/backup.mjs` + `.github/workflows/backup.yml` — nightly snapshot to
  `backups/latest.json`. The schedule is on; the job skips cleanly until the
  repository secrets exist (Jose wants backups).
- `GAME-DESIGN.md` — the dance game: arc, mini-games, unlocks, build phases.
  Read it before touching anything under `/dance`.
- `docs/setup.md` — Jose's step-by-step for Supabase, Vercel, backup secrets
  and the iPad home screen.

## Domain rules the code depends on

- One workout per calendar day in `HOME_TZ`, keyed by `workouts.performed_on`
  (`todayLocal()`). Never derive a day from `toISOString()`; the server runs in UTC.
- `workouts.completed_at` set = the dance is unlocked for that day. Reopen
  clears it. That is the only gate on `/dance`.
- A movement is "done" when a `movement_completions` row exists for
  (workout, movement). The unique index makes double taps harmless; undo
  deletes the row.
- Targets are `target_reps` OR `target_secs`; both null reads as "until it
  feels done". Nothing enforces them.
- Movements are shared across routines and found by name, case-insensitive.
  Routine names are denormalized onto workouts (`routine_name`).
- Rotation suggests the routine after the last completed workout's routine,
  by position, wrapping. A day she doesn't open the app is simply a rest day.
- Cat friends are derived from the total completed-workout count
  (`computeEarnedCats`), no table. Keep game rewards derived the same way
  unless she creates something that must be saved.
- Settings is a single row (`id = 1`). `sound` defaults true,
  `reduced_motion` false.

## Conventions

- TypeScript strict. Supabase rows come back untyped; cast at the edge
  (`r.x as string`) and use an `eslint-disable` comment where a joined
  relation needs `any`, as the existing code does.
- Tailwind v4 with theme tokens in `globals.css` (`bg-surface`, `text-muted`,
  `text-accent-deep`, `border-line`, `rounded-[1.25rem]` cards). Light theme
  only. Target is an iPad: `max-w-lg`, tap targets at least 44 px, primary
  buttons `h-14` to `h-16`.
- Every animation uses a class listed in a calm-mode block in `globals.css`
  (one for the app classes, one for the rig). Add any new animation class or
  `data-move` selector there. Rig moves animate inner groups with 2D
  transforms only; rotateY goes on the svg root (Safari).
- Sound only through `src/lib/sound.ts` and `src/lib/music.ts` (one shared
  AudioContext behind a master gain and a 6 kHz low-pass), only started inside
  a tap handler, only after checking `settings.sound`. Chimes stay louder than
  music. Every start and stop is a gain ramp.
- Server actions throw plain `Error` with a friendly message and always
  `revalidatePath` after a write. Client components catch and show the message.
- No model identifiers in commits, code, or comments.

## Verifying changes

`npm run typecheck` must be clean. There is no test harness and, in a cloud
session, no database, so the pages cannot render end to end here. Check
component logic by reading it, and don't invent data to stand in for the
live database.

## Privacy

This is a child's personal data. Keep the repository private. The backup
workflow commits database snapshots into git, exactly as lift-lite does, and
Jose wants it on: her saved dances cannot be rebuilt from anything else.
Never echo tokens or keys into chat, logs, or commits.
