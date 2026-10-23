/**
 * All sound in the app goes through one shared AudioContext, one master
 * gain (soft by default) and a 6 kHz low-pass, so nothing can ever be shrill
 * or loud. iPad Safari only lets audio start inside a user gesture, so every
 * entry point here is called from a tap handler and resumes the context.
 * Callers check the `sound` setting; this module just plays.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

const VOLUME = { soft: 0.25, medium: 0.5 } as const;
export type Volume = keyof typeof VOLUME;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx || ctx.state === "closed") {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = VOLUME.soft;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 6000;
      master.connect(lowpass).connect(ctx.destination);
    }
    // iPadOS reports "interrupted" (not "suspended") after an app switch, Siri or
    // a call, and does not reliably auto-resume: resume on anything but running.
    if (ctx.state !== "running") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** The existing context without creating or resuming one (for stop paths outside a gesture). */
export function peekAudioContext(): AudioContext | null {
  return ctx;
}

/** The node every voice connects to. Null when audio is unavailable. */
export function masterOut(): GainNode | null {
  return getAudioContext() ? master : null;
}

export function setVolume(v: Volume) {
  const ac = getAudioContext();
  if (ac && master) master.gain.setTargetAtTime(VOLUME[v], ac.currentTime, 0.05);
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * One note: quick swell, long gentle tail. `peak` is pre-master; chimes use
 * ~0.45 and music notes ~0.3 so chimes always sit above the music.
 */
export function tone(
  ac: AudioContext,
  out: AudioNode,
  freq: number,
  start: number,
  dur: number,
  peak = 0.45,
  type: OscillatorType = "sine",
  attack = 0.025
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** One soft note when she taps Start (C5 sine, 0.6 s decay, §3.1). */
export function playStart() {
  const ac = getAudioContext();
  const out = masterOut();
  if (!ac || !out) return;
  tone(ac, out, 523.25, ac.currentTime, 0.6, 0.4);
}

/** Two-note chime for a finished movement (C5 → G5). */
export function playDone() {
  const ac = getAudioContext();
  const out = masterOut();
  if (!ac || !out) return;
  const t = ac.currentTime;
  tone(ac, out, 523.25, t, 0.55);
  tone(ac, out, 783.99, t + 0.13, 0.7);
}

/** Slow rising chord for finishing the whole workout (C major, one note at a time). */
export function playFinish() {
  const ac = getAudioContext();
  const out = masterOut();
  if (!ac || !out) return;
  const t = ac.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, out, f, t + i * 0.16, 1.2, 0.36));
}

export type NoteOpts = {
  dur?: number;
  peak?: number;
  /** Audio-clock time to start at (schedule on the beat); defaults to now. */
  at?: number;
  /** Where to connect (a player's own gain); defaults to the master. */
  out?: AudioNode;
};

/** A single move note (pentatonic, 0.5 s decay) — editor taps and each move start. Sits above the music. */
export function playNote(midi: number, opts: NoteOpts = {}) {
  const ac = getAudioContext();
  const out = opts.out ?? masterOut();
  if (!ac || !out) return;
  const at = Math.max(opts.at ?? ac.currentTime, ac.currentTime);
  tone(ac, out, midiToHz(midi), at, opts.dur ?? 0.5, opts.peak ?? 0.4);
}

/** The final chord at the Bow: every note together, 1.8 s decay. */
export function playChord(midis: number[], opts: NoteOpts = {}) {
  const ac = getAudioContext();
  const out = opts.out ?? masterOut();
  if (!ac || !out) return;
  const at = Math.max(opts.at ?? ac.currentTime, ac.currentTime);
  for (const m of midis) tone(ac, out, midiToHz(m), at, opts.dur ?? 1.8, opts.peak ?? 0.22, "sine", 0.04);
}
