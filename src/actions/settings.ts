"use server";

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
  const row: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(patch)) {
    if (value != null) row[COLUMN[key as keyof Settings]] = value;
  }
  const { error } = await supabase.from("settings").upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/** Called at Finish: the high-water mark only ever goes up, so nothing relocks. */
export async function bumpHighWater(n: number) {
  const current = await getSettings();
  if (n <= current.highWaterN) return;
  const { error } = await supabase
    .from("settings")
    .upsert({ id: 1, high_water_n: n, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}
