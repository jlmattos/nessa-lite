"use client";

/**
 * useDancePlayer — drives the Pirouette rig from the beat clock.
 *
 * It sets `data-move` on the rig's <svg class="pir"> (with the reflow trick
 * so the same move can repeat back to back), sets `--beat` from the tempo,
 * plays each move's note as it starts, adds the Bow after the last move, and
 * stops cleanly on unmount or when the tab is hidden.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { BOW_BEATS, BOW_CHORD, MOVE_BY_KEY, type MoveKey } from "@/lib/dance-content";
import { QUIET, sequencer, type Song } from "@/lib/music";
import { getAudioContext, masterOut, playChord, playNote } from "@/lib/sound";

export type PlayerState = "idle" | "playing" | "bowing" | "done";

function noteFor(key: MoveKey, at?: number, out?: AudioNode) {
  const m = MOVE_BY_KEY[key];
  playNote(m.midi, { at, out });
  if (m.midi2 != null) playNote(m.midi2, { at, out, peak: 0.28 });
}

export function useDancePlayer(rigRef: RefObject<HTMLDivElement | null>, opts: { sound: boolean }) {
  const [state, setState] = useState<PlayerState>("idle");
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const stallRef = useRef<(() => void) | null>(null);
  /** The dance's own output, so Stop can fade move notes and the chord too. */
  const outRef = useRef<GainNode | null>(null);
  const soundRef = useRef(opts.sound);
  soundRef.current = opts.sound;

  const svg = useCallback(() => rigRef.current?.querySelector<SVGSVGElement>("svg.pir") ?? null, [rigRef]);

  /** Set (or clear) the current move. Clearing first and forcing a reflow restarts the keyframes. */
  const setMove = useCallback(
    (key: MoveKey | "bow" | null) => {
      const wrap = rigRef.current;
      const el = svg();
      if (!wrap || !el) return;
      el.removeAttribute("data-move");
      void wrap.offsetWidth; // reflow on the wrapper: SVGSVGElement has no offsetWidth
      if (key) el.setAttribute("data-move", key);
    },
    [rigRef, svg]
  );

  const setTempo = useCallback(
    (bpm: number) => {
      svg()?.style.setProperty("--beat", `${(60 / bpm).toFixed(4)}s`);
    },
    [svg]
  );

  const releaseOut = useCallback((fadeSec: number) => {
    const out = outRef.current;
    outRef.current = null;
    const ac = out?.context;
    if (!out || !ac) return;
    const now = ac.currentTime;
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.linearRampToValueAtTime(0, now + Math.max(fadeSec, 0.02));
    window.setTimeout(() => out.disconnect(), fadeSec * 1000 + 60);
  }, []);

  const stop = useCallback(
    (fadeSec = 1) => {
      unsubRef.current?.();
      unsubRef.current = null;
      stallRef.current?.();
      stallRef.current = null;
      sequencer.stop(fadeSec);
      releaseOut(fadeSec);
      setMove(null);
      setCurrentIndex(null);
      setState("idle");
    },
    [setMove, releaseOut]
  );

  /** One move, right now, with its note — the Twirl button, editor previews. */
  const playMove = useCallback(
    (key: MoveKey, bpm = 66) => {
      setTempo(bpm);
      setMove(key);
      if (soundRef.current) noteFor(key);
    },
    [setMove, setTempo]
  );

  /**
   * A whole dance on the clock, then the Bow. `song` null = the Quiet clock
   * at `bpmIfQuiet`. Returns false when audio could not start (no gesture yet).
   */
  const play = useCallback(
    (moves: MoveKey[], song: Song | null, bpmIfQuiet = 66): boolean => {
      stop(0);
      if (moves.length === 0) return false;
      const bpm = song?.bpm ?? bpmIfQuiet;
      setTempo(bpm);
      // The song obeys the sound setting too; the clock runs either way.
      const started = song
        ? sequencer.start(song, { music: soundRef.current })
        : sequencer.start(QUIET, { music: false, bpm });
      if (!started) return false;
      const ac = getAudioContext();
      const master = masterOut();
      if (ac && master) {
        const out = ac.createGain();
        out.connect(master);
        outRef.current = out;
      }
      // If the context never starts running (no gesture, interrupted), come back to idle.
      stallRef.current = sequencer.onStall(() => stop(0));

      const starts: number[] = [];
      let b = 0;
      for (const m of moves) {
        starts.push(b);
        b += MOVE_BY_KEY[m].beats;
      }
      const bowAt = b;
      const doneAt = b + BOW_BEATS;

      setState("playing");
      unsubRef.current = sequencer.onBeat((beat, time) => {
        const out = outRef.current ?? undefined;
        const i = starts.indexOf(beat);
        if (i >= 0) {
          setCurrentIndex(i);
          setMove(moves[i]);
          if (soundRef.current) noteFor(moves[i], time, out); // on the audio clock, with the music
          return;
        }
        if (beat === bowAt) {
          setCurrentIndex(null);
          setState("bowing");
          setMove("bow");
          if (soundRef.current) playChord(BOW_CHORD, { at: time, out });
          return;
        }
        if (beat >= doneAt) {
          unsubRef.current?.();
          unsubRef.current = null;
          stallRef.current?.();
          stallRef.current = null;
          sequencer.stop(1);
          releaseOut(2); // let the chord's tail ring out
          setMove(null);
          setState("done");
        }
      });
      return true;
    },
    [stop, setMove, setTempo, releaseOut]
  );

  // The tab going to the background stops everything; so does unmounting.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop(0.2);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop(0);
    };
  }, [stop]);

  return { state, currentIndex, play, playMove, stop };
}
