"use client";

/**
 * useDancePlayer — drives the Pirouette rig from the beat clock.
 *
 * It plays a *show*: a timeline of title cards and dance segments on one
 * continuous clock (the music never stops between dances), then the Bow.
 * It sets `data-move` on the rig's <svg class="pir"> (with the reflow trick so
 * the same move can repeat back to back), sets `--beat` from the tempo, plays
 * each move's note on the audio clock, and stops cleanly on unmount or when
 * the tab is hidden.
 *
 * Optional callbacks: onMoveStart(key) fires synchronously on the beat a move
 * starts (the Sparkle catch lane times its window from it); onHidden fires when
 * the page is hidden mid-dance, before the stop (the stage goes to the Bow);
 * onStall fires when audio never started (the stage resets its curtains).
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { BOW_BEATS, BOW_CHORD, MOVE_BY_KEY, type MoveKey } from "@/lib/dance-content";
import { QUIET, sequencer, type Song } from "@/lib/music";
import { getAudioContext, masterOut, playChord, playNote } from "@/lib/sound";

export type PlayerState = "idle" | "playing" | "bowing" | "done";

/** Two beats on the clock: about 1.5–2 s at the loops' tempos (GAME-DESIGN.md §5.4). */
export const CARD_BEATS = 2;

export type ShowItem =
  | { kind: "card"; text: string; beats: number }
  | { kind: "move"; key: MoveKey; segment: number; index: number };

export type PlayerOptions = {
  sound: boolean;
  onMoveStart?: (key: MoveKey) => void;
  onHidden?: () => void;
  onStall?: () => void;
};

function noteFor(key: MoveKey, at?: number, out?: AudioNode) {
  const m = MOVE_BY_KEY[key];
  playNote(m.midi, { at, out });
  if (m.midi2 != null) playNote(m.midi2, { at, out, peak: 0.28 });
}

export function useDancePlayer(rigRef: RefObject<HTMLDivElement | null>, opts: PlayerOptions) {
  const [state, setStateRaw] = useState<PlayerState>("idle");
  const stateRef = useRef<PlayerState>("idle");
  const setState = useCallback((s: PlayerState) => {
    stateRef.current = s;
    setStateRaw(s);
  }, []);
  /** Index of the current move within its segment. */
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  /** Which segment of the show is dancing (0 for a plain dance). */
  const [segment, setSegment] = useState<number | null>(null);
  /** The title card on screen, if any. */
  const [card, setCard] = useState<string | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const unsubRef = useRef<(() => void) | null>(null);
  const stallRef = useRef<(() => void) | null>(null);
  /** The show's own output, so Stop can fade move notes and the chord too. */
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
      setSegment(null);
      setCard(null);
      setState("idle");
    },
    [setMove, releaseOut, setState]
  );

  /** One move, right now, with its note — the tap Twirl, editor previews. */
  const playMove = useCallback(
    (key: MoveKey, bpm = 66) => {
      setTempo(bpm);
      setMove(key);
      if (soundRef.current) noteFor(key);
    },
    [setMove, setTempo]
  );

  /**
   * A whole show on the clock, then the Bow. `song` null = the Quiet clock at
   * `bpmIfQuiet`. Returns false when audio could not start (no gesture yet).
   */
  const playShow = useCallback(
    (items: ShowItem[], song: Song | null, bpmIfQuiet = 66): boolean => {
      stop(0);
      if (!items.some((i) => i.kind === "move")) return false;
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
      stallRef.current = sequencer.onStall(() => {
        stop(0);
        optsRef.current.onStall?.();
      });

      const at = new Map<number, ShowItem>();
      let b = 0;
      for (const item of items) {
        at.set(b, item);
        b += item.kind === "card" ? item.beats : MOVE_BY_KEY[item.key].beats;
      }
      const bowAt = b;
      const doneAt = b + BOW_BEATS;

      setState("playing");
      unsubRef.current = sequencer.onBeat((beat, time) => {
        const out = outRef.current ?? undefined;
        const item = at.get(beat);
        if (item?.kind === "card") {
          setMove(null);
          setCurrentIndex(null);
          setCard(item.text);
          return;
        }
        if (item?.kind === "move") {
          setCard(null);
          setSegment(item.segment);
          setCurrentIndex(item.index);
          setMove(item.key);
          if (soundRef.current) noteFor(item.key, time, out); // on the audio clock, with the music
          optsRef.current.onMoveStart?.(item.key);
          return;
        }
        if (beat === bowAt) {
          setCard(null);
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
    [stop, setMove, setTempo, releaseOut, setState]
  );

  /** A single dance: one segment, no cards. */
  const play = useCallback(
    (moves: MoveKey[], song: Song | null, bpmIfQuiet = 66): boolean =>
      playShow(moves.map((key, index) => ({ kind: "move", key, segment: 0, index })), song, bpmIfQuiet),
    [playShow]
  );

  // The tab going to the background stops everything; so does unmounting.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      const midDance = stateRef.current === "playing" || stateRef.current === "bowing";
      stop(0.2);
      if (midDance) optsRef.current.onHidden?.();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop(0);
    };
  }, [stop]);

  return { state, currentIndex, segment, card, play, playShow, playMove, stop };
}
