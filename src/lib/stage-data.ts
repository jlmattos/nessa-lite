/**
 * Server-only loader for the stage's derived inputs (GAME-DESIGN.md §8).
 * Not a server action: actions import it. Returns the StageInput the pure
 * progress library works from, plus today's workout row and the settings.
 */
import { supabase } from "@/lib/db";
import { getSettings } from "@/actions/settings";
import type { Settings } from "@/lib/settings";
import { localDateOf } from "@/lib/dates";
import type { DancedRow, RehearsalRow, RosetteExtras, StageInput } from "@/lib/dance-progress";

export type TodayWorkout = {
  id: string;
  completedAt: string | null;
  stageClosedAt: string | null;
};

export async function loadStageInput(today: string): Promise<{ input: StageInput; workout: TodayWorkout | null; settings: Settings }> {
  const [w, c, r, settings] = await Promise.all([
    supabase.from("workouts").select("id, completed_at, stage_closed_at").eq("performed_on", today).maybeSingle(),
    supabase.from("workouts").select("performed_on").not("completed_at", "is", null),
    supabase.from("rehearsals").select("*, workouts!inner(performed_on, completed_at)"),
    getSettings(),
  ]);
  // supabase-js returns errors instead of throwing. A failed read must never
  // look like "nothing yet": callers would write on wrong assumptions.
  for (const q of [w, c, r]) {
    if (q.error) throw new Error(`Couldn’t load the stage: ${q.error.message}`);
  }
  const workout = w.data;
  const completed = c.data;
  const rows = r.data;

  // Recitals stay performed whatever happens to their workout afterwards.
  const performedPrograms = (rows ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((row: any) => row.recital_program != null && row.danced_at)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => row.recital_program as number);

  // Every evening she danced, whatever happened to its workout afterwards (rosettes can't be lost),
  // in the look it was first danced in (the look columns stay editable all evening).
  const danced: DancedRow[] = (rows ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((row: any) => row.danced_at && row.workouts?.performed_on)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => ({
      performedOn: row.workouts.performed_on as string,
      costume: (row.danced_costume as string | null) ?? (row.costume as string),
      stage: (row.danced_stage as string | null) ?? (row.stage as string),
      recitalProgram: (row.recital_program as number | null) ?? null,
      sparklesCaught: (row.sparkles_caught as number) ?? 0,
    }));

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
      dancedCostume: (r.danced_costume as string | null) ?? null,
      dancedStage: (r.danced_stage as string | null) ?? null,
      posterDances: (r.poster_dances as Record<string, string[][]> | null) ?? null,
    }));

  const input: StageInput = {
    completedDates: (completed ?? []).map((w) => w.performed_on as string).sort(),
    today,
    todayCompleted: !!workout?.completed_at,
    highWaterN: settings.highWaterN,
    rehearsals,
    performedPrograms,
    danced,
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

/**
 * What the rosettes need beyond the StageInput (§6): the days her own dances
 * were made (put-away ones included) and her completed movements, never below
 * the high-water mark kept at Finish. Throws on a failed read, like loadStageInput.
 */
export async function loadRosetteExtras(highWaterMoves: number): Promise<RosetteExtras> {
  const [d, m] = await Promise.all([
    supabase.from("dances").select("created_at").eq("is_preset", false),
    supabase
      .from("movement_completions")
      .select("id, workouts!inner(completed_at)", { count: "exact", head: true })
      .not("workouts.completed_at", "is", null),
  ]);
  for (const q of [d, m]) {
    if (q.error) throw new Error(`Couldn’t load the rosettes: ${q.error.message}`);
  }
  return {
    savedOn: (d.data ?? []).map((row) => localDateOf(row.created_at as string)),
    completedMoves: Math.max(m.count ?? 0, highWaterMoves),
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
