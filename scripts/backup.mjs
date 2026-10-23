// Dump every nessa-lite table to JSON. Dependency-free (plain fetch), so it
// runs locally AND in GitHub Actions without installing anything.
//
//   node scripts/backup.mjs            → backups/nessa-lite-backup-YYYY-MM-DD.json
//   node scripts/backup.mjs --latest   → backups/latest.json (CI commits this;
//                                        git history = nightly snapshots forever)
//
// Credentials: SUPABASE_URL + SUPABASE_SECRET_KEY env vars (CI), falling back
// to .env.local (local runs).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

function fromEnvLocal(name) {
  if (!existsSync(".env.local")) return null;
  const m = readFileSync(".env.local", "utf-8").match(new RegExp(`${name}=(.+)`));
  return m ? m[1].trim() : null;
}

// Reduce a pasted address to the project's base address, the same way
// normalizeSupabaseUrl in src/lib/db.ts does.
function normalize(raw) {
  if (!raw) return raw;
  const value = raw.trim().replace(/^["']|["']$/g, "");
  try {
    const u = new URL(value);
    const host = u.hostname.match(/(?:^|\.)([a-z0-9]+)\.supabase\.co$/)?.[1];
    if (host) return `https://${host}.supabase.co`;
    const ref = u.pathname.match(/\/project\/([a-z0-9]{20})/)?.[1];
    if (ref) return `https://${ref}.supabase.co`;
    if (u.protocol === "http:" || u.protocol === "https:") {
      const base = u.pathname.replace(/\/(rest|auth|storage|realtime|functions)\/v1(\/.*)?$/, "").replace(/\/+$/, "");
      return `${u.origin}${base}`;
    }
    return value;
  } catch {
    return value;
  }
}

const url = normalize(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? fromEnvLocal("SUPABASE_URL") ?? fromEnvLocal("NEXT_PUBLIC_SUPABASE_URL")
);
const key = process.env.SUPABASE_SECRET_KEY ?? fromEnvLocal("SUPABASE_SECRET_KEY");
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY (env or .env.local)");
  process.exit(1);
}

// FK order, so a restore can insert table by table. dances and rehearsals are hers:
// saved dances and every evening on the stage cannot be rebuilt from anything else.
const TABLES = ["movements", "routines", "routine_movements", "workouts", "movement_completions", "settings", "dances", "rehearsals"];

const PAGE = 1000;
async function dumpTable(table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${offset}-${offset + PAGE - 1}`,
      },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

const dump = { app: "nessa-lite", exportedAt: new Date().toISOString() };
for (const t of TABLES) {
  dump[t] = await dumpTable(t);
  console.log(`  ${t}: ${dump[t].length} rows`);
}

mkdirSync("backups", { recursive: true });
const file = process.argv.includes("--latest")
  ? "backups/latest.json"
  : `backups/nessa-lite-backup-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(file, JSON.stringify(dump, null, 2));
console.log(`\n✓ ${file}`);
