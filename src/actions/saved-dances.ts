"use server";

import { attempt, Friendly, type ActionResult } from "@/lib/action-result";
import { supabase } from "@/lib/db";
import { todayLocal } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import { NAME_WORDS, isMoveKey, type MoveKey } from "@/lib/dance-content";
import { countNMax, slotCount, unlockedKeys } from "@/lib/dance-progress";
import { loadStageInput } from "@/lib/stage-data";

/**
 * Her own dances (GAME-DESIGN.md §5.2, §8): Save from the naming screen, Change
 * in place, Put away and Put it back. Presets can't be changed or put away.
 * Names are settled here, so two quick saves can never share one.
 */

function refreshAll() {
  revalidatePath("/dance");
  revalidatePath("/collection");
  revalidatePath("/");
}

/** The editor lives on the open stage: today's workout must be finished. */
async function editorState() {
  const today = todayLocal();
  const { input, workout } = await loadStageInput(today);
  if (!workout?.completedAt) throw new Friendly("Finish today’s workout first — then Pirouette dances.");
  const nMax = countNMax(input);
  return { nMax, unlocked: unlockedKeys(nMax), slots: slotCount(nMax) };
}

function checkMoves(moves: string[], unlocked: Set<string>, slots: number): MoveKey[] {
  if (moves.length === 0) throw new Friendly("Tap a move first.");
  if (moves.length > slots) throw new Friendly(`A dance has room for ${slots} moves.`);
  for (const m of moves) {
    if (!isMoveKey(m) || !unlocked.has(m)) throw new Friendly("That move isn’t ready yet.");
  }
  return moves as MoveKey[];
}

/** "Moon Waltz", "Moon", or null when no word was chosen. */
function nameFromWords(words: [string | null, string | null]): string | null {
  const [a, b] = words;
  if (a != null && !NAME_WORDS[0].includes(a)) throw new Friendly("That word isn’t one of the tiles.");
  if (b != null && !NAME_WORDS[1].includes(b)) throw new Friendly("That word isn’t one of the tiles.");
  const name = [a, b].filter(Boolean).join(" ");
  return name || null;
}

/** A name already in use gets " 2", " 3", … (case does not matter). */
function unique(name: string, taken: string[]): string {
  const used = new Set(taken.map((t) => t.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  for (let k = 2; ; k++) {
    const candidate = `${name} ${k}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

async function allDances() {
  const { data, error } = await supabase.from("dances").select("id, name, is_preset");
  if (error) throw new Error(`Couldn’t load the dances: ${error.message}`);
  return (data ?? []).map((d) => ({ id: d.id as string, name: d.name as string, isPreset: !!d.is_preset }));
}

/**
 * Save from the naming screen. Without `id` it makes a new dance: two words
 * make "Moon Waltz", one word makes that word, none makes "Dance K" (K = all
 * her saved dances, put-away ones included, + 1). With `id` it changes that
 * dance in place; no words keep its name. Past evenings keep their snapshot.
 */
export async function saveDance(input: {
  id: string | null;
  words: [string | null, string | null];
  moves: string[];
}): Promise<ActionResult<{ id: string; name: string }>> {
  return attempt(async () => {
    const { unlocked, slots } = await editorState();
    if (!unlocked.has("new_dance")) throw new Friendly("Making dances opens soon.");
    const moves = checkMoves(input.moves, unlocked, slots);
    const chosen = nameFromWords(input.words);
    const dances = await allDances();

    if (input.id) {
      const current = dances.find((d) => d.id === input.id);
      if (!current) throw new Friendly("That dance isn’t here any more.");
      if (current.isPreset) throw new Friendly("Pirouette’s dances can’t be changed.");
      const others = dances.filter((d) => d.id !== input.id).map((d) => d.name);
      const name = chosen ? unique(chosen, others) : current.name;
      const { error } = await supabase.from("dances").update({ name, moves }).eq("id", input.id).eq("is_preset", false);
      if (error) throw new Error(error.message);
      refreshAll();
      return { id: input.id, name };
    }

    const saved = dances.filter((d) => !d.isPreset).length;
    const name = unique(chosen ?? `Dance ${saved + 1}`, dances.map((d) => d.name));
    const { data, error } = await supabase
      .from("dances").insert({ name, moves, is_preset: false }).select("id").single();
    if (error) throw new Error(error.message);
    refreshAll();
    return { id: data.id as string, name };
  });
}

/** "Put away": one tap; it leaves My dances but still counts for naming and the rosettes. */
export async function putAwayDance(id: string) {
  return attempt(async () => {
    await editorState();
    const { error } = await supabase
      .from("dances").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("is_preset", false);
    if (error) throw new Error(error.message);
    refreshAll();
  });
}

/** "Put it back". */
export async function putBackDance(id: string) {
  return attempt(async () => {
    await editorState();
    const { error } = await supabase.from("dances").update({ archived_at: null }).eq("id", id).eq("is_preset", false);
    if (error) throw new Error(error.message);
    refreshAll();
  });
}
