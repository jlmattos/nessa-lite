"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties, type MouseEvent } from "react";
import type { StageData, Look, PerformancePlan } from "@/actions/dance";
import { startDance } from "@/actions/dance";
import { Pirouette } from "@/components/dance/pirouette";
import { StageBox, type CurtainState } from "@/components/dance/stage";
import { MoveStrip } from "@/components/dance/choose-dance";
import { useDancePlayer } from "@/lib/dance-player";
import { MOVE_BY_KEY, NONE_KEY, PIROUETTES_CHOICE_NAME, QUIET_KEY, SPARKLES } from "@/lib/dance-content";
import { SONGS, type Song } from "@/lib/music";
import { playNote, setVolume } from "@/lib/sound";

const CATCH_WINDOW_MS = 400;
const CURTAIN_OPEN_MS = 2500;
const PASS_MS = 800;
const GOLD = "#e6b422";
const STALL_MESSAGE = "Sound couldn’t start — tap Start the dance once more.";

/** One Sparkle catch sparkle on its way to the ring. */
type Flight = { id: number; at: number; midi: number; phase: "drift" | "pass" };

/**
 * Step 3 (GAME-DESIGN.md §3.8, §5.3). "Start the dance" writes the row, the
 * curtains part over 2.5 s (a tap skips), then the music fades in and
 * Pirouette dances on the beat clock. The Sparkle catch lane sends one
 * sparkle per move to the still ring at her chest; a tap within ±400 ms of
 * its arrival catches it, any other tap leaves a small sparkle. Stop, the
 * natural end, and the page being hidden all go to the Bow.
 */
export function Performance({
  data,
  look,
  danceId,
  replay,
  onBow,
}: {
  data: StageData;
  look: Look;
  danceId: string | null;
  /** A plan to replay ("Dance again") instead of starting a new one. */
  replay: PerformancePlan | null;
  onBow: (plan: PerformancePlan, stopped: boolean) => void;
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
  const [bursts, setBursts] = useState<number[]>([]);
  const [taps, setTaps] = useState<{ id: number; x: number; y: number }[]>([]);
  const [everCaught, setEverCaught] = useState(false);

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
    const set = timers.current;
    return () => {
      clearOpenTimer();
      for (const t of set) clearTimeout(t);
      set.clear();
    };
  }, []);

  /** A move just started on the beat: its sparkle arrives two beats from now. */
  function launchSparkle(index: number) {
    if (!laneOn) return;
    const moves = planRef.current?.dance.moves ?? [];
    const move = MOVE_BY_KEY[moves[index]];
    const id = nextId.current++;
    updateFlights((f) => [...f, { id, at: performance.now() + 2 * spbMs, midi: move?.midi ?? 79, phase: "drift" }]);
    later(() => {
      if (!flightsRef.current.some((x) => x.id === id)) return; // caught
      updateFlights((f) => f.map((x) => (x.id === id ? { ...x, phase: "pass" } : x)));
      later(() => updateFlights((f) => f.filter((x) => x.id !== id)), PASS_MS);
    }, 2 * spbMs + CATCH_WINDOW_MS);
  }

  const player = useDancePlayer(rig, {
    sound: data.settings.sound,
    onMoveStart: launchSparkle,
    // Never come back to a half-finished dance: hidden mid-dance goes to the Bow.
    onHidden: () => {
      if (planRef.current) onBow(planRef.current, true);
    },
    onStall: () => {
      clearOpenTimer();
      setCurtains("closed");
      setError(STALL_MESSAGE);
    },
  });

  // The dance and its Bow move have played: on to the Bow step (it closes the curtains).
  useEffect(() => {
    if (player.state === "done" && planRef.current) onBow(planRef.current, false);
  }, [player.state, onBow]);

  /** Curtains are open (or skipped): start the clock. */
  function reveal() {
    clearOpenTimer();
    const p = pendingRef.current;
    pendingRef.current = null;
    if (!p) return;
    setCurtains("open");
    const ok = player.play(p.dance.moves, song, 66);
    if (!ok) {
      setCurtains("closed");
      setError(STALL_MESSAGE);
    }
  }

  function begin(p: PerformancePlan) {
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
        begin(await startDance(danceId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t work — try again.");
      }
    });
  }

  function stop() {
    clearOpenTimer();
    pendingRef.current = null;
    player.stop(1);
    if (planRef.current) onBow(planRef.current, true);
  }

  const playing = player.state === "playing" || player.state === "bowing";

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
      setBursts((b) => [...b, hit.id]);
      later(() => setBursts((b) => b.filter((x) => x !== hit.id)), 1500);
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
    setTaps((t) => [...t, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    later(() => setTaps((t) => t.filter((s) => s.id !== id)), 600);
  }

  const selected = danceId == null ? null : data.dances.find((d) => d.id === danceId) ?? null;
  const moves = plan?.dance.moves ?? selected?.moves ?? data.pirouettesChoice;
  const title = plan?.dance.name ?? selected?.name ?? PIROUETTES_CHOICE_NAME;

  return (
    <div className="space-y-3">
      <div className="relative">
        <StageBox
          stageKey={look.stage}
          curtains={curtains}
          decorations={data.decorations}
          onTap={curtains === "opening" || playing ? onStageTap : undefined}
        >
          <div className="relative">
            {/* ambient sparkles, within the motion budget; off with the None style */}
            {playing && !calm && ambient > 0 && (
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {Array.from({ length: ambient }).map((_, i) => (
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
            <Pirouette ref={rig} size={200} costume={look.costume} dancing={playing && !calm} />
            {/* the still ring at her chest; every Sparkle catch sparkle ends here */}
            {laneOn && playing && (
              <div className="absolute pointer-events-none" style={{ left: "50%", top: "62%", transform: "translate(-50%, -50%)" }} aria-hidden>
                <div className={`w-20 h-20 rounded-full border-2 ${everCaught ? "border-gold" : "border-gold/60"}`} />
                {flights.map((f) => (
                  <span
                    key={f.id}
                    className={`absolute left-1/2 top-1/2 -ml-3 -mt-3 text-2xl ${f.phase === "drift" ? "animate-lite-sparkle-drift" : "animate-lite-sparkle-pass"}`}
                    style={{ color: laneColor, ["--drift" as string]: `${(2 * spbMs) / 1000}s` } as CSSProperties}
                  >
                    ✦
                  </span>
                ))}
                {bursts.map((id) => (
                  <span key={id} className="absolute left-1/2 top-1/2">
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
                ))}
              </div>
            )}
          </div>
        </StageBox>
        {/* off-beat tap sparkles */}
        {taps.map((t) => (
          <span key={t.id} className="absolute pointer-events-none text-xl animate-lite-tap-sparkle" style={{ left: t.x - 10, top: t.y - 10, color: laneColor }} aria-hidden>✦</span>
        ))}
        {playing && (
          <button
            onClick={stop}
            className="absolute top-3 right-3 h-14 px-5 rounded-2xl bg-surface/90 border border-line font-semibold shadow-sm"
          >
            Stop
          </button>
        )}
      </div>

      {laneOn && playing && (
        <p className="text-sm text-center text-muted px-2">Tap when the sparkle reaches Pirouette. You can also just watch.</p>
      )}

      <div className="rounded-[1.25rem] bg-surface border border-line px-4 py-3">
        <p className="text-xs uppercase tracking-wider text-muted font-semibold">{title}</p>
        <MoveStrip moves={moves} slots={Math.max(data.slotCount, moves.length)} current={player.currentIndex} />
      </div>

      {error && <p className="text-sm text-accent-deep px-1">⚠ {error}</p>}

      {!playing && curtains !== "opening" && player.state !== "done" && (
        <button
          onClick={start}
          disabled={isPending}
          className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          Start the dance
        </button>
      )}
    </div>
  );
}
