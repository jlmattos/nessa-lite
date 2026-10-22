/** How the app should feel. Stored in the single-row `settings` table. */
export type Settings = {
  /** Soft chimes on Done and Finish. On by default — she likes calming sounds. */
  sound: boolean;
  /** "Calm mode": every animation off (also honoured via prefers-reduced-motion). */
  reducedMotion: boolean;
};

export const DEFAULT_SETTINGS: Settings = { sound: true, reducedMotion: false };
