"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties, type MouseEvent } from "react";
import type { StageData, Look, PerformancePlan } from "@/actions/dance";
import { startDance } from "@/actions/dance";
import { Pirouette } from "@/components/dance/pirouette";
import { StageBox, type CurtainState, type StageRosette } from "@/components/dance/stage";
import { MoveStrip } from "@/components/dance/choose-dance";
import { FigurineCat } from "@/components/cats";
import { useDancePlayer, CARD_BEATS, type ShowItem } from "@/lib/dance-player";
import { MOVE_BY_KEY, NONE_KEY, PIROUETTES_CHOICE_NAME, QUIET_KEY, SPARKLES, type MoveKey } from "@/lib/dance-content";
import { SONGS, type Song } from "@/lib/music";
import { playNote, setVolume } from "@/lib/sound";
import { catchGlow } from "@/lib/dance-progress";
import { recordCatches } from "@/actions/dance";
import { unwrap } from "@/lib/action-result";

const CATCH_WINDOW_MS = 400;
const CURTAIN_OPEN_MS = 2500;
const PASS_MS = 800;
const GOLD = "#e6b422";
const STALL_MESSAGE = "Sound couldn’t start — tap the button below once more.";

/** One Sparkle catch sparkle on its way to the ring. */
type Flight = { id: number; at: number; midi: number; phase: "drift" | "pass" };
type Segment = { name: string; moves: MoveKey[] };

/**
 * The show for a plan (GAME-DESIGN.md §5.4). A plain evening is one dance. A
 * recital is "Recital N", each of the Program's dances with its own card, a
 * "Finale" card and the finale; on a late visit her own dance follows with
 * "Now your dance · …". Then the Bow.
 */
function buildShow(p: PerformancePlan): { items: ShowItem[]; segments: Segment[] } {
  const items: ShowItem[] = [];
  const segments: Segment[] = [];
  const add = (seg: Segment, card: string | null) => {
    const s = segments.length;
    segments.push(seg);
    if (card) items.push({ kind: "card", text: card, beats: CARD_BEATS, segment: s });
    seg.moves.forEach((key, index) => items.push({ kind: "move", key, segment: s, index }));
  };
  if (p.recital) {
    items.push({ kind: "card", text: `Recital ${p.recital.program}`, beats: CARD_BEATS, segment: 0 });
    p.recital.dances.forEach((d, k) => add(d, `Dance ${k + 1} · ${d.name}`));
    add({ name: "Finale", moves: p.recital.finale }, "Finale");
    if (!p.recital.onTime) add(p.dance, `Now your dance · ${p.dance.name}`);
  } else {
    add(p.dance, null);
  }
  return { items, segments };
}

/**
 * Step 3 (GAME-DESIGN.md §3.8, §5.3, §5.4). "Start the dance" (or "Start the
 * recital") writes the row, the curtains part over 2.5 s (a tap skips), then
 * the music fades in and the show plays on the beat clock. The Sparkle catch
 * lane sends one sparkle per move to the still ring at her chest; a tap within
 * ±400 ms of its arrival catches it, any other tap leaves a small sparkle.
 * Stop, the natural end, and the page being hidden all go to the Bow.
 */
export function Performance({
  data,
  look,
  danceId,
  replay,
  decorations,
  rosettes,
  caughtBefore,
  onBow,
}: {
  data: StageData;
  look: Look;
  danceId: string | null;
  /** A plan to replay ("Dance again") instead of starting a new one. */
  replay: PerformancePlan | null;
  /** Decorations on the stage tonight (frozen at open; new ones arrive at the Bow). */
  decorations: string[];
  /** Rosettes on the curtain tie-backs (frozen the same way). */
  rosettes: StageRosette[];
  /** Sparkles caught earlier this visit: the floor glow starts from them. */
  caughtBefore: number;
  /** `caught` is this dance's catches, handed over once; the Bow records them. */
  onBow: (plan: PerformancePlan, stopped: boolean, caught: number) => void;
}) {
  const rig = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [curtains, setCurtains] = useState<CurtainState>("closed");
  const [plan, setPlan] = useState<PerformancePlan | null>(replay);
  const planRef = useRef<PerformancePlan | null>(replay);
  const pendingRef = useRef<PerformancePlan | null>(null);
  const openTimer = useRef<number | null>(null);
  const timers = useRef(new Set<number>());
  /** False once this step has unmounted: a late startDance or timer must never start a show on another page. */
  const alive = useRef(true);

  const calm = data.settings.reducedMotion;
  const laneOn = data.settings.sparkleTaps; // its own setting; the None style only turns off the ambient ones
  const styleColor = look.sparkle === NONE_KEY ? null : SPARKLES.find((s) => s.key === look.sparkle)?.color ?? GOLD;
  const laneColor = styleColor ?? GOLD;
  const ambient = look.sparkle === NONE_KEY ? 0 : Math.max(0, data.ambient);

  const song: Song | null = look.music === QUIET_KEY || !data.settings.music ? null : SONGS[look.music] ?? SONGS.music_box;
  const bpm = song?.bpm ?? 66;
  const spbMs = (60 / bpm) * 1000;

  // ── Sparkles in flight ──
  const [flights, setFlights] = useState<Flight[]>([]);
  const flightsRef = useRef<Flight[]>([]);
  const nextId = useRef(1);
  const [burst, setBurst] = useState<number | null>(null);
  const [tap, setTap] = useState<{ id: number; x: number; y: number } | null>(null);
  // A catch on an earlier evening, or earlier this visit ("Dance again"), means the ring already pulses.
  const [everCaught, setEverCaught] = useState(data.everCaught || caughtBefore > 0);
  /** This dance's catches, until they are handed to the Bow (then 0, so they are counted once). */
  const caughtRef = useRef(0);
  const [caught, setCaught] = useState(0);
  const ringRef = useRef<HTMLDivElement>(null);
  const everCaughtRef = useRef(data.everCaught || caughtBefore > 0);

  function later(fn: () => void, ms: number) {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }
  function updateFlights(fn: (f: Flight[]) => Flight[]) {
    flightsRef.current = fn(flightsRef.current);
    setFlights(flightsRef.current);
  }
  function clearOpenTimer() {
    if (openTimer.current != null) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }
  useEffect(() => {
    alive.current = true; // set in the body: Strict Mode runs effects twice
    const set = timers.current;
    return () => {
      alive.current = false;
      clearOpenTimer();
      for (const t of set) clearTimeout(t);
      set.clear();
      // Left mid-dance without a Bow (a tab tap): her catches are still kept.
      const left = caughtRef.current;
      caughtRef.current = 0;
      if (left > 0) void recordCatches(left).catch(() => {});
    };
  }, []);

  /** To the Bow, with this dance's catches; any later call hands over 0. */
  function bow(p: PerformancePlan, stopped: boolean) {
    const n = caughtRef.current;
    caughtRef.current = 0;
    onBow(p, stopped, n);
  }

  /** After her first catch ever, the ring breathes once on every beat, restarted on the beat clock. */
  function pulseRing() {
    const el = ringRef.current;
    if (!el || !everCaughtRef.current || calm) return;
    el.classList.remove("animate-lite-ring-pulse");
    void el.offsetWidth; // reflow, so the same animation restarts
    el.classList.add("animate-lite-ring-pulse");
  }

  /** A move just started on the beat: its sparkle arrives two beats from now. */
  function launchSparkle(key: MoveKey) {
    if (!laneOn) return;
    const id = nextId.current++;
    updateFlights((f) => [...f, { id, at: performance.now() + 2 * spbMs, midi: MOVE_BY_KEY[key]?.midi ?? 79, phase: "drift" }]);
    later(() => {
      if (!flightsRef.current.some((x) => x.id === id)) return; // caught
      updateFlights((f) => f.map((x) => (x.id === id ? { ...x, phase: "pass" } : x)));
      later(() => updateFlights((f) => f.filter((x) => x.id !== id)), PASS_MS);
    }, 2 * spbMs + CATCH_WINDOW_MS);
  }

  const player = useDancePlayer(rig, {
    sound: data.settings.sound,
    onMoveStart: launchSparkle,
    onBeat: () => pulseRing(),
    // Never come back to a half-finished dance: hidden mid-dance goes to the Bow.
    onHidden: () => {
      if (planRef.current) bow(planRef.current, true);
    },
    onStall: () => {
      clearOpenTimer();
      setCurtains("closed");
      setError(STALL_MESSAGE);
    },
  });

  // The show and its Bow move have played: on to the Bow step (it closes the curtains).
  useEffect(() => {
    if (player.state === "done" && planRef.current) bow(planRef.current, false);
  }, [player.state, onBow]);

  /**
   * Hidden before the show started (curtains opening, or startDance in flight):
   * never start in the background. If the row is written, go to the Bow; if not, close the curtains.
   */
  function abandonHidden() {
    clearOpenTimer();
    pendingRef.current = null;
    if (planRef.current) bow(planRef.current, true);
    else setCurtains("closed");
  }
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      if (openTimer.current != null || pendingRef.current) abandonHidden();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  });

  /** Curtains are open (or skipped): start the clock. */
  function reveal() {
    clearOpenTimer();
    if (!alive.current) return;
    if (document.visibilityState === "hidden") {
      abandonHidden();
      return;
    }
    const p = pendingRef.current;
    pendingRef.current = null;
    if (!p) return;
    setCurtains("open");
    const ok = player.playShow(buildShow(p).items, song, 66);
    if (!ok) {
      setCurtains("closed");
      setError(STALL_MESSAGE);
    }
  }

  function begin(p: PerformancePlan) {
    if (!alive.current) return;
    planRef.current = p;
    setPlan(p);
    pendingRef.current = p;
    if (calm) {
      reveal();
      return;
    }
    setCurtains("opening");
    openTimer.current = window.setTimeout(reveal, CURTAIN_OPEN_MS);
  }

  function start() {
    setError(null);
    // Create or resume audio inside this tap: iPad Safari only allows it in a gesture.
    setVolume(data.settings.volume);
    const known = replay ?? planRef.current;
    if (known) {
      begin(known);
      return;
    }
    startTransition(async () => {
      try {
        begin(unwrap(await startDance(danceId, look)));
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t work — try again.");
      }
    });
  }

  function stop() {
    clearOpenTimer();
    pendingRef.current = null;
    player.stop(1);
    if (planRef.current) bow(planRef.current, true);
  }

  const playing = player.state === "playing" || player.state === "bowing";
  // The catch burst (6) and the fingertip sparkle (1) borrow from the ambient ones, never below 3.
  const ambientShown = Math.max(Math.min(3, ambient), ambient - (burst != null ? 6 : 0) - (tap ? 1 : 0));

  function onStageTap(e: MouseEvent<HTMLDivElement>) {
    if (curtains === "opening") {
      reveal(); // tap anywhere skips the curtains
      return;
    }
    if (!playing || !laneOn) return;
    const now = performance.now();
    const hit = flightsRef.current.find((f) => f.phase === "drift" && Math.abs(now - f.at) <= CATCH_WINDOW_MS);
    if (hit) {
      updateFlights((f) => f.filter((x) => x.id !== hit.id));
      setEverCaught(true);
      everCaughtRef.current = true; // the ring pulses from the next beat on
      caughtRef.current += 1;
      setCaught((c) => c + 1);
      setBurst(hit.id);
      later(() => setBurst((b) => (b === hit.id ? null : b)), 1500);
      if (data.settings.sound) {
        const up = hit.midi + 12;
        if (up <= 84) playNote(up, { dur: 0.4, peak: 0.3 });
        else playNote(hit.midi, { dur: 0.25, peak: 0.3 });
      }
      return;
    }
    // Off the beat: a small silent sparkle where she tapped. Never wrong.
    const rect = e.currentTarget.getBoundingClientRect();
    const id = -nextId.current++;
    setTap({ id, x: e.clientX - rect.left, y: e.clientY - rect.top });
    later(() => setTap((t) => (t?.id === id ? null : t)), 600);
  }

  // What the strip shows: the segment dancing now, or before the start, tonight's dance.
  const show = useMemo(() => (plan ? buildShow(plan) : null), [plan]);
  const selected = danceId == null ? null : data.dances.find((d) => d.id === danceId) ?? null;
  // Before a recital starts, the strip already shows its first dance, not her own.
  const firstOfRecital: Segment | null = data.recital
    ? data.recital.dances[0] ?? { name: "Finale", moves: data.recital.finale }
    : null;
  const fallback: Segment = firstOfRecital ?? { name: selected?.name ?? PIROUETTES_CHOICE_NAME, moves: selected?.moves ?? data.pirouettesChoice };
  const seg = show ? show.segments[player.segment ?? 0] ?? show.segments[0] : fallback;
  const isRecital = plan ? !!plan.recital : !!data.recital;

  return (
    <div className="space-y-3">
      <div className="relative">
        <StageBox
          stageKey={look.stage}
          curtains={curtains}
          decorations={decorations}
          rosettes={rosettes}
          glow={catchGlow(caughtBefore + caught)}
          onTap={curtains === "opening" || playing ? onStageTap : undefined}
        >
          <div className="relative">
            {/* ambient sparkles, within the motion budget; off with the None style */}
            {playing && !calm && ambient > 0 && (
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {Array.from({ length: ambientShown }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute text-base animate-lite-sparkle"
                    style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 90}%`, color: styleColor ?? GOLD, animationDelay: `${(i % 6) * 0.27}s` }}
                  >
                    ✦
                  </span>
                ))}
              </div>
            )}
            <Pirouette ref={rig} size={200} costume={look.costume} sway={playing && !calm} />
            {/* the still ring at her chest; every Sparkle catch sparkle ends here */}
            {laneOn && playing && (
              <div className="absolute pointer-events-none" style={{ left: "50%", top: "62%", transform: "translate(-50%, -50%)" }} aria-hidden>
                <div ref={ringRef} className={`w-20 h-20 rounded-full border-2 ${everCaught ? "border-gold" : "border-gold/60"}`} />
                {flights.map((f) => (
                  <span
                    key={f.id}
                    className={`absolute left-1/2 top-1/2 -ml-3 -mt-3 text-2xl ${f.phase === "drift" ? "animate-lite-sparkle-drift" : "animate-lite-sparkle-pass"}`}
                    style={{ color: laneColor, ["--drift" as string]: `${(2 * spbMs) / 1000}s` } as CSSProperties}
                  >
                    ✦
                  </span>
                ))}
                {burst != null && (
                  <span key={burst} className="absolute left-1/2 top-1/2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute text-lg animate-lite-float"
                        style={{ color: laneColor, left: `${(i - 3) * 14}px`, top: `${(i % 2) * 10 - 10}px`, animationDelay: `${i * 60}ms` }}
                      >
                        ✦
                      </span>
                    ))}
                  </span>
                )}
              </div>
            )}
          </div>
        </StageBox>
        {/* the title card: static, two beats, between dances */}
        {player.card && (
          <div className="absolute inset-x-6 top-[18%] pointer-events-none flex justify-center" aria-live="polite">
            <div className="rounded-2xl bg-surface/95 border border-line shadow-lg px-6 py-4 text-center">
              <p className="text-2xl font-bold">{player.card}</p>
            </div>
          </div>
        )}
        {/* off-beat tap sparkles */}
        {tap && (
          <span key={tap.id} className="absolute pointer-events-none text-xl animate-lite-tap-sparkle" style={{ left: tap.x - 10, top: tap.y - 10, color: laneColor }} aria-hidden>✦</span>
        )}
        {playing && (
          <button
            onClick={stop}
            className="absolute top-3 right-3 h-14 px-5 rounded-2xl bg-surface/90 border border-line font-semibold shadow-sm"
          >
            Stop
          </button>
        )}
      </div>

      {/* the front row at a recital: her cat friends watch, still, until the Bow */}
      {isRecital && data.earnedCats.length > 0 && (
        <div className="rounded-[1.25rem] bg-surface border border-line px-3 py-2 flex justify-center gap-1" aria-label="Your cat friends in the front row">
          {data.earnedCats.map((c) => <FigurineCat key={c} variant={c} size={30} />)}
        </div>
      )}

      {/* The space is kept for the whole step so nothing moves when the dance starts; the words show only during it. */}
      {laneOn && (
        <p className={`text-sm text-center text-muted px-2 ${playing ? "" : "invisible"}`} aria-hidden={!playing}>
          Tap when the sparkle reaches Pirouette. You can also just watch.
        </p>
      )}

      <div className="rounded-[1.25rem] bg-surface border border-line px-4 py-3">
        <p className="text-xs uppercase tracking-wider text-muted font-semibold">{seg.name}</p>
        <MoveStrip moves={seg.moves} slots={Math.max(data.slotCount, seg.moves.length)} current={player.card ? null : player.currentIndex} />
      </div>

      {error && <p className="text-sm text-accent-deep px-1">⚠ {error}</p>}

      {!playing && curtains !== "opening" && player.state !== "done" && (
        <button
          onClick={start}
          disabled={isPending}
          className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          {isRecital ? "Start the recital" : "Start the dance"}
        </button>
      )}
    </div>
  );
}
