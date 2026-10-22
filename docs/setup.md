# Setting up Nessa Lite: Supabase, Vercel, backups, iPad

Everything below is done once. It mirrors how lift-lite is set up, so the
screens will look familiar. Keep every key out of chat, commits and screenshots.

## 1. Supabase (the database)

1. Go to https://supabase.com/dashboard and sign in. You should see your
   existing organization with the lift-lite project in it.
2. Click **New project**. Pick the same organization. Name it `nessa-lite`,
   set a strong database password (save it in your password manager; you
   rarely need it), and choose the region closest to home. Click **Create new
   project** and wait a minute or two for it to come up.
3. Open **SQL Editor** in the left sidebar, click **New query**, paste the
   whole contents of `schema.sql` from this repo, and click **Run**. You should
   see "Success. No rows returned." This creates the six tables and locks the
   public role out.
4. Copy the two values the app needs:
   - **Project URL**: Project Settings → **API** (or **Data API**). It looks
     like `https://xxxxxxxxxxxx.supabase.co`.
   - **Secret key**: Project Settings → **API Keys**. Use a *secret* key
     (the kind that starts with `sb_secret_`), not the publishable one. If
     there is none yet, click **Create new API key**, choose secret, name it
     `nessa-lite-server`, and copy it once; it won't be shown again.
5. On your Mac, create `~/nessa-lite/.env.local` (it is git-ignored) with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

   Then `npm install` and `npm run dev -- --port 3002`, open
   http://localhost:3002, and build her first routine in the Routine tab.

## 2. Vercel (the deployment)

1. Go to https://vercel.com and sign in. Click **Add New…** → **Project**.
2. Under **Import Git Repository**, pick `jlmattos/nessa-lite`. If it isn't
   listed, click **Adjust GitHub App Permissions** and grant Vercel access to
   the repo.
3. Leave the framework as **Next.js** and the root directory as is.
4. Open **Environment Variables** and add, for Production and Preview:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL from step 1.4
   - `SUPABASE_SECRET_KEY` = the secret key from step 1.4
   - `HOME_TZ` = `America/New_York` (optional; this is the default)
5. Click **Deploy**. The first build takes a couple of minutes. You get a URL
   like `https://nessa-lite-<something>.vercel.app`.
6. Open it. The Today tab should show "Let's set up a routine first" until a
   routine exists, and `/spike` works even before the database is connected.

The app has no login, same as lift-lite, so anyone with the URL can use it.
Keep the URL in the family. Search engines are told not to index it.

Every push to `main` redeploys automatically from now on.

## 3. Backups (GitHub Actions)

The nightly backup is already switched on in the repo but skips until it has
credentials.

1. On GitHub, open `jlmattos/nessa-lite` → **Settings** → **Secrets and
   variables** → **Actions** → **New repository secret**.
2. Add `SUPABASE_URL` = the Project URL, and `SUPABASE_SECRET_KEY` = the secret
   key. (Same values as Vercel; different variable name for the URL.)
3. Optional check: **Actions** tab → **Nightly backup** → **Run workflow**. A
   minute later `backups/latest.json` appears in the repo.

## 4. Nessa's iPad

1. Open the Vercel URL in Safari on her iPad.
2. Tap the Share button, then **Add to Home Screen**. The icon and the name
   "Nessa Lite" come from the app.
3. Tap the new icon once so Safari remembers it. Sound needs one tap inside
   the app before it can play; the first Done tap takes care of that.

## 5. Optional: let Claude cloud sessions see the database

Only needed if you want a session to run the backup script or query data.
Open the cloud environment menu in a session's title bar → **Edit** →
**Environment variables**, and add the same two variables as in step 1.5.
A new session picks them up. Never paste the values into the chat.
