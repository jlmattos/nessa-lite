# Nessa Lite

Nessa’s workout app: a visual routine she taps through, cat friends that
arrive as she keeps showing up, and — after every workout — a dance with
Pirouette, the ballerina cat.

Started as a trimmed copy of [lift-lite](https://github.com/jlmattos/lift-lite)
(same stack, same cats, same warm look) with fresh history. The game design
lives in `GAME-DESIGN.md`; how to work on the code is in `CLAUDE.md`.

## Running it

1. Create a Supabase project for nessa-lite and run `schema.sql` in its SQL editor.
2. Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`
   (optional `HOME_TZ`, default `America/New_York`).
3. `npm install`, then `npm run dev -- --port 3002` and open http://localhost:3002.
4. Deploy on Vercel with the same two environment variables.

`npm run typecheck` is the only automated check; there are no tests yet.

## Backups

`node scripts/backup.mjs` dumps every table to `backups/`. The nightly GitHub
Action is included but its schedule is commented out until the repository
secrets exist (see `.github/workflows/backup.yml`).
