/**
 * Server-only loader for the stage's derived inputs (GAME-DESIGN.md §8).
 * Not a server action: actions import it. Returns the StageInput the pure
 * progress library works from, plus today's workout row and the settings.
 */
import { supabase } from "@/lib/db";
import { getSettings } from "@/actions/settings";
import type { Settings } from "@/lib/settings";
import type { RehearsalRow, StageInput } from "@/lib/dance-progress";

export type TodayWorkout = {
  id: string;
  completedAt: string | null;
  stageClosedAt: string | null;
};

export async function loadStageInput(today: string): Promise<{ input: StageInput; workout: TodayWorkout | null; settings: Settings }> {
  const [{ data: workout }, { data: completed }, { data: rows }, settings] = await Promise.all([
    supabase.from("workouts").select("id, completed_at, stage_closed_at").eq("performed_on", today).maybeSingle(),
    supabase.from("workouts").select("performed_on").not("completed_at", "is", null),
    supabase.from("rehearsals").select("*, workouts!inner(performed_on, completed_at)"),
    getSettings(),
  ]);

  const rehearsals: RehearsalRow[] = (rows ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => ({ r, w: r.workouts as { performed_on?: string; completed_at?: string | null } | null }))
    .filter(({ w }) => !!w?.completed_at)
    .map(({ r, w }) => ({
      workoutId: r.workout_id as string,
      performedOn: w!.performed_on as string,
      costume: r.costume as string,
      stage: r.stage as string,
      music: r.music as string,
      sparkle: r.sparkle as string,
      danceId: (r.dance_id as string | null) ?? null,
      danceName: (r.dance_name as string | null) ?? null,
      moves: (r.moves as string[] | null) ?? null,
      recitalProgram: (r.recital_program as number | null) ?? null,
      sparklesCaught: (r.sparkles_caught as number) ?? 0,
      dancedAt: (r.danced_at as string | null) ?? null,
    }));

  const input: StageInput = {
    completedDates: (completed ?? []).map((w) => w.performed_on as string).sort(),
    today,
    todayCompleted: !!workout?.completed_at,
    highWaterN: settings.highWaterN,
    rehearsals,
  };

  return {
    input,
    workout: workout
      ? {
          id: workout.id as string,
          completedAt: (workout.completed_at as string | null) ?? null,
          stageClosedAt: (workout.stage_closed_at as string | null) ?? null,
        }
      : null,
    settings,
  };
}

/** The gold dot on the Stage tab: today's workout is complete and she has not danced yet. Never throws. */
export async function getStageWaiting(today: string): Promise<boolean> {
  try {
    const { data: workout } = await supabase
      .from("workouts").select("id, completed_at, stage_closed_at").eq("performed_on", today).maybeSingle();
    if (!workout?.completed_at || workout.stage_closed_at) return false;
    const { data: row } = await supabase
      .from("rehearsals").select("danced_at").eq("workout_id", workout.id).maybeSingle();
    return !row?.danced_at;
  } catch {
    return false;
  }
}
