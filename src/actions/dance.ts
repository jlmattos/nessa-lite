"use server";

import { supabase } from "@/lib/db";
import { todayLocal } from "@/lib/dates";
import { getSettings } from "@/actions/settings";
import type { Settings } from "@/lib/settings";

export type DanceData = {
  /** Today's workout is finished → Pirouette is ready to dance. */
  unlocked: boolean;
  today: string;
  totalWorkouts: number;
  settings: Settings;
};

export async function getDanceData(): Promise<DanceData> {
  const today = todayLocal();
  const [{ data: workout }, settings, { count }] = await Promise.all([
    supabase.from("workouts").select("completed_at").eq("performed_on", today).maybeSingle(),
    getSettings(),
    supabase.from("workouts").select("id", { count: "exact", head: true }).not("completed_at", "is", null),
  ]);
  return { unlocked: !!workout?.completed_at, today, totalWorkouts: count ?? 0, settings };
}
