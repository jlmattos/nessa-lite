/**
 * The beat clock and the music loops. One lookahead sequencer (25 ms
 * interval, schedules 100 ms ahead against AudioContext.currentTime) drives
 * both the notes and the visual beat callbacks, so moves and music never
 * drift apart. With music off (or the Quiet tile) the same clock runs
 * silently. Everything plays through the master in sound.ts.
 */
import { getAudioContext, masterOut, midiToHz, peekAudioContext } from "@/lib/sound";

export type Voice = "box" | "square" | "harp" | "waltz";
export type SongNote = { beat: number; midi: number; gain?: number };
export type Song = {
  key: string;
  name: string;
  bpm: number;
  beatsPerBar: number;
  bars: number;
  voice: Voice;
  notes: SongNote[];
};

/** Music Box: 66 bpm, 3/4, eight bars. Bass on one, a pentatonic melody above. */
export const MUSIC_BOX: Song = {
  key: "music_box",
  name: "Music Box",
  bpm: 66,
  beatsPerBar: 3,
  bars: 8,
  voice: "box",
  notes: [
    // bar 1
    { beat: 0, midi: 48, gain: 0.22 }, { beat: 0, midi: 72 }, { beat: 1, midi: 76 }, { beat: 2, midi: 79 },
    // bar 2
    { beat: 3, midi: 55, gain: 0.22 }, { beat: 3, midi: 81 }, { beat: 4, midi: 79 }, { beat: 5, midi: 76 },
    // bar 3
    { beat: 6, midi: 57, gain: 0.22 }, { beat: 6, midi: 74 }, { beat: 7, midi: 76 }, { beat: 8, midi: 79 },
    // bar 4
    { beat: 9, midi: 55, gain: 0.22 }, { beat: 9, midi: 72 }, { beat: 11, midi: 79 },
    // bar 5
    { beat: 12, midi: 48, gain: 0.22 }, { beat: 12, midi: 84 }, { beat: 13, midi: 81 }, { beat: 14, midi: 79 },
    // bar 6
    { beat: 15, midi: 57, gain: 0.22 }, { beat: 15, midi: 76 }, { beat: 16, midi: 79 }, { beat: 17, midi: 81 },
    // bar 7
    { beat: 18, midi: 55, gain: 0.22 }, { beat: 18, midi: 79 }, { beat: 19, midi: 76 }, { beat: 20, midi: 74 },
    // bar 8
    { beat: 21, midi: 48, gain: 0.22 }, { beat: 21, midi: 72 },
  ],
};

/** Harp Song: 60 bpm, 4/4, eight bars. Slow arpeggios, sine through a 2 kHz low-pass, long decay. */
export const HARP_SONG: Song = {
  key: "harp_song",
  name: "Harp Song",
  bpm: 60,
  beatsPerBar: 4,
  bars: 8,
  voice: "harp",
  notes: [
    // C major arpeggio bars, one note per half beat, pentatonic over C–A–G–C
    { beat: 0, midi: 48, gain: 0.26 }, { beat: 0.5, midi: 55 }, { beat: 1, midi: 60 }, { beat: 1.5, midi: 64 }, { beat: 2, midi: 67 }, { beat: 2.5, midi: 72 }, { beat: 3, midi: 76 }, { beat: 3.5, midi: 72 },
    { beat: 4, midi: 57, gain: 0.26 }, { beat: 4.5, midi: 64 }, { beat: 5, midi: 69 }, { beat: 5.5, midi: 72 }, { beat: 6, midi: 76 }, { beat: 6.5, midi: 81 }, { beat: 7, midi: 76 }, { beat: 7.5, midi: 72 },
    { beat: 8, midi: 55, gain: 0.26 }, { beat: 8.5, midi: 62 }, { beat: 9, midi: 67 }, { beat: 9.5, midi: 71 }, { beat: 10, midi: 74 }, { beat: 10.5, midi: 79 }, { beat: 11, midi: 74 }, { beat: 11.5, midi: 71 },
    { beat: 12, midi: 48, gain: 0.26 }, { beat: 12.5, midi: 55 }, { beat: 13, midi: 60 }, { beat: 13.5, midi: 64 }, { beat: 14, midi: 67 }, { beat: 15, midi: 72 },
    { beat: 16, midi: 53, gain: 0.26 }, { beat: 16.5, midi: 60 }, { beat: 17, midi: 65 }, { beat: 17.5, midi: 69 }, { beat: 18, midi: 72 }, { beat: 18.5, midi: 77 }, { beat: 19, midi: 72 }, { beat: 19.5, midi: 69 },
    { beat: 20, midi: 55, gain: 0.26 }, { beat: 20.5, midi: 62 }, { beat: 21, midi: 67 }, { beat: 21.5, midi: 71 }, { beat: 22, midi: 74 }, { beat: 22.5, midi: 79 }, { beat: 23, midi: 74 }, { beat: 23.5, midi: 71 },
    { beat: 24, midi: 57, gain: 0.26 }, { beat: 24.5, midi: 64 }, { beat: 25, midi: 69 }, { beat: 25.5, midi: 72 }, { beat: 26, midi: 76 }, { beat: 26.5, midi: 81 }, { beat: 27, midi: 76 }, { beat: 27.5, midi: 72 },
    { beat: 28, midi: 48, gain: 0.26 }, { beat: 28.5, midi: 55 }, { beat: 29, midi: 60 }, { beat: 29.5, midi: 64 }, { beat: 30, midi: 67 }, { beat: 31, midi: 72 },
  ],
};

/**
 * Candy Waltz: 72 bpm, 3/4, eight bars (GAME-DESIGN.md §7). Oom-pah-pah: a soft
 * sine bass on one, a light two-note chord on two and three, and a bright,
 * short triangle melody above with little skips. Every note is in C major
 * pentatonic (the chords too), so the move notes always fit. Bars: C · Am · D · G
 * twice, and bar 8 steps down D6 C6 A5 into bar 1's G5, so the loop closes.
 */
export const CANDY_WALTZ: Song = {
  key: "candy_waltz",
  name: "Candy Waltz",
  bpm: 72,
  beatsPerBar: 3,
  bars: 8,
  voice: "waltz",
  notes: [
    // bar 1 · C
    { beat: 0, midi: 48, gain: 0.2 }, { beat: 1, midi: 64, gain: 0.11 }, { beat: 1, midi: 67, gain: 0.11 }, { beat: 2, midi: 64, gain: 0.11 }, { beat: 2, midi: 67, gain: 0.11 },
    { beat: 0, midi: 79, gain: 0.28 }, { beat: 1, midi: 84, gain: 0.28 }, { beat: 1.5, midi: 86, gain: 0.24 }, { beat: 2, midi: 88, gain: 0.26 },
    // bar 2 · Am
    { beat: 3, midi: 57, gain: 0.2 }, { beat: 4, midi: 60, gain: 0.11 }, { beat: 4, midi: 64, gain: 0.11 }, { beat: 5, midi: 60, gain: 0.11 }, { beat: 5, midi: 64, gain: 0.11 },
    { beat: 3, midi: 84, gain: 0.28 }, { beat: 4, midi: 81, gain: 0.28 },
    // bar 3 · D (D A C)
    { beat: 6, midi: 50, gain: 0.2 }, { beat: 7, midi: 60, gain: 0.11 }, { beat: 7, midi: 69, gain: 0.11 }, { beat: 8, midi: 60, gain: 0.11 }, { beat: 8, midi: 69, gain: 0.11 },
    { beat: 6, midi: 81, gain: 0.28 }, { beat: 7, midi: 84, gain: 0.28 }, { beat: 7.5, midi: 86, gain: 0.24 }, { beat: 8, midi: 84, gain: 0.26 },
    // bar 4 · G (G D A)
    { beat: 9, midi: 55, gain: 0.2 }, { beat: 10, midi: 62, gain: 0.11 }, { beat: 10, midi: 69, gain: 0.11 }, { beat: 11, midi: 62, gain: 0.11 }, { beat: 11, midi: 69, gain: 0.11 },
    { beat: 9, midi: 79, gain: 0.28 }, { beat: 11, midi: 74, gain: 0.26 },
    // bar 5 · C
    { beat: 12, midi: 48, gain: 0.2 }, { beat: 13, midi: 64, gain: 0.11 }, { beat: 13, midi: 67, gain: 0.11 }, { beat: 14, midi: 64, gain: 0.11 }, { beat: 14, midi: 67, gain: 0.11 },
    { beat: 12, midi: 79, gain: 0.28 }, { beat: 13, midi: 88, gain: 0.26 }, { beat: 14, midi: 86, gain: 0.26 },
    // bar 6 · Am
    { beat: 15, midi: 57, gain: 0.2 }, { beat: 16, midi: 60, gain: 0.11 }, { beat: 16, midi: 64, gain: 0.11 }, { beat: 17, midi: 60, gain: 0.11 }, { beat: 17, midi: 64, gain: 0.11 },
    { beat: 15, midi: 84, gain: 0.28 }, { beat: 16, midi: 81, gain: 0.28 }, { beat: 16.5, midi: 79, gain: 0.24 }, { beat: 17, midi: 76, gain: 0.26 },
    // bar 7 · D
    { beat: 18, midi: 50, gain: 0.2 }, { beat: 19, midi: 60, gain: 0.11 }, { beat: 19, midi: 69, gain: 0.11 }, { beat: 20, midi: 60, gain: 0.11 }, { beat: 20, midi: 69, gain: 0.11 },
    { beat: 18, midi: 74, gain: 0.28 }, { beat: 19, midi: 81, gain: 0.28 }, { beat: 20, midi: 79, gain: 0.26 },
    // bar 8 · G, stepping down into bar 1
    { beat: 21, midi: 55, gain: 0.2 }, { beat: 22, midi: 62, gain: 0.11 }, { beat: 22, midi: 69, gain: 0.11 }, { beat: 23, midi: 62, gain: 0.11 }, { beat: 23, midi: 69, gain: 0.11 },
    { beat: 21, midi: 86, gain: 0.26 }, { beat: 22, midi: 84, gain: 0.26 }, { beat: 23, midi: 81, gain: 0.26 },
  ],
};

/** Carnival Parade: 84 bpm, 4/4, eight bars. A bright little march; the loudest, brightest loop in the set. */
export const CARNIVAL_PARADE: Song = {
  key: "carnival_parade",
  name: "Carnival Parade",
  bpm: 84,
  beatsPerBar: 4,
  bars: 8,
  voice: "square",
  notes: [
    // bars 1–2: bass on 1 and 3, melody steps up
    { beat: 0, midi: 48, gain: 0.2 }, { beat: 2, midi: 55, gain: 0.2 }, { beat: 0, midi: 72 }, { beat: 1, midi: 74 }, { beat: 2, midi: 76 }, { beat: 3, midi: 79 },
    { beat: 4, midi: 48, gain: 0.2 }, { beat: 6, midi: 55, gain: 0.2 }, { beat: 4, midi: 81 }, { beat: 5, midi: 79 }, { beat: 6, midi: 76 }, { beat: 7, midi: 74 },
    // bars 3–4
    { beat: 8, midi: 53, gain: 0.2 }, { beat: 10, midi: 55, gain: 0.2 }, { beat: 8, midi: 76 }, { beat: 9, midi: 79 }, { beat: 10, midi: 81 }, { beat: 11, midi: 84 },
    { beat: 12, midi: 55, gain: 0.2 }, { beat: 14, midi: 55, gain: 0.2 }, { beat: 12, midi: 79 }, { beat: 13.5, midi: 76 }, { beat: 14, midi: 74 },
    // bars 5–6
    { beat: 16, midi: 48, gain: 0.2 }, { beat: 18, midi: 55, gain: 0.2 }, { beat: 16, midi: 72 }, { beat: 17, midi: 76 }, { beat: 18, midi: 79 }, { beat: 19, midi: 76 },
    { beat: 20, midi: 48, gain: 0.2 }, { beat: 22, midi: 55, gain: 0.2 }, { beat: 20, midi: 81 }, { beat: 21, midi: 84 }, { beat: 22, midi: 81 }, { beat: 23, midi: 79 },
    // bars 7–8: home
    { beat: 24, midi: 53, gain: 0.2 }, { beat: 26, midi: 55, gain: 0.2 }, { beat: 24, midi: 76 }, { beat: 25, midi: 74 }, { beat: 26, midi: 76 }, { beat: 27, midi: 79 },
    { beat: 28, midi: 48, gain: 0.2 }, { beat: 30, midi: 48, gain: 0.2 }, { beat: 28, midi: 72 }, { beat: 30, midi: 72 },
  ],
};

/** No song: the clock runs at 66 bpm in 3/4 and nothing plays. */
export const QUIET: Song = { key: "quiet", name: "Quiet", bpm: 66, beatsPerBar: 3, bars: 1, voice: "box", notes: [] };

export const SONGS: Record<string, Song> = {
  music_box: MUSIC_BOX,
  harp_song: HARP_SONG,
  candy_waltz: CANDY_WALTZ,
  carnival_parade: CARNIVAL_PARADE,
  quiet: QUIET,
};

const LOOKAHEAD_SEC = 0.2; // generous: each beat also forces a reflow and a React render
const TICK_MS = 25;
const FADE_IN_SEC = 1.5;      // a dance: the music eases in (§3.8)
const PREVIEW_FADE_SEC = 0.3; // a tile preview: every start is a ramp of at least 300 ms
const STALL_MS = 1200; // a context that never reaches "running" after a gesture, or stops running for this long

class Sequencer {
  private song: Song | null = null;
  private timer: number | null = null;
  private nextBeatTime = 0;
  private beatIndex = 0;
  private bpm = 66;
  private music = true;
  private gain: GainNode | null = null;
  private listeners = new Set<(beat: number, time: number) => void>();
  private stallListeners = new Set<() => void>();
  private interruptListeners = new Set<() => void>();
  private pending = new Set<number>();
  private previewTimer: number | null = null;
  private startedAt = 0;      // audio-clock time of start()
  private startedWall = 0;    // performance.now() at start(), for the stall guard
  private fadeIn = FADE_IN_SEC;
  private ran = false;         // the context has run since start(): a later pause is an interruption, not a failed start
  private pausedWall: number | null = null; // performance.now() when a running clock stopped running

  get isPlaying() {
    return this.timer !== null;
  }

  get secondsPerBeat() {
    return 60 / this.bpm;
  }

  /** Start a song (or just its clock with `music: false`). Returns false if audio is unavailable. */
  start(song: Song, opts: { music?: boolean; bpm?: number; fadeIn?: number } = {}): boolean {
    const ac = getAudioContext();
    const out = masterOut();
    if (!ac || !out) return false;
    // A loop still playing (a tile preview) fades out on its own node while the new one fades in.
    this.stop(this.gain ? PREVIEW_FADE_SEC : 0);
    this.song = song;
    this.bpm = opts.bpm ?? song.bpm;
    this.music = opts.music ?? true;
    this.beatIndex = 0;
    this.startedAt = ac.currentTime;
    this.startedWall = performance.now();
    this.fadeIn = opts.fadeIn ?? FADE_IN_SEC;
    this.ran = false;
    this.pausedWall = null;
    this.nextBeatTime = ac.currentTime + 0.12;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(1, ac.currentTime + this.fadeIn);
    gain.connect(out);
    this.gain = gain;
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
    this.tick();
    return true;
  }

  /** Fade the music out (default 1 s) and stop the clock. Safe to call twice, and outside a gesture. */
  stop(fadeSec = 1) {
    if (this.previewTimer !== null) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const id of this.pending) clearTimeout(id);
    this.pending.clear();
    const ac = peekAudioContext();
    const gain = this.gain;
    if (gain && ac) {
      const fade = Math.max(fadeSec, 0.02);
      const now = ac.currentTime;
      const p = gain.gain;
      // Hold the current value, then ramp — never cancel into a snap-to-zero mid fade-in.
      if (typeof p.cancelAndHoldAtTime === "function") {
        p.cancelAndHoldAtTime(now);
      } else {
        const v = Math.min(1, Math.max(0, (now - this.startedAt) / this.fadeIn));
        p.cancelScheduledValues(now);
        p.setValueAtTime(v, now);
      }
      p.linearRampToValueAtTime(0, now + fade);
      window.setTimeout(() => gain.disconnect(), fade * 1000 + 60);
    }
    this.gain = null;
    this.song = null;
  }

  /** Called when the clock had to stop itself (the context never started running). */
  onStall(cb: () => void): () => void {
    this.stallListeners.add(cb);
    return () => {
      this.stallListeners.delete(cb);
    };
  }

  /**
   * Called when a clock that was running stopped running for good (iPadOS
   * "interrupted": Siri, an alarm, a call) while the page stayed visible.
   */
  onInterrupt(cb: () => void): () => void {
    this.interruptListeners.add(cb);
    return () => {
      this.interruptListeners.delete(cb);
    };
  }

  /** Called once per beat, on the beat, with the beat's audio-clock time so notes can be scheduled exactly. */
  onBeat(cb: (beat: number, time: number) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /** Two seconds of a song, for a music tile tap. One preview at a time; a new start cancels it. */
  preview(song: Song, ms = 2000) {
    if (!this.start(song, { fadeIn: PREVIEW_FADE_SEC })) return;
    this.previewTimer = window.setTimeout(() => {
      this.previewTimer = null;
      this.stop(0.3);
    }, ms);
  }

  private tick() {
    const ac = peekAudioContext();
    if (!ac || !this.song) return;
    if (ac.state !== "running") {
      const now = performance.now();
      if (!this.ran) {
        // The gesture should have started the clock; if it never does, give up cleanly.
        if (now - this.startedWall > STALL_MS) {
          this.stop(0);
          for (const l of this.stallListeners) l();
        }
        return;
      }
      // It was running and paused: a short blip resumes on its own; a long one ends the dance.
      this.pausedWall ??= now;
      if (now - this.pausedWall > STALL_MS) {
        this.stop(0.3);
        for (const l of this.interruptListeners) l();
      }
      return;
    }
    this.ran = true;
    this.pausedWall = null;
    // Visuals should land when the sound reaches the ear, not when it is rendered.
    const latency = (ac.baseLatency ?? 0) + (ac.outputLatency ?? 0);
    const spb = this.secondsPerBeat;
    const total = this.song.beatsPerBar * this.song.bars;
    while (this.nextBeatTime < ac.currentTime + LOOKAHEAD_SEC) {
      const beat = this.beatIndex;
      const time = this.nextBeatTime;
      const pos = beat % total;
      if (this.music && this.gain) {
        for (const n of this.song.notes) {
          if (n.beat >= pos && n.beat < pos + 1) this.voice(ac, this.gain, n, time + (n.beat - pos) * spb);
        }
      }
      const delay = Math.max(0, (time + latency - ac.currentTime) * 1000);
      const id = window.setTimeout(() => {
        this.pending.delete(id);
        for (const l of this.listeners) l(beat, time);
      }, delay);
      this.pending.add(id);
      this.beatIndex += 1;
      this.nextBeatTime += spb;
    }
  }

  /**
   * Timbres. "box": triangle at pitch plus a quiet sine an octave up, 5 ms
   * attack, 0.8 s decay. "square": a low-gain square wave, staccato (0.35 s),
   * the brightest sound in the set — the master low-pass keeps it soft.
   * "harp": sine through a 2 kHz low-pass with a 1.2 s decay.
   * "waltz" splits by register: below C4 a soft sine bass (0.9 s), C4–B4 a
   * light sine chord note (0.35 s), C5 and up a bright triangle melody (0.5 s).
   */
  private voice(ac: AudioContext, out: AudioNode, n: SongNote, scheduled: number) {
    const f = midiToHz(n.midi);
    const g = n.gain ?? 0.3;
    const voice = this.song?.voice ?? "box";
    const start = Math.max(scheduled, ac.currentTime + 0.002); // a late tick still gets its attack
    const env = (osc: OscillatorNode, peak: number, decay: number) => {
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
      osc.connect(gain).connect(out);
      osc.start(start);
      osc.stop(start + decay + 0.05);
    };
    if (voice === "harp") {
      const a = ac.createOscillator();
      a.type = "sine";
      a.frequency.value = f;
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2000;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(g, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
      a.connect(lp).connect(gain).connect(out);
      a.start(start);
      a.stop(start + 1.25);
      return;
    }
    if (voice === "waltz") {
      const a = ac.createOscillator();
      a.type = n.midi >= 72 ? "triangle" : "sine";
      a.frequency.value = f;
      env(a, g, n.midi >= 72 ? 0.5 : n.midi >= 60 ? 0.35 : 0.9);
      return;
    }
    if (voice === "square") {
      const a = ac.createOscillator();
      a.type = "square";
      a.frequency.value = f;
      env(a, g * 0.45, 0.35);
      return;
    }
    const a = ac.createOscillator();
    a.type = "triangle";
    a.frequency.value = f;
    env(a, g, 0.8);
    const b = ac.createOscillator();
    b.type = "sine";
    b.frequency.value = f * 2;
    env(b, g * 0.3, 0.8);
  }
}

export const sequencer = new Sequencer();
