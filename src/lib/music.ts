/**
 * The beat clock and the music loops. One lookahead sequencer (25 ms
 * interval, schedules 100 ms ahead against AudioContext.currentTime) drives
 * both the notes and the visual beat callbacks, so moves and music never
 * drift apart. With music off (or the Quiet tile) the same clock runs
 * silently. Everything plays through the master in sound.ts.
 */
import { getAudioContext, masterOut, midiToHz } from "@/lib/sound";

export type Voice = "box" | "square" | "harp";
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

export const SONGS: Record<string, Song> = { music_box: MUSIC_BOX, harp_song: HARP_SONG, carnival_parade: CARNIVAL_PARADE, quiet: QUIET };

const LOOKAHEAD_SEC = 0.1;
const TICK_MS = 25;

class Sequencer {
  private song: Song | null = null;
  private timer: number | null = null;
  private nextBeatTime = 0;
  private beatIndex = 0;
  private bpm = 66;
  private music = true;
  private gain: GainNode | null = null;
  private listeners = new Set<(beat: number) => void>();
  private pending = new Set<number>();

  get isPlaying() {
    return this.timer !== null;
  }

  get secondsPerBeat() {
    return 60 / this.bpm;
  }

  /** Start a song (or just its clock with `music: false`). Returns false if audio is unavailable. */
  start(song: Song, opts: { music?: boolean; bpm?: number } = {}): boolean {
    const ac = getAudioContext();
    const out = masterOut();
    if (!ac || !out) return false;
    this.stop(0);
    this.song = song;
    this.bpm = opts.bpm ?? song.bpm;
    this.music = opts.music ?? true;
    this.beatIndex = 0;
    this.nextBeatTime = ac.currentTime + 0.12;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(1, ac.currentTime + 1.5); // music fades in over 1.5 s
    gain.connect(out);
    this.gain = gain;
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
    this.tick();
    return true;
  }

  /** Fade the music out (default 1 s) and stop the clock. Safe to call twice. */
  stop(fadeSec = 1) {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const id of this.pending) clearTimeout(id);
    this.pending.clear();
    const ac = getAudioContext();
    const gain = this.gain;
    if (gain && ac) {
      const fade = Math.max(fadeSec, 0.02);
      gain.gain.cancelScheduledValues(ac.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + fade);
      window.setTimeout(() => gain.disconnect(), fade * 1000 + 60);
    }
    this.gain = null;
    this.song = null;
  }

  /** Called once per beat, on the beat (visuals subscribe here). */
  onBeat(cb: (beat: number) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /** Two seconds of a song, for a music tile tap. */
  preview(song: Song, ms = 2000) {
    if (!this.start(song)) return;
    window.setTimeout(() => this.stop(0.3), ms);
  }

  private tick() {
    const ac = getAudioContext();
    if (!ac || !this.song) return;
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
      const delay = Math.max(0, (time - ac.currentTime) * 1000);
      const id = window.setTimeout(() => {
        this.pending.delete(id);
        for (const l of this.listeners) l(beat);
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
   */
  private voice(ac: AudioContext, out: AudioNode, n: SongNote, start: number) {
    const f = midiToHz(n.midi);
    const g = n.gain ?? 0.3;
    const voice = this.song?.voice ?? "box";
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
