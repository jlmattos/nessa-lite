import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazily initialized so the app BUILDS without secrets — the clear error
// surfaces on first query instead of at import time. Server-side only (the
// secret key bypasses RLS; the anon role is locked out entirely).
//
// The URL is read under either name: SUPABASE_URL (what Vercel, the backup
// script and the GitHub secrets use) or NEXT_PUBLIC_SUPABASE_URL (lift-lite's
// name). Nothing here runs in the browser, so the NEXT_PUBLIC_ prefix is not needed.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured — set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (and Vercel)."
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    const value = c[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(c) : value;
  },
});
