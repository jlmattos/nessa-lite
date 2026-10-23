/**
 * Everything the stage derives from history (GAME-DESIGN.md §8 "Derived").
 * Pure functions, no I/O, mirrors collection.ts: the inputs are the completed
 * workout dates, the high-water mark, and her rehearsal rows. Nothing here is
 * stored, so nothing can go backwards.
 */
import {
  CATALOG, LENGTHS, MOVES, PROGRAMS, PROGRAM_BY_NUMBER, BASE_SLOTS, WORKOUTS_PER_PROGRAM, PROGRAMS_PER_SEASON,
  RECITALS_SHIPPED, PIROUETTES_CHOICE_NAME, announce, type CatalogItem, type MoveKey, type ProgramDef,
} from "@/lib/dance-content";

export type RehearsalRow = {
  workoutId: string;
  performedOn: string;
  costume: string;
  stage: string;
  music: string;
  sparkle: string;
  danceId: string | null;
  danceName: string | null;
  moves: string[] | null;
  recitalProgram: number | null;
  sparklesCaught: number;
  dancedAt: string | null;
};

export type StageInput = {
  /** performed_on of every completed workout, any order. */
  completedDates: string[];
  today: string;
  /** Today's workout exists and is completed. */
  todayCompleted: boolean;
  highWaterN: number;
  /** Rows of completed workouts only (ordinals, looks, Program dances). */
  rehearsals: RehearsalRow[];
  /**
   * Every recital ever performed, from all rows whatever their workout's state:
   * nothing clears danced_at or recital_program, so a Reopen never takes one away.
   */
  performedPrograms: number[];
};

const SEASON_ONE_END = WORKOUTS_PER_PROGRAM * PROGRAMS_PER_SEASON; // 50
/** The day-1 base kit (unlockAt 1) is "the stage opens", never announced as items. */
const FIRST_ITEM_DAY = 2;

// ── Counts ──────────────────────────────────────────────────────────────────

/** N: completed workouts. The cats use the same number. */
export const countN = (input: StageInput) => input.completedDates.length;

/** N_max: never lower than any N she has reached, so nothing relocks. */
export const countNMax = (input: StageInput) => Math.max(countN(input), input.highWaterN);

/** What Today describes: this workout's number, before or after Finish. */
export const todayN = (input: StageInput) => countN(input) + (input.todayCompleted ? 0 : 1);

export const programOf = (n: number) => Math.ceil(n / WORKOUTS_PER_PROGRAM);
export const positionOf = (n: number) => ((((n - 1) % WORKOUTS_PER_PROGRAM) + WORKOUTS_PER_PROGRAM) % WORKOUTS_PER_PROGRAM) + 1;
export const isRecitalPosition = (n: number) => positionOf(n) === WORKOUTS_PER_PROGRAM;

/** 1-based ordinal of a completed workout among all completed workouts. */
export function ordinalOf(input: StageInput, performedOn: string): number {
  return input.completedDates.filter((d) => d <= performedOn).length;
}

// ── Recitals ─────────────────────────────────────────────────────────────────

export function performedRecitals(input: StageInput): number[] {
  return [...new Set(input.performedPrograms)].sort((a, b) => a - b);
}

export const maxPerformed = (input: StageInput) => Math.max(0, ...performedRecitals(input));

/** The newest recital she has earned but not performed; older ones are skipped, never performed. */
export function readyRecital(input: StageInput): number | null {
  if (!RECITALS_SHIPPED) return null;
  const p = Math.floor(countN(input) / WORKOUTS_PER_PROGRAM);
  return p > maxPerformed(input) ? p : null;
}

/**
 * The ready recital is today's own (an on-time recital day, position 5 of a
 * completed workout) rather than an older one played first on a later visit.
 */
export function recitalOnTime(input: StageInput): boolean {
  const ready = readyRecital(input);
  const n = countN(input);
  return ready != null && input.todayCompleted && n % WORKOUTS_PER_PROGRAM === 0 && ready === n / WORKOUTS_PER_PROGRAM;
}

/** Decorations present on every stage: one per performed recital. */
export function decorations(input: StageInput): ProgramDef[] {
  const top = maxPerformed(input);
  return PROGRAMS.filter((p) => p.program <= top);
}

// ── Unlocks ──────────────────────────────────────────────────────────────────

const seasonVisible = (item: CatalogItem, nMax: number) => item.season === 1 || nMax >= SEASON_ONE_END;

/**
 * Everything she can use at N_max: reached AND shipped. An unshipped item past
 * its day stays dimmed and promise-free until its code ships (§9).
 */
export function unlockedKeys(nMax: number): Set<string> {
  return new Set(CATALOG.filter((i) => i.shipped && i.unlockAt <= nMax && seasonVisible(i, nMax)).map((i) => i.key));
}

/** Moves per dance at N_max: 6, then 8, 10, 12 as the shipped length items unlock. */
export function slotCount(nMax: number): number {
  return LENGTHS.filter((l) => l.shipped && l.unlockAt <= nMax).reduce((m, l) => Math.max(m, l.slots), BASE_SLOTS);
}

/**
 * Ambient sparkles during the dance: "lots" grows one per Program, capped at 12
 * before the motion budget (12 moving elements minus stage weather minus
 * Sparkle catch lanes), never below 3; "some" is a fixed 3.
 */
export function ambientSparkles(n: number, amount: "some" | "lots", weather = 0, lanes = 0): number {
  if (amount === "some") return 3;
  return Math.max(3, Math.min(6 + Math.floor(n / WORKOUTS_PER_PROGRAM), 12 - weather - lanes));
}

/** Every shipped, unlocked move once, in catalog order (the recital finale). */
export function unlockedMoves(nMax: number): MoveKey[] {
  return MOVES.filter((m) => m.shipped && m.unlockAt <= nMax && seasonVisible(m, nMax)).map((m) => m.key);
}

/** Pirouette's choice: every shipped, unlocked move once, in catalog order, up to the slot count. */
export function pirouettesChoice(nMax: number): MoveKey[] {
  return MOVES.filter((m) => m.shipped && m.unlockAt <= nMax && seasonVisible(m, nMax))
    .map((m) => m.key)
    .slice(0, slotCount(nMax));
}

export type NextUnlock =
  | { kind: "item"; item: CatalogItem; inWorkouts: number }
  | { kind: "recital"; program: number; inWorkouts: number };

/**
 * The "Next:" line: the nearest shipped item at or after todayN, or the next
 * recital when that comes sooner or no shipped item lies ahead (§3.0).
 */
export function nextUnlock(tN: number, nMax: number): NextUnlock {
  const ahead = CATALOG.filter((i) => i.shipped && i.unlockAt >= Math.max(tN, FIRST_ITEM_DAY) && seasonVisible(i, nMax))
    .sort((a, b) => a.unlockAt - b.unlockAt)[0];
  const nextRecitalN = isRecitalPosition(tN) ? tN + WORKOUTS_PER_PROGRAM : programOf(tN) * WORKOUTS_PER_PROGRAM;
  const recital: NextUnlock = { kind: "recital", program: nextRecitalN / WORKOUTS_PER_PROGRAM, inWorkouts: nextRecitalN - tN };
  if (!ahead) return recital;
  if (RECITALS_SHIPPED && nextRecitalN < ahead.unlockAt) return recital;
  return { kind: "item", item: ahead, inWorkouts: ahead.unlockAt - tN };
}

/** Shipped wardrobe, move and length items with fromN < unlockAt <= toN (base kit, decorations and features excluded). */
export function newlyUnlocked(fromN: number, toN: number, nMax: number): CatalogItem[] {
  const from = Math.max(fromN, FIRST_ITEM_DAY - 1);
  return CATALOG.filter(
    (i) => i.shipped && i.kind !== "feature" && i.unlockAt > from && i.unlockAt <= toN && seasonVisible(i, nMax)
  ).sort((a, b) => a.unlockAt - b.unlockAt);
}

/** The one shipped item whose day is today's completed workout (for the ending card). */
export function todaysNewItem(input: StageInput): CatalogItem | null {
  if (!input.todayCompleted) return null;
  const n = countN(input);
  return newlyUnlocked(n - 1, n, countNMax(input))[0] ?? null;
}

// ── The Program line on Today (§3.0) ────────────────────────────────────────

export type ProgramLine = {
  program: number;
  position: number;
  /** Positions 1–4: filled when that rehearsal is done this Program. */
  circles: [boolean, boolean, boolean, boolean];
  star: "future" | "today" | "done";
  isRecitalDay: boolean;
  text: string;
  nextText: string;
};

export function programLine(input: StageInput): ProgramLine {
  const tN = todayN(input);
  const program = programOf(tN);
  const position = positionOf(tN);
  // Until recitals play (Phase 1b), position 5 is not marked as a recital: no promise it cannot keep.
  const isRecitalDay = RECITALS_SHIPPED && position === WORKOUTS_PER_PROGRAM;
  let circles = [1, 2, 3, 4].map((p) => p < position || (p === position && input.todayCompleted)) as ProgramLine["circles"];
  let star: ProgramLine["star"] = isRecitalDay ? (input.todayCompleted ? "done" : "today") : "future";

  const performed = new Set(performedRecitals(input));
  const ready = readyRecital(input);
  let text: string;
  if (isRecitalDay && !performed.has(program)) text = `Recital ${program} today.`;
  else if (isRecitalDay) text = `Recital ${program} complete.`;
  else if (ready != null) {
    text = `Recital ${ready} is ready.`;
    circles = [true, true, true, true];
    star = "today";
  } else if (position === WORKOUTS_PER_PROGRAM) text = `Rehearsal ${position}`;
  else text = `Rehearsal ${position} of 4`;

  let nextText: string;
  if (tN === 1) nextText = "Today: the stage opens.";
  else {
    const next = nextUnlock(tN, countNMax(input));
    if (next.kind === "item") {
      const label = announce(next.item);
      const sep = next.item.kind === "move" ? ", " : " ";
      nextText = next.inWorkouts === 0
        ? `Today: ${label}`
        : `Next: ${label}${sep}in ${next.inWorkouts} workout${next.inWorkouts === 1 ? "" : "s"}`;
    } else {
      nextText = `Next: Recital ${next.program} in ${next.inWorkouts} workout${next.inWorkouts === 1 ? "" : "s"}`;
    }
  }

  return { program, position, circles, star, isRecitalDay, text, nextText };
}

// ── Rows, programs and the banner ────────────────────────────────────────────

export function rowProgram(input: StageInput, row: RehearsalRow): { program: number; position: number } {
  const ord = ordinalOf(input, row.performedOn);
  return { program: programOf(ord), position: positionOf(ord) };
}

/** Today's rehearsal row, if she has opened the stage today. */
export function todayRow(input: StageInput): RehearsalRow | null {
  return input.rehearsals.find((r) => r.performedOn === input.today) ?? null;
}

/**
 * The distinct dances of Program P, positions 1–4 in order, for a recital.
 * A position with no row or no snapshot plays Pirouette's choice as it is now (moves null).
 */
export function programDances(input: StageInput, program: number): { name: string; moves: MoveKey[] | null }[] {
  const nMax = countNMax(input);
  const seen = new Set<string>();
  const out: { name: string; moves: MoveKey[] | null }[] = [];
  for (let position = 1; position < WORKOUTS_PER_PROGRAM; position++) {
    const row = input.rehearsals.find((r) => {
      const rp = rowProgram(input, r);
      return rp.program === program && rp.position === position && r.dancedAt;
    });
    const moves = (row?.moves ?? pirouettesChoice(nMax)) as MoveKey[];
    const key = moves.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name: row?.danceName ?? PIROUETTES_CHOICE_NAME, moves: row?.moves ? (row.moves as MoveKey[]) : null });
  }
  return out;
}

/** "New since last time": shipped items unlocked on workouts whose stage she never opened. */
export function newSinceLastTime(input: StageInput): CatalogItem[] {
  const n = countN(input);
  const latest = input.rehearsals.map((r) => ordinalOf(input, r.performedOn)).reduce((m, o) => Math.max(m, o), 0);
  return newlyUnlocked(latest, n - 1, countNMax(input));
}

/** The gold dot on the Stage tab: today's workout is complete and she has not danced yet. */
export function stageWaiting(input: StageInput): boolean {
  return input.todayCompleted && !todayRow(input)?.dancedAt;
}

export const themeOf = (program: number) => PROGRAM_BY_NUMBER.get(program)?.theme ?? `Program ${program}`;

// Re-exported so callers that only need the string don't import the whole catalog.
export { announce };

// ── The Season map on the Friends tab (§4 item 6) ───────────────────────────

export type SeasonSlot = {
  program: number;
  theme: string;
  color: string;
  /** A recital at or after it has been performed (its poster's place). */
  done: boolean;
  /** The Program she is in; on recital night it is both done and here. */
  now: boolean;
};

export type SeasonPath = { season: 1 | 2; slots: SeasonSlot[] };

/** Season One always; Season Two's path appears once Recital 10 has been performed. */
export function seasonMap(input: StageInput): SeasonPath[] {
  const top = maxPerformed(input);
  const current = programOf(Math.max(1, todayN(input)));
  const path = (season: 1 | 2): SeasonPath => ({
    season,
    slots: PROGRAMS.filter((p) => (season === 1 ? p.program <= PROGRAMS_PER_SEASON : p.program > PROGRAMS_PER_SEASON)).map((p) => ({
      program: p.program,
      theme: p.theme,
      color: p.color,
      done: p.program <= top,
      now: p.program === current,
    })),
  });
  return top >= PROGRAMS_PER_SEASON ? [path(1), path(2)] : [path(1)];
}
