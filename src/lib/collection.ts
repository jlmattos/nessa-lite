/**
 * The cat-friend collection — the same ten chibi cats as lift-lite, earned
 * purely by workout count (blind-box style: locked ones show as silhouettes).
 * Derived from data the app already has: no table, no extra queries beyond a
 * count. Order = display order on the shelf.
 */
export type CatId =
  | "mochi" | "miso" | "nori" | "shadow" | "cosmo" | "reina"
  | "bricks" | "tank" | "sage" | "champ";

export type CatDef = {
  id: CatId;
  name: string;
  outfit: string;
  /** Shown under locked figurines — how to earn them. */
  hint: string;
  /** Total completed workouts needed. */
  workouts: number;
};

export const COLLECTION: CatDef[] = [
  { id: "mochi",  name: "Mochi",  outfit: "the Rookie",    hint: "Finish your first workout", workouts: 1 },
  { id: "miso",   name: "Miso",   outfit: "the Chef",      hint: "3 workouts",  workouts: 3 },
  { id: "nori",   name: "Nori",   outfit: "the Sailor",    hint: "5 workouts",  workouts: 5 },
  { id: "bricks", name: "Bricks", outfit: "the Builder",   hint: "8 workouts",  workouts: 8 },
  { id: "shadow", name: "Shadow", outfit: "the Ninja",     hint: "12 workouts", workouts: 12 },
  { id: "tank",   name: "Tank",   outfit: "the Strong",    hint: "16 workouts", workouts: 16 },
  { id: "sage",   name: "Sage",   outfit: "the Zen",       hint: "20 workouts", workouts: 20 },
  { id: "champ",  name: "Champ",  outfit: "the Gold",      hint: "25 workouts", workouts: 25 },
  { id: "cosmo",  name: "Cosmo",  outfit: "the Astronaut", hint: "35 workouts", workouts: 35 },
  { id: "reina",  name: "Reina",  outfit: "the Royal",     hint: "50 workouts", workouts: 50 },
];

export function computeEarnedCats(totalWorkouts: number): CatId[] {
  return COLLECTION.filter((c) => totalWorkouts >= c.workouts).map((c) => c.id);
}
