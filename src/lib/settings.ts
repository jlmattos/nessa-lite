/** How the app should feel. Stored in the single-row `settings` table (GAME-DESIGN.md §7 Controls). */
export type Volume = "soft" | "medium";
export type SparkleAmount = "some" | "lots";

export type Settings = {
  /** Chimes and move notes. On by default — she likes calming sounds. */
  sound: boolean;
  /** The music loops (Quiet is also a tile in the flow). */
  music: boolean;
  /** Master level: 0.25 soft, 0.5 medium, never higher. */
  volume: Volume;
  /** Ambient sparkles during the dance: "lots" grows with Programs, "some" is a fixed 3. */
  sparkleAmount: SparkleAmount;
  /** The Sparkle catch lane. Jose: on from the first evening. */
  sparkleTaps: boolean;
  /** "You caught 12 sparkles." on the Bow card (Phase 3). */
  sparkleCount: boolean;
  /** Petals, confetti and fireworks at the Bow. */
  bowShowers: boolean;
  /** "Calm mode": every animation off (also honoured via prefers-reduced-motion). */
  reducedMotion: boolean;
  /** Highest completed-workout count ever reached; bumped at Finish, never lowered. */
  highWaterN: number;
};

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  music: true,
  volume: "soft",
  sparkleAmount: "lots",
  sparkleTaps: true,
  sparkleCount: false,
  bowShowers: true,
  reducedMotion: false,
  highWaterN: 0,
};
