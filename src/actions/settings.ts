"use server";

import { supabase } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

/**
 * Never throws: the layout calls this on every page, and a missing database
 * (or missing row) must degrade to defaults rather than take the app down.
 */
export async function getSettings(): Promise<Settings> {
  try {
    const { data } = await supabase.from("settings").select("sound, reduced_motion").eq("id", 1).maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    return { sound: !!data.sound, reducedMotion: !!data.reduced_motion };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(patch: Partial<Settings>) {
  const row: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
  if (patch.sound != null) row.sound = patch.sound;
  if (patch.reducedMotion != null) row.reduced_motion = patch.reducedMotion;
  const { error } = await supabase.from("settings").upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
