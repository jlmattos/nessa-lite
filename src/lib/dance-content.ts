/**
 * The stage catalog. Phase 0 holds only the four base moves and the two
 * preset dances; wardrobe, decorations, Programs and the rest of the moves
 * arrive with Phase 1a (see GAME-DESIGN.md §4.1 and §8). Every item here is
 * data: a key the code uses, a display name she reads, and an unlock day.
 */
export type MoveKey = "plie" | "reach" | "twirl" | "arabesque" | "grand_spin";

export type MoveDef = {
  key: MoveKey;
  /** What she reads on the tile and in the strip. Jose: keep the ballet names. */
  name: string;
  /** Length in beats at the song's tempo. */
  beats: number;
  /** The move's note (MIDI). Pentatonic, so any sequence is a consonant tune. */
  midi: number;
  /** A second note played with the first (Big spin sounds G5 + C6). */
  midi2?: number;
  unlockAt: number;
};

export const MOVES: MoveDef[] = [
  { key: "plie", name: "Plié", beats: 2, midi: 72, unlockAt: 1 },        // C5
  { key: "reach", name: "Reach", beats: 2, midi: 76, unlockAt: 1 },      // E5
  { key: "twirl", name: "Twirl", beats: 4, midi: 79, unlockAt: 1 },      // G5
  { key: "arabesque", name: "Arabesque", beats: 2, midi: 81, unlockAt: 1 }, // A5
  { key: "grand_spin", name: "Big spin", beats: 4, midi: 79, midi2: 84, unlockAt: 41 }, // G5 + C6 — in the spike early so the fastest spin is checked on the iPad
];

export const MOVE_BY_KEY = Object.fromEntries(MOVES.map((m) => [m.key, m])) as Record<MoveKey, MoveDef>;

/** The Bow is implicit at the end of every dance. */
export const BOW_BEATS = 2;
export const BOW_CHORD = [72, 76, 79, 84]; // C5 E5 G5 C6

export const PRESET_DANCES: Record<string, { name: string; moves: MoveKey[] }> = {
  little_waltz: { name: "Little Waltz", moves: ["plie", "reach", "twirl", "plie", "reach", "arabesque"] },
  twirl_song: { name: "Twirl Song", moves: ["reach", "twirl", "arabesque", "twirl"] },
};
