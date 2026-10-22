"use server";

import { supabase } from "@/lib/db";
import { todayLocal } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import type { Settings } from "@/lib/settings";
import { computeEarnedCats, type CatId } from "@/lib/collection";
import {
  COSTUMES, STAGES, MUSIC, SPARKLES, QUIET_KEY, NONE_KEY, RECITALS_SHIPPED, announce, isMoveKey, type MoveKey,
} from "@/lib/dance-content";
import {
  countN, countNMax, programLine, readyRecital, decorations, unlockedKeys, slotCount, pirouettesChoice,
  ambientSparkles, newSinceLastTime, todaysNewItem, todayRow as todayRowOf, programDances,
  type ProgramLine,
} from "@/lib/dance-progress";
import { loadStageInput } from "@/lib/stage-data";

export type Look = { costume: string; stage: string; music: string; sparkle: string };
export type StageDance = { id: string | null; name: string; moves: MoveKey[]; presetKey: string | null };
export type PerformancePlan = {
  dance: { name: string; moves: MoveKey[] };
  /** A recital that plays first tonight (Phase 1b plays it; 1a records it). */
  recital: { program: number; dances: { name: string; moves: MoveKey[] }[] } | null;
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
  /** Today's look, or yesterday's, or the defaults. */
  look: Look;
  hasRowToday: boolean;
  dancedToday: boolean;
  /** Preselected dance; null = Pirouette's choice. */
  lastDanceId: string | null;
  /** Presets first, then hers, newest first. */
  dances: StageDance[];
  pirouettesChoice: MoveKey[];
  slotCount: number;
  unlockedKeys: string[];
  /** Decoration keys present on every stage (one per performed recital). */
  decorations: string[];
  /** The recital that would play tonight, if one is ready. */
  recital: { program: number; dances: { name: string; moves: MoveKey[] }[] } | null;
  /** "New today: Swan costume" for the banner's first line. */
  bannerToday: string | null;
  /** "New since last time: …" item announcements. */
  bannerSince: string[];
  earnedCats: CatId[];
  /** Ambient sparkle count before the lane allocation. */
  ambient: number;
};

const DEFAULT_LOOK: Look = { costume: "classic", stage: "practice_room", music: "music_box", sparkle: "gold" };

export async function getStageData(): Promise<StageData> {
  const today = todayLocal();
  const { input, workout, settings } = await loadStageInput(today);
  const n = countN(input);
  const nMax = countNMax(input);

  const { data: danceRows } = await supabase
    .from("dances").select("*").is("archived_at", null).order("created_at", { ascending: true });
  const all: StageDance[] = (danceRows ?? []).map((d) => ({
    id: d.id as string,
    name: d.name as string,
    moves: ((d.moves as string[]) ?? []).filter(isMoveKey),
    presetKey: (d.preset_key as string | null) ?? null,
  }));
  const presets = all.filter((d) => d.presetKey);
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

  const ready = RECITALS_SHIPPED ? readyRecital(input) : null;
  const recital = ready != null
    ? {
        program: ready,
        dances: programDances(input, ready).map((d) => ({ name: d.name, moves: d.moves ?? pirouettesChoice(nMax) })),
      }
    : null;

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
  const { data: workout } = await supabase
    .from("workouts").select("id, completed_at").eq("performed_on", today).maybeSingle();
  if (!workout?.completed_at) throw new Error("Finish today’s workout first — then Pirouette dances.");
  return { id: workout.id as string, today };
}

function assertKey(value: string, allowed: string[], what: string) {
  if (!allowed.includes(value)) throw new Error(`That ${what} isn’t available`);
}

/** Get ready: upsert today's look. Touches only the four look columns, never the dance or danced_at. */
export async function setLook(patch: Partial<Look>) {
  const { id } = await openWorkoutToday();
  const row: Record<string, unknown> = { workout_id: id };
  if (patch.costume != null) { assertKey(patch.costume, COSTUMES.map((c) => c.key), "costume"); row.costume = patch.costume; }
  if (patch.stage != null) { assertKey(patch.stage, STAGES.map((s) => s.key), "stage"); row.stage = patch.stage; }
  if (patch.music != null) { assertKey(patch.music, [...MUSIC.map((m) => m.key), QUIET_KEY], "music"); row.music = patch.music; }
  if (patch.sparkle != null) { assertKey(patch.sparkle, [...SPARKLES.map((s) => s.key), NONE_KEY], "sparkle style"); row.sparkle = patch.sparkle; }
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

  let name = "Pirouette’s choice";
  let moves: MoveKey[] = pirouettesChoice(nMax);
  let id: string | null = null;
  if (danceId) {
    const { data: d } = await supabase.from("dances").select("*").eq("id", danceId).maybeSingle();
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

  let recital: PerformancePlan["recital"] = null;
  const ready = RECITALS_SHIPPED ? readyRecital(input) : null;
  if (ready != null && existing?.recitalProgram == null) {
    update.recital_program = ready;
    recital = {
      program: ready,
      dances: programDances(input, ready).map((d) => ({ name: d.name, moves: d.moves ?? pirouettesChoice(nMax) })),
    };
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
