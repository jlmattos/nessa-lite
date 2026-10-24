"use server";

import { attempt, Friendly, type ActionResult } from "@/lib/action-result";
import { supabase } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): Settings {
  const d = DEFAULT_SETTINGS;
  return {
    sound: r.sound ?? d.sound,
    music: r.music ?? d.music,
    volume: r.volume === "medium" ? "medium" : "soft",
    sparkleAmount: r.sparkle_amount === "some" ? "some" : "lots",
    sparkleTaps: r.sparkle_taps ?? d.sparkleTaps,
    sparkleCount: r.sparkle_count ?? d.sparkleCount,
    bowShowers: r.bow_showers ?? d.bowShowers,
    reducedMotion: r.reduced_motion ?? d.reducedMotion,
    highWaterN: typeof r.high_water_n === "number" ? r.high_water_n : d.highWaterN,
    highWaterMoves: typeof r.high_water_moves === "number" ? r.high_water_moves : d.highWaterMoves,
  };
}

const COLUMN: Record<keyof Settings, string> = {
  sound: "sound",
  music: "music",
  volume: "volume",
  sparkleAmount: "sparkle_amount",
  sparkleTaps: "sparkle_taps",
  sparkleCount: "sparkle_count",
  bowShowers: "bow_showers",
  reducedMotion: "reduced_motion",
  highWaterN: "high_water_n",
  highWaterMoves: "high_water_moves",
};

/**
 * Never throws: the layout calls this on every page, and a missing database,
 * row or column (migration not applied yet) must degrade to defaults rather
 * than take the app down.
 */
export async function getSettings(): Promise<Settings> {
  try {
    const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    return fromRow(data);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(patch: Partial<Settings>) {
  return attempt(async () => {
    const row: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(patch)) {
      if (value != null) row[COLUMN[key as keyof Settings]] = value;
    }
    const { error } = await supabase.from("settings").upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);
    revalidatePath("/", "layout");
  });
}

/**
 * Called at Finish: the high-water marks only ever go up, so nothing relocks
 * and no rosette is lost (workouts ever completed; movements done on them).
 */
export async function bumpHighWater(n: number, moves: number) {
  const current = await getSettings();
  const row: Record<string, unknown> = {};
  if (n > current.highWaterN) row.high_water_n = n;
  if (moves > current.highWaterMoves) row.high_water_moves = moves;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase
    .from("settings")
    .upsert({ id: 1, ...row, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}
