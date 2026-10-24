"use server";

import { attempt, Friendly, type ActionResult } from "@/lib/action-result";
import { supabase } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type RoutineMovement = {
  id: string; // routine_movements id
  movementId: string;
  name: string;
  icon: string;
  cue: string | null;
  position: number;
  targetReps: number | null;
  targetSecs: number | null;
};

export type Routine = {
  id: string;
  name: string;
  position: number;
  movements: RoutineMovement[];
};

function refresh() {
  revalidatePath("/routine");
  revalidatePath("/");
}

export async function listRoutines(): Promise<Routine[]> {
  const [{ data: routines }, { data: rows }] = await Promise.all([
    supabase.from("routines").select("*").order("position"),
    supabase
      .from("routine_movements")
      .select("id, routine_id, movement_id, position, target_reps, target_secs, movements(name, icon, cue)")
      .order("position"),
  ]);

  return (routines ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    position: r.position as number,
    movements: (rows ?? [])
      .filter((m) => m.routine_id === r.id)
      .map((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mv = ((m as any).movements ?? {}) as { name?: string; icon?: string; cue?: string | null };
        return {
          id: m.id as string,
          movementId: m.movement_id as string,
          name: mv.name ?? "?",
          icon: mv.icon ?? "⭐",
          cue: mv.cue ?? null,
          position: m.position as number,
          targetReps: (m.target_reps as number | null) ?? null,
          targetSecs: (m.target_secs as number | null) ?? null,
        };
      }),
  }));
}

export async function addRoutine(name: string) {
  return attempt(async () => {
    const trimmed = name.trim();
    if (!trimmed) throw new Friendly("Give the routine a name");
    const { data: last } = await supabase
      .from("routines").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase
      .from("routines").insert({ name: trimmed, position: (last?.position ?? 0) + 1 });
    if (error) throw new Error(error.message);
    refresh();
  });
}

export async function renameRoutine(id: string, name: string) {
  return attempt(async () => {
    const trimmed = name.trim();
    if (!trimmed) throw new Friendly("Give the routine a name");
    const { error } = await supabase.from("routines").update({ name: trimmed }).eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
  });
}

export async function deleteRoutine(id: string) {
  return attempt(async () => {
    const { error } = await supabase.from("routines").delete().eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
  });
}

/** Swap a routine with its neighbour (dir -1 = up, +1 = down). */
export async function moveRoutine(id: string, dir: -1 | 1) {
  return attempt(async () => {
    const { data: routines } = await supabase.from("routines").select("id, position").order("position");
    const list = routines ?? [];
    const idx = list.findIndex((r) => r.id === id);
    const other = list[idx + dir];
    if (idx < 0 || !other) return;
    // Swap positions — atomic enough for a single user.
    await supabase.from("routines").update({ position: -1 }).eq("id", id);
    await supabase.from("routines").update({ position: list[idx].position }).eq("id", other.id);
    await supabase.from("routines").update({ position: other.position }).eq("id", id);
    refresh();
  });
}

/** Find-or-create the movement by name (case-insensitive), then add it to the routine. */
export async function addMovementToRoutine(
  routineId: string,
  movementName: string,
  icon: string,
  cue: string | null,
  targetReps: number | null,
  targetSecs: number | null
) {
  return attempt(async () => {
    const name = movementName.trim();
    if (!name) throw new Friendly("Give the movement a name");

    const { data: existing } = await supabase
      .from("movements").select("id").ilike("name", name).maybeSingle();
    let movementId = existing?.id as string | undefined;
    if (!movementId) {
      const { data: created, error } = await supabase
        .from("movements").insert({ name, icon: icon || "⭐", cue }).select("id").single();
      if (error) throw new Error(error.message);
      movementId = created.id as string;
    }

    const { data: last } = await supabase
      .from("routine_movements").select("position")
      .eq("routine_id", routineId).order("position", { ascending: false }).limit(1).maybeSingle();

    const { error } = await supabase.from("routine_movements").insert({
      routine_id: routineId,
      movement_id: movementId,
      position: (last?.position ?? 0) + 1,
      target_reps: targetReps,
      target_secs: targetSecs,
    });
    if (error) {
      if (/duplicate|unique/i.test(error.message)) throw new Friendly(`${name} is already in this routine`);
      throw new Error(error.message);
    }
    refresh();
  });
}

export async function updateRoutineMovement(id: string, targetReps: number | null, targetSecs: number | null) {
  return attempt(async () => {
    const { error } = await supabase
      .from("routine_movements")
      .update({ target_reps: targetReps, target_secs: targetSecs })
      .eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
  });
}

export async function removeRoutineMovement(id: string) {
  return attempt(async () => {
    const { error } = await supabase.from("routine_movements").delete().eq("id", id);
    if (error) throw new Error(error.message);
    refresh();
  });
}

export async function moveRoutineMovement(id: string, dir: -1 | 1) {
  return attempt(async () => {
    const { data: row } = await supabase
      .from("routine_movements").select("routine_id").eq("id", id).single();
    if (!row) return;
    const { data: siblings } = await supabase
      .from("routine_movements").select("id, position")
      .eq("routine_id", row.routine_id).order("position");
    const list = siblings ?? [];
    const idx = list.findIndex((m) => m.id === id);
    const other = list[idx + dir];
    if (idx < 0 || !other) return;
    await supabase.from("routine_movements").update({ position: -1 }).eq("id", id);
    await supabase.from("routine_movements").update({ position: list[idx].position }).eq("id", other.id);
    await supabase.from("routine_movements").update({ position: other.position }).eq("id", id);
    refresh();
  });
}
