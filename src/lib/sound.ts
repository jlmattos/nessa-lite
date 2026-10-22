/**
 * Tiny synthesized sounds — no files, no network, a few hundred bytes.
 * iPad Safari only lets audio start inside a user gesture, and every call
 * here happens in a tap handler, so the context resumes on first use.
 * Callers check the `sound` setting; this module just plays.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One soft sine note with a quick swell and a long, gentle tail. */
function tone(ac: AudioContext, freq: number, start: number, dur: number, peak = 0.11) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Two-note chime for a finished movement (C5 → G5). */
export function playDone() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 523.25, t, 0.55);
  tone(ac, 783.99, t + 0.13, 0.7);
}

/** Slow rising chord for finishing the whole workout (C major, one note at a time). */
export function playFinish() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + i * 0.16, 1.2, 0.09));
}
