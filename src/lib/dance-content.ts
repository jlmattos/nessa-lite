/**
 * The stage catalog (GAME-DESIGN.md §4.1, §4.2, §5). Every item is data: a
 * key the code uses, a display name she reads, the kind word every
 * announcement carries, the workout it unlocks at, its season, and whether
 * its code has shipped. `shipped: false` items are visible in their slot but
 * carry no number, and the "Next:" line skips them. A number she has seen
 * never changes, so `unlockAt` values are append-only history, not tuning.
 */
export type Season = 1 | 2;
export type ItemKind = "costume" | "stage" | "music" | "sparkle" | "move" | "length" | "feature";

export type CatalogItem = {
  key: string;
  name: string;
  kind: ItemKind;
  /** The word the announcement carries: "New today: Swan costume". */
  kindWord: string;
  unlockAt: number;
  season: Season;
  shipped: boolean;
};

// ── Moves ────────────────────────────────────────────────────────────────────
export type MoveKey =
  | "plie" | "reach" | "twirl" | "arabesque" | "saute" | "curtsy" | "glide" | "grand_spin"
  | "wave_arms" | "final_pose";

export type MoveDef = CatalogItem & {
  kind: "move";
  key: MoveKey;
  /** Length in beats at the song's tempo. */
  beats: number;
  /** The move's note (MIDI). Pentatonic, so any sequence is a consonant tune. */
  midi: number;
  /** A second note played with the first (Big spin sounds G5 + C6). */
  midi2?: number;
};

const move = (key: MoveKey, name: string, beats: number, midi: number, unlockAt: number, shipped: boolean, extra: Partial<MoveDef> = {}): MoveDef => ({
  key, name, kind: "move", kindWord: "a new move", beats, midi, unlockAt, season: unlockAt > 50 ? 2 : 1, shipped, ...extra,
});

export const MOVES: MoveDef[] = [
  move("plie", "Plié", 2, 72, 1, true),              // C5
  move("reach", "Reach", 2, 76, 1, true),            // E5
  move("twirl", "Twirl", 4, 79, 1, true),            // G5
  move("arabesque", "Arabesque", 2, 81, 1, true),    // A5
  move("saute", "Sauté", 2, 84, 9, false),           // C6
  move("curtsy", "Curtsy", 2, 74, 27, false),        // D5
  move("glide", "Glide", 4, 76, 33, false),          // E5
  move("grand_spin", "Big spin", 4, 79, 41, true, { midi2: 84 }), // G5 + C6 — rig built in Phase 0
  move("wave_arms", "Wave arms", 2, 81, 64, false),
  move("final_pose", "Final pose", 4, 84, 84, false),
];
export const MOVE_BY_KEY = Object.fromEntries(MOVES.map((m) => [m.key, m])) as Record<MoveKey, MoveDef>;
export const isMoveKey = (k: string): k is MoveKey => k in MOVE_BY_KEY;

/** The Bow is implicit at the end of every dance. */
export const BOW_BEATS = 2;
export const BOW_CHORD = [72, 76, 79, 84]; // C5 E5 G5 C6

// ── Wardrobe ─────────────────────────────────────────────────────────────────
export type CostumeDef = CatalogItem & {
  kind: "costume";
  /** CSS custom properties on the rig root. */
  colors: { tutu: string; leotard: string; bow: string };
  /** Which overlay shapes to draw (see costume-overlays.tsx). */
  overlay: string | null;
};

const costume = (key: string, name: string, unlockAt: number, colors: CostumeDef["colors"], overlay: string | null, shipped: boolean): CostumeDef => ({
  key, name, kind: "costume", kindWord: "costume", unlockAt, season: unlockAt > 50 ? 2 : 1, shipped, colors, overlay,
});

export const COSTUMES: CostumeDef[] = [
  costume("classic", "Classic", 1, { tutu: "#f7c6d9", leotard: "#ec9fbd", bow: "#e26d5c" }, null, true),
  costume("swan", "Swan", 4, { tutu: "#fff7ef", leotard: "#fff7ef", bow: "#e26d5c" }, "feathers", true),
  costume("sugar_plum", "Sugar Plum", 13, { tutu: "#d8c3f0", leotard: "#d8c3f0", bow: "#e6b422" }, "tiara", false),
  costume("rose_garden", "Rose Garden", 18, { tutu: "#f7c6d9", leotard: "#7fb069", bow: "#e26d5c" }, "flower_crown", false),
  costume("snowflake", "Snowflake", 23, { tutu: "#dbeefb", leotard: "#fff7ef", bow: "#8ab8d8" }, "snowflake", false),
  costume("starlight", "Starlight", 37, { tutu: "#3d3436", leotard: "#3d3436", bow: "#e6b422" }, "stars", false),
  costume("firebird", "Firebird", 43, { tutu: "#e26d5c", leotard: "#e6b422", bow: "#e26d5c" }, "flames", false),
  costume("rainbow", "Rainbow", 47, { tutu: "#f7c6d9", leotard: "#fff7ef", bow: "#e26d5c" }, "rainbow", false),
  // Season Two colourways: same overlays, new colours
  costume("rose_classic", "Rose Classic", 52, { tutu: "#f4a3b5", leotard: "#e07a93", bow: "#c94f3e" }, null, false),
  costume("midnight_swan", "Midnight Swan", 58, { tutu: "#3d3436", leotard: "#4a4a6a", bow: "#e6b422" }, "feathers", false),
  costume("mint_sugar_plum", "Mint Sugar Plum", 63, { tutu: "#cdebdd", leotard: "#9fd3b8", bow: "#e6b422" }, "tiara", false),
  costume("sunset_rose_garden", "Sunset Rose Garden", 68, { tutu: "#f9c58d", leotard: "#e26d5c", bow: "#7fb069" }, "flower_crown", false),
  costume("ice_snowflake", "Ice Snowflake", 73, { tutu: "#e6f4fb", leotard: "#bfe0f2", bow: "#8ab8d8" }, "snowflake", false),
  costume("silver_starlight", "Silver Starlight", 78, { tutu: "#d9d9df", leotard: "#8a8a99", bow: "#e6b422" }, "stars", false),
  costume("ember_firebird", "Ember Firebird", 83, { tutu: "#c94f3e", leotard: "#8a2e22", bow: "#e6b422" }, "flames", false),
  costume("pastel_rainbow", "Pastel Rainbow", 88, { tutu: "#fbe9e5", leotard: "#fff7ef", bow: "#f2b3a6" }, "rainbow", false),
  costume("crown", "Crown", 97, { tutu: "#e6b422", leotard: "#fff7ef", bow: "#e6b422" }, "crown", false),
];

export type StageDef = CatalogItem & { kind: "stage"; backdrop: string };
const stage = (key: string, name: string, unlockAt: number, backdrop: string, shipped: boolean): StageDef => ({
  key, name, kind: "stage", kindWord: "stage", unlockAt, season: unlockAt > 50 ? 2 : 1, shipped, backdrop,
});
export const STAGES: StageDef[] = [
  stage("practice_room", "Practice Room", 1, "practice_room", true),
  stage("moon_night", "Moon Night", 6, "moon_night", true),
  stage("garden_hills", "Garden Hills", 17, "garden_hills", false),
  stage("snow_field", "Snow Field", 22, "snow_field", false),
  stage("seashore", "Seashore", 32, "seashore", false),
  stage("starry_sky", "Starry Sky", 38, "starry_sky", false),
  stage("grand_theater", "Grand Theater", 44, "grand_theater", false),
  stage("practice_room_night", "Practice Room at night", 54, "practice_room_night", false),
  stage("moon_night_dawn", "Moon Night at dawn", 62, "moon_night_dawn", false),
  stage("garden_hills_evening", "Garden Hills at evening", 67, "garden_hills_evening", false),
  stage("snow_field_night", "Snow Field at night", 72, "snow_field_night", false),
  stage("seashore_sunset", "Seashore at sunset", 77, "seashore_sunset", false),
  stage("starry_sky_aurora", "Starry Sky with aurora", 82, "starry_sky_aurora", false),
  stage("grand_theater_matinee", "Grand Theater matinee", 87, "grand_theater_matinee", false),
];

export type MusicDef = CatalogItem & { kind: "music"; tempoWord: string };
const music = (key: string, name: string, unlockAt: number, tempoWord: string, shipped: boolean): MusicDef => ({
  key, name, kind: "music", kindWord: "music", unlockAt, season: unlockAt > 50 ? 2 : 1, shipped, tempoWord,
});
export const MUSIC: MusicDef[] = [
  music("music_box", "Music Box", 1, "gentle", true),
  music("harp_song", "Harp Song", 2, "slow", true),
  music("candy_waltz", "Candy Waltz", 11, "lively", false),
  music("silver_bells", "Silver Bells", 21, "gentle", false),
  music("rain_piano", "Rain Piano", 26, "slow", false),
  music("puddle_hop", "Puddle Hop", 29, "bouncy", false),
  music("ocean_waves", "Ocean Waves", 31, "slow", false),
  music("ballroom_waltz", "Ballroom Waltz", 39, "lively", false),
  music("carnival_parade", "Carnival Parade", 48, "lively", true), // built in Phase 0
  music("lullaby_waltz", "Lullaby Waltz", 56, "slow", false),
  music("skipping_song", "Skipping Song", 76, "bouncy", false),
];
/** Permanent tiles that are not catalog items. */
export const QUIET_KEY = "quiet";
export const NONE_KEY = "none";

export type SparkleDef = CatalogItem & { kind: "sparkle"; color: string; shape: "star4" | "heart" | "flake" | "star5" | "drop" | "blossom" | "firefly" };
const sparkle = (key: string, name: string, unlockAt: number, color: string, shape: SparkleDef["shape"], shipped: boolean): SparkleDef => ({
  key, name, kind: "sparkle", kindWord: "sparkle style", unlockAt, season: unlockAt > 50 ? 2 : 1, shipped, color, shape,
});
export const SPARKLES: SparkleDef[] = [
  sparkle("gold", "Gold", 1, "#e6b422", "star4", true),
  sparkle("pink_hearts", "Pink Hearts", 19, "#ec9fbd", "heart", false),
  sparkle("snowfall", "Snowfall", 24, "#ffffff", "flake", false),
  sparkle("twinkles", "Twinkles", 36, "#e6b422", "star5", false),
  sparkle("colour_drops", "Colour Drops", 46, "#7fb069", "drop", false),
  sparkle("blossoms", "Blossoms", 59, "#e26d5c", "blossom", false),
  sparkle("fireflies", "Fireflies", 79, "#e6b422", "firefly", false),
];

// ── Length and features ──────────────────────────────────────────────────────
export type LengthDef = CatalogItem & { kind: "length"; slots: number };
export const LENGTHS: LengthDef[] = [
  { key: "slots_8", name: "Longer dances: 8 moves", kind: "length", kindWord: "", unlockAt: 14, season: 1, shipped: false, slots: 8 },
  { key: "slots_10", name: "Longer dances: 10 moves", kind: "length", kindWord: "", unlockAt: 28, season: 1, shipped: false, slots: 10 },
  { key: "slots_12", name: "Longer dances: 12 moves", kind: "length", kindWord: "", unlockAt: 42, season: 1, shipped: false, slots: 12 },
];
export const BASE_SLOTS = 6;

export const FEATURES: CatalogItem[] = [
  { key: "new_dance", name: "New dance", kind: "feature", kindWord: "", unlockAt: 7, season: 1, shipped: false },
  { key: "second_lane", name: "Sparkles from both sides", kind: "feature", kindWord: "", unlockAt: 34, season: 1, shipped: false },
];

/** Every announceable item, in one list. Decorations are not here: they arrive at the Bow. */
export const CATALOG: CatalogItem[] = [...COSTUMES, ...STAGES, ...MUSIC, ...SPARKLES, ...MOVES, ...LENGTHS, ...FEATURES];
export const ITEM_BY_KEY = new Map(CATALOG.map((i) => [i.key, i]));

/** "Swan costume", "Sauté, a new move", "Longer dances: 8 moves". */
export function announce(item: CatalogItem): string {
  if (item.kind === "move") return `${item.name}, a new move`;
  if (!item.kindWord) return item.name;
  return `${item.name} ${item.kindWord}`;
}

// ── Programs, themes, decorations ───────────────────────────────────────────
export type ProgramDef = { program: number; theme: string; color: string; decoration: { key: string; name: string } };

export const PROGRAMS: ProgramDef[] = [
  { program: 1, theme: "First Steps", color: "#f7c6d9", decoration: { key: "footlights", name: "footlights" } },
  { program: 2, theme: "Moonlight", color: "#4a6fa5", decoration: { key: "string_lights", name: "string lights" } },
  { program: 3, theme: "Sugar Plum", color: "#d8c3f0", decoration: { key: "garlands", name: "flower garlands on the curtains" } },
  { program: 4, theme: "Garden", color: "#7fb069", decoration: { key: "second_spotlight", name: "a second spotlight" } },
  { program: 5, theme: "Snow", color: "#dbeefb", decoration: { key: "rose_petals", name: "rose petals at the bow" } },
  { program: 6, theme: "Rain", color: "#8ab8d8", decoration: { key: "chandelier", name: "a chandelier" } },
  { program: 7, theme: "Ocean", color: "#5aa9a3", decoration: { key: "orchestra_pit", name: "an orchestra pit" } },
  { program: 8, theme: "Starlight", color: "#3d3436", decoration: { key: "gold_proscenium", name: "a gold proscenium" } },
  { program: 9, theme: "Grand Theater", color: "#c94f3e", decoration: { key: "confetti", name: "confetti at the bow" } },
  { program: 10, theme: "Rainbow", color: "#e6b422", decoration: { key: "fireworks", name: "a fireworks finale" } },
  { program: 11, theme: "Dawn", color: "#f9c58d", decoration: { key: "gold_footlights", name: "gold footlights" } },
  { program: 12, theme: "Lantern", color: "#e6b422", decoration: { key: "gold_string_lights", name: "gold string lights" } },
  { program: 13, theme: "Meadow", color: "#9fd3b8", decoration: { key: "gold_garlands", name: "gold garlands" } },
  { program: 14, theme: "Harvest", color: "#d9a066", decoration: { key: "third_spotlight", name: "a third spotlight" } },
  { program: 15, theme: "Frost", color: "#e6f4fb", decoration: { key: "gold_petals", name: "gold petals at the bow" } },
  { program: 16, theme: "Comet", color: "#8a8a99", decoration: { key: "crystal_chandelier", name: "a crystal chandelier" } },
  { program: 17, theme: "Ember", color: "#c94f3e", decoration: { key: "pit_strings", name: "strings in the orchestra pit" } },
  { program: 18, theme: "Blossom", color: "#f2b3a6", decoration: { key: "velvet_proscenium", name: "a velvet proscenium" } },
  { program: 19, theme: "Velvet", color: "#8a2e22", decoration: { key: "gold_confetti", name: "gold confetti at the bow" } },
  { program: 20, theme: "Encore", color: "#e6b422", decoration: { key: "grand_fireworks", name: "a grand fireworks finale" } },
];
export const PROGRAM_BY_NUMBER = new Map(PROGRAMS.map((p) => [p.program, p]));
export const WORKOUTS_PER_PROGRAM = 5;
export const PROGRAMS_PER_SEASON = 10;

// ── Presets and naming words ─────────────────────────────────────────────────
export const PRESET_DANCES: Record<string, { name: string; moves: MoveKey[] }> = {
  little_waltz: { name: "Little Waltz", moves: ["plie", "reach", "twirl", "plie", "reach", "arabesque"] },
  twirl_song: { name: "Twirl Song", moves: ["reach", "twirl", "arabesque", "twirl"] },
};

/** Two rows of word tiles for naming a dance (confirmed by Jose). None is a move, preset, loop or item name. */
export const NAME_WORDS: [string[], string[]] = [
  ["Moon", "Star", "Garden", "Snow", "Rose", "Sunny"],
  ["Waltz", "Ballet", "Ribbon", "Dream", "Song", "Steps"],
];
