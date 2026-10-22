"use server";

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
  unlockedMoves, ambientSparkles, newSinceLastTime, todaysNewItem, todayRow as todayRowOf, programDances,
  type ProgramLine, type StageInput,
} from "@/lib/dance-progress";
import { loadStageInput } from "@/lib/stage-data";

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
  /** Ambient sparkle count with the Sparkle catch lane taken out of the budget. */
  ambient: number;
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
  };
}

export async function getStageData(): Promise<StageData> {
  const today = todayLocal();
  const { input, workout, settings } = await loadStageInput(today);
  const n = countN(input);
  const nMax = countNMax(input);

  const { data: danceRows, error } = await supabase
    .from("dances").select("*").is("archived_at", null).order("created_at", { ascending: true });
  if (error) throw new Error(`Couldn’t load the dances: ${error.message}`);
  const all: StageDance[] = (danceRows ?? []).map((d) => ({
    id: d.id as string,
    name: d.name as string,
    moves: ((d.moves as string[]) ?? []).filter(isMoveKey),
    presetKey: (d.preset_key as string | null) ?? null,
  }));
  // The fixed grid never reorders: presets by catalog order, not by insert time.
  const presets = all
    .filter((d) => d.presetKey)
    .sort((a, b) => PRESET_ORDER.indexOf(a.presetKey!) - PRESET_ORDER.indexOf(b.presetKey!));
  const hers = all.filter((d) => !d.presetKey).reverse();
  const danceIds = new Set(all.map((d) => d.id));

  const row = todayRowOf(input);
  const latest = [...input.rehearsals].sort((a, b) => (a.performedOn < b.performedOn ? 1 : -1))[0] ?? null;
  const source = row ?? latest;
  const look: Look = source
    ? { costume: source.costume, stage: source.stage, music: source.music, sparkle: source.sparkle }
    : DEFAULT_LOOK;
  const lastDanced = [...input.rehearsals].filter((r) => r.dancedAt).sort((a, b) => (a.performedOn < b.performedOn ? 1 : -1))[0];
  const lastDanceId = lastDanced?.danceId && danceIds.has(lastDanced.danceId) ? lastDanced.danceId : null;

  const recital = recitalPlan(input);
  const newToday = todaysNewItem(input);

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
    pirouettesChoice: pirouettesChoice(nMax),
    slotCount: slotCount(nMax),
    unlockedKeys: [...unlockedKeys(nMax)],
    decorations: decorations(input).map((p) => p.decoration.key),
    recital,
    bannerToday: newToday ? `New today: ${announce(newToday)}` : null,
    bannerSince: row ? [] : newSinceLastTime(input).map(announce),
    earnedCats: computeEarnedCats(n),
    ambient: ambientSparkles(n, settings.sparkleAmount, 0, settings.sparkleTaps ? 1 : 0),
  };
}

async function openWorkoutToday() {
  const today = todayLocal();
  const { data: workout, error } = await supabase
    .from("workouts").select("id, completed_at").eq("performed_on", today).maybeSingle();
  if (error) throw new Error(`Couldn’t reach the stage: ${error.message}`);
  if (!workout?.completed_at) throw new Error("Finish today’s workout first — then Pirouette dances.");
  return { id: workout.id as string, today };
}

/**
 * Get ready: upsert today's look. The client sends the whole look on screen so
 * the first write never falls back to the column defaults, and the last request
 * to arrive always carries complete state. Touches only the four look columns.
 */
export async function setLook(look: Partial<Look>) {
  const today = todayLocal();
  const { input, workout } = await loadStageInput(today);
  if (!workout?.completedAt) throw new Error("Finish today’s workout first — then Pirouette dances.");
  const allowed = unlockedKeys(countNMax(input));
  const check = (value: string | undefined, keys: string[], extra: string[], what: string) => {
    if (value == null) return;
    if (!(extra.includes(value) || (keys.includes(value) && allowed.has(value)))) {
      throw new Error(`That ${what} isn’t ready yet`);
    }
  };
  check(look.costume, COSTUMES.map((c) => c.key), [], "costume");
  check(look.stage, STAGES.map((s) => s.key), [], "stage");
  check(look.music, MUSIC.map((m) => m.key), [QUIET_KEY], "music");
  check(look.sparkle, SPARKLES.map((s) => s.key), [NONE_KEY], "sparkle style");

  const row: Record<string, unknown> = { workout_id: workout.id };
  if (look.costume != null) row.costume = look.costume;
  if (look.stage != null) row.stage = look.stage;
  if (look.music != null) row.music = look.music;
  if (look.sparkle != null) row.sparkle = look.sparkle;
  const { error } = await supabase.from("rehearsals").upsert(row, { onConflict: "workout_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/dance");
  revalidatePath("/");
}

/**
 * "Start the dance": snapshot what will play onto today's row. danced_at is set
 * only if null; recital_program only when a recital is ready and the column is
 * null. The returned plan is exactly what the client plays.
 */
export async function startDance(danceId: string | null): Promise<PerformancePlan> {
  const today = todayLocal();
  const { input, workout } = await loadStageInput(today);
  if (!workout?.completedAt) throw new Error("Finish today’s workout first — then Pirouette dances.");
  const nMax = countNMax(input);

  let name = PIROUETTES_CHOICE_NAME;
  let moves: MoveKey[] = pirouettesChoice(nMax);
  let id: string | null = null;
  if (danceId) {
    const { data: d, error } = await supabase.from("dances").select("*").eq("id", danceId).maybeSingle();
    if (error) throw new Error(`Couldn’t load that dance: ${error.message}`);
    if (d) {
      id = d.id as string;
      name = d.name as string;
      moves = ((d.moves as string[]) ?? []).filter(isMoveKey);
    }
  }
  if (moves.length === 0) moves = pirouettesChoice(nMax);

  const existing = todayRowOf(input);
  const update: Record<string, unknown> = { workout_id: workout.id, dance_id: id, dance_name: name, moves };
  if (!existing?.dancedAt) update.danced_at = new Date().toISOString();

  // The recital counts as performed the moment it starts (§5.4), and only once.
  let recital: RecitalPlan | null = null;
  const planned = recitalPlan(input);
  if (planned && existing?.recitalProgram == null) {
    update.recital_program = planned.program;
    recital = planned;
  }

  const { error } = await supabase.from("rehearsals").upsert(update, { onConflict: "workout_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/dance");
  revalidatePath("/");
  revalidatePath("/collection");
  return { dance: { name, moves }, recital };
}

/** "Done for today": the curtains close and stay closed. */
export async function closeCurtains() {
  const { id } = await openWorkoutToday();
  const { error } = await supabase.from("workouts").update({ stage_closed_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dance");
  revalidatePath("/");
}

/** "Open the curtains": free play after Done for today; nothing more is earned. */
export async function openCurtains() {
  const { id } = await openWorkoutToday();
  const { error } = await supabase.from("workouts").update({ stage_closed_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dance");
  revalidatePath("/");
}
