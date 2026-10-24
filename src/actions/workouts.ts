"use server";

import { attempt, Friendly, type ActionResult } from "@/lib/action-result";
import { supabase } from "@/lib/db";
import { todayLocal } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import { computeEarnedCats, type CatId } from "@/lib/collection";
import { getSettings, bumpHighWater } from "@/actions/settings";
import type { Settings } from "@/lib/settings";
import { loadStageInput } from "@/lib/stage-data";
import { programLine, newTodayLine, stageWaiting, todayRow, type ProgramLine } from "@/lib/dance-progress";
import type { MoveKey } from "@/lib/dance-content";

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

/** What Today shows about the stage (GAME-DESIGN.md §3.0, §3.4, §3.10). Null if the stage tables are missing. */
export type TodayStage = {
  programLine: ProgramLine;
  /** "New today: Swan costume" for the ending card. */
  newToday: string | null;
  /** On a move day, the new move: Pirouette performs it once when the ending card appears. */
  newMove: MoveKey | null;
  /** Workout done and she has not danced yet: the slipper is ringed, the tab has its dot. */
  waiting: boolean;
  /** Pirouette has danced for today's workout (its evening can't be cancelled away). */
  danced: boolean;
  /** "Done for today" has closed the stage. */
  closed: boolean;
  /** Her current costume, for the ending and done cards. */
  costume: string;
};

export type TodayData = {
  today: string;
  workout: { id: string; routineName: string | null; completedAt: string | null } | null;
  /** Today's visual schedule, in order. Empty when no workout is open. */
  movements: TodayMovement[];
  /** Rotation suggestion when no workout exists yet, with its steps for the schedule strip. */
  suggestedRoutine: {
    id: string;
    name: string;
    movementCount: number;
    movements: { movementId: string; name: string; icon: string }[];
  } | null;
  allRoutines: { id: string; name: string }[];
  hasRoutine: boolean;
  totalWorkouts: number;
  earnedCats: CatId[];
  settings: Settings;
  stage: TodayStage | null;
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

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("*")
    .eq("performed_on", today)
    .maybeSingle();
  // A failed read must never look like "nothing yet" (it would say "set up a routine first").
  if (workoutError) throw new Error(`Couldn’t load today: ${workoutError.message}`);

  const [routinesQ, suggested, settings, completedQ] = await Promise.all([
    supabase.from("routines").select("id, name").order("position"),
    workout ? Promise.resolve(null) : suggestNextRoutine(),
    getSettings(),
    supabase.from("workouts").select("id", { count: "exact", head: true }).not("completed_at", "is", null),
  ]);
  for (const q of [routinesQ, completedQ]) {
    if (q.error) throw new Error(`Couldn’t load today: ${q.error.message}`);
  }
  const routines = routinesQ.data;
  const totalCompleted = completedQ.count;

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

  let stage: TodayStage | null = null;
  try {
    const s = await loadStageInput(today);
    const row = todayRow(s.input);
    const latest = [...s.input.rehearsals].sort((a, b) => (a.performedOn < b.performedOn ? 1 : -1))[0];
    const newToday = newTodayLine(s.input);
    stage = {
      programLine: programLine(s.input),
      newToday: newToday?.text ?? null,
      newMove: newToday?.move ?? null,
      waiting: stageWaiting(s.input) && !s.workout?.stageClosedAt,
      closed: !!s.workout?.stageClosedAt,
      danced: s.input.danced.some((d) => d.performedOn === today),
      costume: row?.costume ?? latest?.costume ?? "classic",
    };
  } catch {
    stage = null;
  }

  let suggestedRoutine: TodayData["suggestedRoutine"] = null;
  if (suggested) {
    // The steps themselves, so Today shows the whole plan before she starts (§3.0).
    const { data: rows, error } = await supabase
      .from("routine_movements")
      .select("movement_id, position, movements(name, icon)")
      .eq("routine_id", suggested.id)
      .order("position");
    if (error) throw new Error(`Couldn’t load today: ${error.message}`);
    const movements = (rows ?? []).map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mv = ((m as any).movements ?? {}) as { name?: string; icon?: string };
      return { movementId: m.movement_id as string, name: mv.name ?? "?", icon: mv.icon ?? "⭐" };
    });
    suggestedRoutine = { ...suggested, movementCount: movements.length, movements };
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
    stage,
  };
}

export async function startWorkout(routineId: string) {
  return attempt(async () => {
    const today = todayLocal();
    const { data: routine } = await supabase.from("routines").select("name").eq("id", routineId).single();
    const { error } = await supabase
      .from("workouts")
      .insert({ performed_on: today, routine_id: routineId, routine_name: (routine?.name as string) ?? null });
    // A second tap on the same day just lands on the existing workout.
    if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
    refreshAll();
  });
}

/** She tapped Done on a movement. Double taps are absorbed by the unique index. */
export async function completeMovement(
  workoutId: string,
  movementId: string,
  reps: number | null,
  secs: number | null
) {
  return attempt(async () => {
    const { error } = await supabase
      .from("movement_completions")
      .insert({ workout_id: workoutId, movement_id: movementId, reps, secs });
    if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
    revalidatePath("/");
  });
}

export async function undoCompletion(completionId: string) {
  return attempt(async () => {
    const { error } = await supabase.from("movement_completions").delete().eq("id", completionId);
    if (error) throw new Error(error.message);
    revalidatePath("/");
  });
}

/** The clear ending: marks the day complete, unlocks the dance, and raises the high-water mark. */
export async function finishWorkout(workoutId: string) {
  return attempt(async () => {
    const { error } = await supabase
      .from("workouts")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", workoutId);
    if (error) throw new Error(error.message);
    const [w, m] = await Promise.all([
      supabase.from("workouts").select("id", { count: "exact", head: true }).not("completed_at", "is", null),
      supabase
        .from("movement_completions")
        .select("id, workouts!inner(completed_at)", { count: "exact", head: true })
        .not("workouts.completed_at", "is", null),
    ]);
    try {
      // A failed count reads as 0, which never lowers a high-water mark.
      await bumpHighWater(w.error ? 0 : w.count ?? 0, m.error ? 0 : m.count ?? 0);
    } catch {
      // The day is still complete; the marks catch up at the next Finish.
    }
    refreshAll();
  });
}

/** Reopening the workout also reopens the stage (GAME-DESIGN.md §3.10). */
export async function reopenWorkout(workoutId: string) {
  return attempt(async () => {
    const { error } = await supabase
      .from("workouts").update({ completed_at: null, stage_closed_at: null }).eq("id", workoutId);
    if (error) throw new Error(error.message);
    refreshAll();
  });
}

/** Escape hatch: delete an accidentally-started workout with nothing done. */
export async function cancelWorkout(workoutId: string) {
  return attempt(async () => {
    const { count } = await supabase
      .from("movement_completions").select("id", { count: "exact", head: true }).eq("workout_id", workoutId);
    if ((count ?? 0) > 0) throw new Friendly("This workout already has movements done");
    // Deleting the workout would take its evening on the stage with it (the row cascades): a recital,
    // a poster snapshot, a rosette. Once Pirouette has danced for it, the workout stays.
    const { data: row, error: rowError } = await supabase
      .from("rehearsals").select("danced_at").eq("workout_id", workoutId).maybeSingle();
    if (rowError) throw new Error(rowError.message);
    if (row?.danced_at) throw new Friendly("Pirouette already danced for this workout, so it stays.");
    const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
    if (error) throw new Error(error.message);
    refreshAll();
  });
}
