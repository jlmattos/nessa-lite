"use server";

import { supabase } from "@/lib/db";
import { todayLocal } from "@/lib/dates";
import { computeEarnedCats, type CatId } from "@/lib/collection";

export type ProgressData = {
  totalWorkouts: number;
  workoutsThisMonth: number;
  earnedCats: CatId[];
  /** Newest first. */
  recent: { id: string; performedOn: string; routineName: string | null; movementCount: number }[];
};

export async function getProgress(): Promise<ProgressData> {
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, performed_on, routine_name")
    .not("completed_at", "is", null)
    .order("performed_on", { ascending: false });
  const all = workouts ?? [];
  const monthStart = todayLocal().slice(0, 7) + "-01";

  const recentRows = all.slice(0, 5);
  const ids = recentRows.map((w) => w.id as string);
  const countBy = new Map<string, number>();
  if (ids.length > 0) {
    const { data: comps } = await supabase
      .from("movement_completions").select("workout_id").in("workout_id", ids);
    for (const c of comps ?? []) {
      const wid = c.workout_id as string;
      countBy.set(wid, (countBy.get(wid) ?? 0) + 1);
    }
  }

  return {
    totalWorkouts: all.length,
    workoutsThisMonth: all.filter((w) => (w.performed_on as string) >= monthStart).length,
    earnedCats: computeEarnedCats(all.length),
    recent: recentRows.map((w) => ({
      id: w.id as string,
      performedOn: w.performed_on as string,
      routineName: (w.routine_name as string | null) ?? null,
      movementCount: countBy.get(w.id as string) ?? 0,
    })),
  };
}
