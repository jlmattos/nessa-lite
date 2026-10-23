import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazily initialized so the app BUILDS without secrets — the clear error
// surfaces on first query instead of at import time. Server-side only (the
// secret key bypasses RLS; the anon role is locked out entirely).
//
// The URL is read under either name: SUPABASE_URL (what Vercel, the backup
// script and the GitHub secrets use) or NEXT_PUBLIC_SUPABASE_URL (lift-lite's
// name). Nothing here runs in the browser, so the NEXT_PUBLIC_ prefix is not needed.
let client: SupabaseClient | null = null;

/**
 * Reduce whatever was pasted to the project's base address. supabase-js adds
 * /rest/v1 itself, so a pasted API address ("…supabase.co/rest/v1/") doubles
 * the path and every query fails with "Invalid path specified in request URL".
 * A dashboard link (".../dashboard/project/<ref>") is turned into the project
 * address too. Anything else is used as given.
 */
export function normalizeSupabaseUrl(raw: string): string {
  const value = raw.trim().replace(/^["']|["']$/g, "");
  try {
    const u = new URL(value);
    if (u.hostname.endsWith(".supabase.co")) return u.origin;
    const ref = u.pathname.match(/\/project\/([a-z0-9]{20})/)?.[1];
    if (ref) return `https://${ref}.supabase.co`;
    return u.origin;
  } catch {
    return value;
  }
}

function getClient(): SupabaseClient {
  if (client) return client;
  const raw = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!raw || !key) {
    throw new Error(
      "Supabase is not configured — set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (and Vercel)."
    );
  }
  client = createClient(normalizeSupabaseUrl(raw), key, { auth: { persistSession: false } });
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    const value = c[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(c) : value;
  },
});
