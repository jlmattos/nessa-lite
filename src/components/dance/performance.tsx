"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { StageData, Look, PerformancePlan } from "@/actions/dance";
import { startDance } from "@/actions/dance";
import { Pirouette } from "@/components/dance/pirouette";
import { StageBox, type CurtainState } from "@/components/dance/stage";
import { MoveStrip } from "@/components/dance/choose-dance";
import { useDancePlayer } from "@/lib/dance-player";
import { MOVE_BY_KEY, QUIET_KEY, SPARKLES, type MoveKey } from "@/lib/dance-content";
import { SONGS, type Song } from "@/lib/music";
import { playNote, setVolume } from "@/lib/sound";

const CATCH_WINDOW_MS = 400;

/**
 * Step 3 (GAME-DESIGN.md §3.8, §5.3): the stage with curtains, Pirouette in
 * tonight's look, ambient sparkles within the budget, the move strip, and the
 * Sparkle catch lane when it is on. "Start the dance" writes the row and
 * plays exactly what was recorded. Stop fades out and goes to the Bow.
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
  const player = useDancePlayer(rig, { sound: data.settings.sound });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [curtains, setCurtains] = useState<CurtainState>("closed");
  const [plan, setPlan] = useState<PerformancePlan | null>(replay);
  const planRef = useRef<PerformancePlan | null>(replay);
  const calm = data.settings.reducedMotion;
  const laneOn = data.settings.sparkleTaps && look.sparkle !== "none";
  const sparkleColor = SPARKLES.find((s) => s.key === look.sparkle)?.color ?? "#e6b422";

  const song: Song | null = look.music === QUIET_KEY || !data.settings.music ? null : SONGS[look.music] ?? SONGS.music_box;
  const bpm = song?.bpm ?? 66;
  const spbMs = (60 / bpm) * 1000;

  // ── Sparkle catch state ──
  const arrivalRef = useRef<number | null>(null); // performance.now() when the sparkle reaches the ring
  const [driftKey, setDriftKey] = useState(0);
  const [bursts, setBursts] = useState<number[]>([]);
  const [taps, setTaps] = useState<{ id: number; x: number; y: number }[]>([]);
  const [everCaught, setEverCaught] = useState(false);

  // A new move started: launch its sparkle (one per move, arriving after two beats).
  useEffect(() => {
    if (player.currentIndex == null || !laneOn) {
      arrivalRef.current = null;
      return;
    }
    arrivalRef.current = performance.now() + 2 * spbMs;
    setDriftKey((k) => k + 1);
  }, [player.currentIndex, laneOn, spbMs]);

  // Dance finished (the Bow move + chord have played): hand over to the Bow step.
  useEffect(() => {
    if (player.state === "done" && planRef.current) {
      setCurtains("closing");
      const t = window.setTimeout(() => onBow(planRef.current!, false), 400);
      return () => clearTimeout(t);
    }
  }, [player.state, onBow]);

  function begin(p: PerformancePlan) {
    planRef.current = p;
    setPlan(p);
    setCurtains(calm ? "open" : "opening");
    setVolume(data.settings.volume);
    const ok = player.play(p.dance.moves, song, 66);
    if (!ok) setError("Sound couldn’t start — tap Start the dance once more.");
  }

  function start() {
    setError(null);
    if (replay) {
      begin(replay);
      return;
    }
    startTransition(async () => {
      try {
        const p = await startDance(danceId);
        begin(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t work — try again.");
      }
    });
  }

  function stop() {
    player.stop(1);
    setCurtains("closing");
    if (planRef.current) onBow(planRef.current, true);
  }

  function onStageTap(e: React.MouseEvent<HTMLDivElement>) {
    if (player.state !== "playing" || !laneOn) return;
    const now = performance.now();
    const arrival = arrivalRef.current;
    if (arrival != null && Math.abs(now - arrival) <= CATCH_WINDOW_MS) {
      arrivalRef.current = null; // one catch per sparkle
      setEverCaught(true);
      setBursts((b) => [...b, now]);
      window.setTimeout(() => setBursts((b) => b.filter((t) => t !== now)), 1500);
      if (data.settings.sound && player.currentIndex != null) {
        const moves = planRef.current?.dance.moves ?? [];
        const m = MOVE_BY_KEY[moves[player.currentIndex] as MoveKey];
        if (m) {
          const up = m.midi + 12;
          if (up <= 84) playNote(up, { dur: 0.4, peak: 0.3 });
          else playNote(m.midi, { dur: 0.25, peak: 0.3 });
        }
      }
      return;
    }
    // Off the beat: a small silent sparkle where she tapped. Never wrong.
    const rect = e.currentTarget.getBoundingClientRect();
    const id = now;
    setTaps((t) => [...t, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    window.setTimeout(() => setTaps((t) => t.filter((s) => s.id !== id)), 600);
  }

  const moves = plan?.dance.moves ?? (danceId == null ? data.pirouettesChoice : data.dances.find((d) => d.id === danceId)?.moves ?? data.pirouettesChoice);
  const playing = player.state === "playing" || player.state === "bowing";
  const ambient = Math.max(0, data.ambient);

  return (
    <div className="space-y-3">
      <div className="relative">
        <StageBox stageKey={look.stage} curtains={curtains} decorations={data.decorations} onTap={playing ? onStageTap : undefined}>
          <div className="relative">
            {/* ambient sparkles, within the budget */}
            {playing && !calm && (
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {Array.from({ length: ambient }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute text-base animate-lite-sparkle"
                    style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 90}%`, color: sparkleColor, animationDelay: `${(i % 6) * 0.27}s` }}
                  >
                    ✦
                  </span>
                ))}
              </div>
            )}
            <Pirouette ref={rig} size={200} costume={look.costume} dancing={playing && !calm} />
            {/* the still ring at her chest; the sparkle lane ends here */}
            {laneOn && playing && (
              <div className="absolute pointer-events-none" style={{ left: "50%", top: "62%", transform: "translate(-50%, -50%)" }} aria-hidden>
                <div className={`w-20 h-20 rounded-full border-2 ${everCaught ? "border-gold" : "border-gold/60"}`} />
                {player.currentIndex != null && (
                  <span
                    key={driftKey}
                    className="absolute left-1/2 top-1/2 -ml-3 -mt-3 text-2xl animate-lite-sparkle-drift"
                    style={{ color: sparkleColor, ["--drift" as string]: `${(2 * spbMs) / 1000}s` } as React.CSSProperties}
                  >
                    ✦
                  </span>
                )}
                {bursts.map((t) => (
                  <span key={t} className="absolute left-1/2 top-1/2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute text-lg animate-lite-float"
                        style={{ color: sparkleColor, left: `${(i - 3) * 14}px`, top: `${(i % 2) * 10 - 10}px`, animationDelay: `${i * 60}ms` }}
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
          <span key={t.id} className="absolute pointer-events-none text-xl animate-lite-tap-sparkle" style={{ left: t.x - 10, top: t.y - 10, color: sparkleColor }} aria-hidden>✦</span>
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
        <p className="text-xs uppercase tracking-wider text-muted font-semibold">{plan?.dance.name ?? (danceId == null ? "Pirouette’s choice" : data.dances.find((d) => d.id === danceId)?.name ?? "This dance")}</p>
        <MoveStrip moves={moves} slots={Math.max(data.slotCount, moves.length)} current={player.currentIndex} />
      </div>

      {error && <p className="text-sm text-accent-deep px-1">⚠ {error}</p>}

      {!playing && player.state !== "done" && (
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
