"use server";

import { attempt, Friendly, type ActionResult } from "@/lib/action-result";
import { supabase } from "@/lib/db";
import { todayLocal } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import type { Settings } from "@/lib/settings";
import { computeEarnedCats, type CatId } from "@/lib/collection";
import {
  COSTUMES, STAGES, MUSIC, SPARKLES, QUIET_KEY, NONE_KEY, PRESET_DANCES, PIROUETTES_CHOICE_NAME,
  announce, isMoveKey, type MoveKey,
} from "@/lib/dance-content";
import {
  countN, countNMax, programLine, readyRecital, recitalOnTime, decorations, unlockedKeys, slotCount, pirouettesChoice,
  unlockedMoves, ambientSparkles, newSinceLastTime, newTodayLine, todayRow as todayRowOf, programDances, rosettes,
  maxPerformed, posterDances, everCaught,
  type EarnedRosette, type ProgramLine, type StageInput,
} from "@/lib/dance-progress";
import { loadRosetteExtras, loadStageInput } from "@/lib/stage-data";

export type Look = { costume: string; stage: string; music: string; sparkle: string };
export type StageDance = { id: string | null; name: string; moves: MoveKey[]; presetKey: string | null };
export type RecitalPlan = {
  program: number;
  /** Today is the recital day itself; false = an older recital played first on a later visit. */
  onTime: boolean;
  /** The Program's distinct dances, positions 1–4 in order. */
  dances: { name: string; moves: MoveKey[] }[];
  /** Every unlocked move once, in catalog order. */
  finale: MoveKey[];
  /** The poster's dances, exactly as startDance stores them, so the Bow's poster is the Season map's. */
  posterDances: MoveKey[][];
};

export type PerformancePlan = {
  dance: { name: string; moves: MoveKey[] };
  /** The recital that plays first tonight, if one is ready. */
  recital: RecitalPlan | null;
};

export type StageData = {
  today: string;
  workoutId: string | null;
  /** Today's workout is finished: the stage is open. */
  unlocked: boolean;
  /** "Done for today" has closed the curtains. */
  closed: boolean;
  settings: Settings;
  n: number;
  nMax: number;
  programLine: ProgramLine;
  /** Today's look, or the latest one, or the defaults. */
  look: Look;
  hasRowToday: boolean;
  dancedToday: boolean;
  /** Preselected dance; null = Pirouette's choice. */
  lastDanceId: string | null;
  /** Presets first (catalog order), then hers, newest first. */
  dances: StageDance[];
  /** Her put-away dances, newest first ("Put it back"). */
  putAway: StageDance[];
  /** All her saved dances, put-away ones included: "Dance K" is this + 1. */
  savedCount: number;
  /** Every dance name in use (presets and put-away included), for the " 2" rule. */
  takenNames: string[];
  pirouettesChoice: MoveKey[];
  slotCount: number;
  /** Reached and shipped: what she can pick. */
  unlockedKeys: string[];
  /** Decoration keys present on every stage (one per performed recital). */
  decorations: string[];
  /** The recital that would play tonight, if one is ready. */
  recital: RecitalPlan | null;
  /** "New today: Swan costume" for the banner's first line. */
  bannerToday: string | null;
  /** "New since last time: …" item announcements. */
  bannerSince: string[];
  earnedCats: CatId[];
  /** She has caught a sparkle on some evening before: the ring pulses on the beat. */
  everCaught: boolean;
  /** Ambient sparkle count with the Sparkle catch lane taken out of the budget. */
  ambient: number;
  /** Earned rosettes in their fixed order (they hang on the curtain tie-backs); unearned ones never appear. */
  rosettes: EarnedRosette[];
};

const DEFAULT_LOOK: Look = { costume: "classic", stage: "practice_room", music: "music_box", sparkle: "gold" };
const PRESET_ORDER = Object.keys(PRESET_DANCES);

function recitalPlan(input: StageInput): RecitalPlan | null {
  const ready = readyRecital(input);
  if (ready == null) return null;
  const nMax = countNMax(input);
  return {
    program: ready,
    onTime: recitalOnTime(input),
    dances: programDances(input, ready).map((d) => ({ name: d.name, moves: d.moves ?? pirouettesChoice(nMax) })),
    finale: unlockedMoves(nMax),
    posterDances: posterDances(input, ready),
  };
}

/** Every look value must be a catalog key she has reached (plus Quiet and None). */
function checkLook(look: Partial<Look>, allowed: Set<string>) {
  const check = (value: string | undefined, keys: string[], extra: string[], what: string) => {
    if (value == null) return;
    if (!(extra.includes(value) || (keys.includes(value) && allowed.has(value)))) {
      throw new Friendly(`That ${what} isn’t ready yet`);
    }
  };
  check(look.costume, COSTUMES.map((c) => c.key), [], "costume");
  check(look.stage, STAGES.map((s) => s.key), [], "stage");
  check(look.music, MUSIC.map((m) => m.key), [QUIET_KEY], "music");
  check(look.sparkle, SPARKLES.map((s) => s.key), [NONE_KEY], "sparkle style");
}

export async function getStageData(): Promise<StageData> {
  const today = todayLocal();
  const { input, workout, settings } = await loadStageInput(today);
  const n = countN(input);
  const nMax = countNMax(input);

  const { data: danceRows, error } = await supabase
    .from("dances").select("*").order("created_at", { ascending: true });
  if (error) throw new Error(`Couldn’t load the dances: ${error.message}`);
  const rows = (danceRows ?? []).map((d) => ({
    dance: {
      id: d.id as string,
      name: d.name as string,
      moves: ((d.moves as string[]) ?? []).filter(isMoveKey),
      presetKey: (d.preset_key as string | null) ?? null,
    } as StageDance,
    archived: d.archived_at != null,
  }));
  const all = rows.filter((r) => !r.archived).map((r) => r.dance);
  // The fixed grid never reorders: presets by catalog order, not by insert time.
  const presets = all
    .filter((d) => d.presetKey)
    .sort((a, b) => PRESET_ORDER.indexOf(a.presetKey!) - PRESET_ORDER.indexOf(b.presetKey!));
  const hers = all.filter((d) => !d.presetKey).reverse();
  const putAway = rows.filter((r) => r.archived && !r.dance.presetKey).map((r) => r.dance).reverse();
  const danceIds = new Set(all.map((d) => d.id));

  // Rosettes are only shown, never written on; a failed read leaves them off for this load.
  let earnedRosettes: EarnedRosette[] = [];
  try {
    earnedRosettes = rosettes(input, await loadRosetteExtras(settings.highWaterMoves));
  } catch {
    earnedRosettes = [];
  }

  const row = todayRowOf(input);
  const latest = [...input.rehearsals].sort((a, b) => (a.performedOn < b.performedOn ? 1 : -1))[0] ?? null;
  const source = row ?? latest;
  const look: Look = source
    ? { costume: source.costume, stage: source.stage, music: source.music, sparkle: source.sparkle }
    : DEFAULT_LOOK;
  const lastDanced = [...input.rehearsals].filter((r) => r.dancedAt).sort((a, b) => (a.performedOn < b.performedOn ? 1 : -1))[0];
  const lastDanceId = lastDanced?.danceId && danceIds.has(lastDanced.danceId) ? lastDanced.danceId : null;

  const recital = recitalPlan(input);
  const newToday = newTodayLine(input);

  return {
    today,
    workoutId: workout?.id ?? null,
    unlocked: !!workout?.completedAt,
    closed: !!workout?.stageClosedAt,
    settings,
    n,
    nMax,
    programLine: programLine(input),
    look,
    hasRowToday: !!row,
    dancedToday: !!row?.dancedAt,
    lastDanceId,
    dances: [...presets, ...hers],
    putAway,
    savedCount: rows.filter((r) => !r.dance.presetKey).length,
    takenNames: rows.map((r) => r.dance.name),
    pirouettesChoice: pirouettesChoice(nMax),
    slotCount: slotCount(nMax),
    unlockedKeys: [...unlockedKeys(nMax)],
    decorations: decorations(input).map((p) => p.decoration.key),
    recital,
    bannerToday: newToday?.text ?? null,
    bannerSince: row ? [] : newSinceLastTime(input).map(announce),
    earnedCats: computeEarnedCats(n),
    everCaught: everCaught(input),
    // Two Sparkle catch sparkles can be in flight at once (2-beat moves), so the lane takes two slots.
    ambient: ambientSparkles(n, settings.sparkleAmount, 0, settings.sparkleTaps ? 2 : 0),
    rosettes: earnedRosettes,
  };
}

async function openWorkoutToday() {
  const today = todayLocal();
  const { data: workout, error } = await supabase
    .from("workouts").select("id, completed_at").eq("performed_on", today).maybeSingle();
  if (error) throw new Error(`Couldn’t reach the stage: ${error.message}`);
  if (!workout?.completed_at) throw new Friendly("Finish today’s workout first — then Pirouette dances.");
  return { id: workout.id as string, today };
}

/**
 * Get ready: upsert today's look. The client sends the whole look on screen so
 * the first write never falls back to the column defaults, and the last request
 * to arrive always carries complete state. Touches only the four look columns.
 */
export async function setLook(look: Partial<Look>) {
  return attempt(async () => {
    const today = todayLocal();
    const { input, workout } = await loadStageInput(today);
    if (!workout?.completedAt) throw new Friendly("Finish today’s workout first — then Pirouette dances.");
    checkLook(look, unlockedKeys(countNMax(input)));

    const row: Record<string, unknown> = { workout_id: workout.id };
    if (look.costume != null) row.costume = look.costume;
    if (look.stage != null) row.stage = look.stage;
    if (look.music != null) row.music = look.music;
    if (look.sparkle != null) row.sparkle = look.sparkle;
    const { error } = await supabase.from("rehearsals").upsert(row, { onConflict: "workout_id" });
    if (error) throw new Error(error.message);
    revalidatePath("/dance");
    revalidatePath("/");
  });
}

/**
 * "Start the dance": snapshot what will play onto today's row, in the look on
 * screen. danced_at (with the look it was first danced in) is set only if null;
 * recital_program only when a recital is ready and the column is null, and with
 * it the poster dances of that Program and of any skipped one before it, so
 * posters never change. The returned plan is exactly what the client plays.
 */
export async function startDance(danceId: string | null, look: Look): Promise<ActionResult<PerformancePlan>> {
  return attempt(async () => {
    const today = todayLocal();
    const { input, workout } = await loadStageInput(today);
    if (!workout?.completedAt) throw new Friendly("Finish today’s workout first — then Pirouette dances.");
    const nMax = countNMax(input);
    checkLook(look, unlockedKeys(nMax));

    let name = PIROUETTES_CHOICE_NAME;
    let moves: MoveKey[] = pirouettesChoice(nMax);
    let id: string | null = null;
    if (danceId) {
      // A put-away dance falls back to Pirouette's choice, which is what the screen shows then.
      const { data: d, error } = await supabase
        .from("dances").select("*").eq("id", danceId).is("archived_at", null).maybeSingle();
      if (error) throw new Error(`Couldn’t load that dance: ${error.message}`);
      if (d) {
        id = d.id as string;
        name = d.name as string;
        moves = ((d.moves as string[]) ?? []).filter(isMoveKey);
      }
    }
    if (moves.length === 0) moves = pirouettesChoice(nMax);

    const existing = todayRowOf(input);
    const update: Record<string, unknown> = {
      workout_id: workout.id, dance_id: id, dance_name: name, moves,
      costume: look.costume, stage: look.stage, music: look.music, sparkle: look.sparkle,
    };
    if (!existing?.dancedAt) {
      update.danced_at = new Date().toISOString();
      update.danced_costume = look.costume;
      update.danced_stage = look.stage;
    }

    // The recital counts as performed the moment it starts (§5.4), and only once.
    let recital: RecitalPlan | null = null;
    const planned = recitalPlan(input);
    if (planned && existing?.recitalProgram == null) {
      update.recital_program = planned.program;
      const snapshots: Record<string, MoveKey[][]> = { [planned.program]: planned.posterDances };
      for (let p = maxPerformed(input) + 1; p < planned.program; p++) snapshots[p] = posterDances(input, p);
      update.poster_dances = snapshots;
      recital = planned;
    }

    const { error } = await supabase.from("rehearsals").upsert(update, { onConflict: "workout_id" });
    if (error) throw new Error(error.message);
    revalidatePath("/dance");
    revalidatePath("/");
    revalidatePath("/collection");
    return { dance: { name, moves }, recital };
  });
}

/**
 * The Bow: add this dance's caught sparkles to today's row (§5.3), once per
 * dance, including after Stop and after "Dance again". Nothing else is written.
 */
export async function recordCatches(n: number) {
  return attempt(async () => {
    if (!Number.isInteger(n) || n <= 0) return;
    if (n > 500) throw new Error(`recordCatches: ${n} is not a believable count`);
    const { id } = await openWorkoutToday();
    const { data: row, error: readError } = await supabase
      .from("rehearsals").select("sparkles_caught").eq("workout_id", id).maybeSingle();
    if (readError) throw new Error(readError.message);
    const total = ((row?.sparkles_caught as number | undefined) ?? 0) + n;
    const { error } = await supabase
      .from("rehearsals").upsert({ workout_id: id, sparkles_caught: total }, { onConflict: "workout_id" });
    if (error) throw new Error(error.message);
    revalidatePath("/dance");
    revalidatePath("/collection");
    revalidatePath("/");
  });
}

/** "Done for today": the curtains close and stay closed. */
export async function closeCurtains() {
  return attempt(async () => {
    const { id } = await openWorkoutToday();
    const { error } = await supabase.from("workouts").update({ stage_closed_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dance");
    revalidatePath("/");
  });
}

/** "Open the curtains": free play after Done for today; nothing more is earned. */
export async function openCurtains() {
  return attempt(async () => {
    const { id } = await openWorkoutToday();
    const { error } = await supabase.from("workouts").update({ stage_closed_at: null }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dance");
    revalidatePath("/");
  });
}
