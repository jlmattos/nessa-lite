"use server";

import { supabase } from "@/lib/db";
import { todayLocal } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import { computeEarnedCats, type CatId } from "@/lib/collection";
import { getSettings } from "@/actions/settings";
import type { Settings } from "@/lib/settings";

export type TodayMovement = {
  movementId: string;
  name: string;
  icon: string;
  cue: string | null;
  position: number;
  targetReps: number | null;
  targetSecs: number | null;
  /** Set once she tapped Done on it today. */
  completion: { id: string; reps: number | null; secs: number | null } | null;
};

export type TodayData = {
  today: string;
  workout: { id: string; routineName: string | null; completedAt: string | null } | null;
  /** Today's visual schedule, in order. Empty when no workout is open. */
  movements: TodayMovement[];
  /** Rotation suggestion when no workout exists yet. */
  suggestedRoutine: { id: string; name: string; movementCount: number } | null;
  allRoutines: { id: string; name: string }[];
  hasRoutine: boolean;
  totalWorkouts: number;
  earnedCats: CatId[];
  settings: Settings;
};

function refreshAll() {
  revalidatePath("/");
  revalidatePath("/dance");
  revalidatePath("/collection");
}

/**
 * The rotation: suggest the routine after the most recently completed
 * workout's routine (by position, wrapping). Not opening the app IS a rest day.
 */
async function suggestNextRoutine(): Promise<{ id: string; name: string } | null> {
  const { data: routines } = await supabase.from("routines").select("id, name, position").order("position");
  if (!routines || routines.length === 0) return null;

  const { data: lastDone } = await supabase
    .from("workouts")
    .select("routine_id")
    .not("completed_at", "is", null)
    .not("routine_id", "is", null)
    .order("performed_on", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastDone?.routine_id) return routines[0];
  const idx = routines.findIndex((r) => r.id === lastDone.routine_id);
  return routines[(idx + 1) % routines.length] ?? routines[0];
}

export async function getTodayData(): Promise<TodayData> {
  const today = todayLocal();

  const { data: workout } = await supabase
    .from("workouts")
    .select("*")
    .eq("performed_on", today)
    .maybeSingle();

  const [{ data: routines }, suggested, settings, { count: totalCompleted }] = await Promise.all([
    supabase.from("routines").select("id, name").order("position"),
    workout ? Promise.resolve(null) : suggestNextRoutine(),
    getSettings(),
    supabase.from("workouts").select("id", { count: "exact", head: true }).not("completed_at", "is", null),
  ]);

  let movements: TodayMovement[] = [];
  if (workout?.routine_id) {
    const [{ data: rows }, { data: done }] = await Promise.all([
      supabase
        .from("routine_movements")
        .select("movement_id, position, target_reps, target_secs, movements(name, icon, cue)")
        .eq("routine_id", workout.routine_id)
        .order("position"),
      supabase
        .from("movement_completions")
        .select("id, movement_id, reps, secs")
        .eq("workout_id", workout.id),
    ]);
    const doneBy = new Map((done ?? []).map((d) => [d.movement_id as string, d]));
    movements = (rows ?? []).map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mv = ((m as any).movements ?? {}) as { name?: string; icon?: string; cue?: string | null };
      const d = doneBy.get(m.movement_id as string);
      return {
        movementId: m.movement_id as string,
        name: mv.name ?? "?",
        icon: mv.icon ?? "⭐",
        cue: mv.cue ?? null,
        position: m.position as number,
        targetReps: (m.target_reps as number | null) ?? null,
        targetSecs: (m.target_secs as number | null) ?? null,
        completion: d
          ? { id: d.id as string, reps: (d.reps as number | null) ?? null, secs: (d.secs as number | null) ?? null }
          : null,
      };
    });
  }

  let suggestedRoutine: TodayData["suggestedRoutine"] = null;
  if (suggested) {
    const { count } = await supabase
      .from("routine_movements")
      .select("id", { count: "exact", head: true })
      .eq("routine_id", suggested.id);
    suggestedRoutine = { ...suggested, movementCount: count ?? 0 };
  }

  return {
    today,
    workout: workout
      ? {
          id: workout.id as string,
          routineName: (workout.routine_name as string | null) ?? null,
          completedAt: (workout.completed_at as string | null) ?? null,
        }
      : null,
    movements,
    suggestedRoutine,
    allRoutines: (routines ?? []).map((r) => ({ id: r.id as string, name: r.name as string })),
    hasRoutine: (routines ?? []).length > 0,
    totalWorkouts: totalCompleted ?? 0,
    earnedCats: computeEarnedCats(totalCompleted ?? 0),
    settings,
  };
}

export async function startWorkout(routineId: string) {
  const today = todayLocal();
  const { data: routine } = await supabase.from("routines").select("name").eq("id", routineId).single();
  const { error } = await supabase
    .from("workouts")
    .insert({ performed_on: today, routine_id: routineId, routine_name: (routine?.name as string) ?? null });
  // A second tap on the same day just lands on the existing workout.
  if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
  refreshAll();
}

/** She tapped Done on a movement. Double taps are absorbed by the unique index. */
export async function completeMovement(
  workoutId: string,
  movementId: string,
  reps: number | null,
  secs: number | null
) {
  const { error } = await supabase
    .from("movement_completions")
    .insert({ workout_id: workoutId, movement_id: movementId, reps, secs });
  if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
  revalidatePath("/");
}

export async function undoCompletion(completionId: string) {
  const { error } = await supabase.from("movement_completions").delete().eq("id", completionId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

/** The clear ending: marks the day complete and unlocks the dance. */
export async function finishWorkout(workoutId: string) {
  const { error } = await supabase
    .from("workouts")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", workoutId);
  if (error) throw new Error(error.message);
  refreshAll();
}

export async function reopenWorkout(workoutId: string) {
  const { error } = await supabase.from("workouts").update({ completed_at: null }).eq("id", workoutId);
  if (error) throw new Error(error.message);
  refreshAll();
}

/** Escape hatch: delete an accidentally-started workout with nothing done. */
export async function cancelWorkout(workoutId: string) {
  const { count } = await supabase
    .from("movement_completions").select("id", { count: "exact", head: true }).eq("workout_id", workoutId);
  if ((count ?? 0) > 0) throw new Error("This workout already has movements done");
  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
  if (error) throw new Error(error.message);
  refreshAll();
}
