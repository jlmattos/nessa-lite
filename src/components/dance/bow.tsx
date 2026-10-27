"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StageData, Look, PerformancePlan } from "@/actions/dance";
import { closeCurtains, recordCatches } from "@/actions/dance";
import { Pirouette } from "@/components/dance/pirouette";
import { StageBox, stageBackground, type CurtainState, type StageRosette } from "@/components/dance/stage";
import { PosterCard } from "@/components/dance/poster";
import { FigurineCat } from "@/components/cats";
import { useDancePlayer } from "@/lib/dance-player";
import { catchGlow, posterFor } from "@/lib/dance-progress";
import { unwrap } from "@/lib/action-result";

/**
 * Step 4 (GAME-DESIGN.md §3.9, §3.10). The curtains close, the cat friends in
 * the front row clap (one hop each), "The end.", where she is in the Program
 * (or "Recital N complete.", the Program's poster and what is new on the
 * stage), any rosette line earned today ("You made a dance."), "You caught
 * 12 sparkles." only if Jose turned that on, then two buttons: Done for today
 * (persisted) and Dance again (replays exactly what just played). The dance's
 * caught sparkles are recorded here, once, and glow on the floor.
 */
export function Bow({
  data,
  look,
  plan,
  decorations,
  rosettes,
  newDecorations,
  caught,
  caughtTonight,
  onDanceAgain,
}: {
  data: StageData;
  look: Look;
  plan: PerformancePlan;
  /** Everything on the stage now, including what tonight's recital added. */
  decorations: string[];
  /** Rosettes on the curtain tie-backs, tonight's included. */
  rosettes: StageRosette[];
  /** Names of the decorations tonight's recital added, for the one announcement. */
  newDecorations: string[];
  /** Sparkles caught in the dance that just ended (recorded here, once). */
  caught: number;
  /** Sparkles caught this visit, this dance included (the floor glow, the optional count). */
  caughtTonight: number;
  onDanceAgain: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const calm = data.settings.reducedMotion;
  const rig = useRef<HTMLDivElement>(null);
  const player = useDancePlayer(rig, { sound: data.settings.sound });
  const bowed = useRef(false);
  // Every ending is the same: Pirouette bows once and the final chord plays.
  const { playBow } = player;
  useEffect(() => {
    if (bowed.current) return;
    bowed.current = true;
    playBow();
  }, [playBow]);
  // recordCatches runs once per dance, here, whether the dance finished, was stopped or was hidden.
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current || caught <= 0) return;
    recorded.current = true;
    const save = () => recordCatches(caught).then(unwrap);
    // One quiet retry; the count is never shown to her, so a failure stays silent.
    save().catch(() => window.setTimeout(() => void save().catch(() => {}), 1500));
  }, [caught]);
  // Her first catch ever is announced at once; the rosette's own line takes over when the data refreshes.
  const [firstCatch] = useState(() => !data.everCaught && caughtTonight > 0);
  // The curtains close over 3 s as the Bow opens; in calm mode they are simply closed.
  const curtains: CurtainState = calm ? "closed" : "closing";
  // What just played decides the line, not the text computed before the dance.
  const line = plan.recital ? `Recital ${plan.recital.program} complete.` : data.programLine.text;
  // On recital day the recital was the show; on other evenings name the dance she chose.
  const danceName = plan.recital?.onTime ? null : plan.dance.name;
  // Tonight's poster is built from what just played, in the look that played it.
  const poster = plan.recital ? posterFor(plan.recital.program, look, plan.recital.posterDances) : null;
  const rosetteLines = [
    ...new Set([...data.rosettes.flatMap((r) => (r.line ? [r.line] : [])), ...(firstCatch ? ["You caught a sparkle."] : [])]),
  ];
  // Only if Jose turned it on (§10 #4: no numbers by default), and never a zero: no miss feedback.
  const countLine =
    data.settings.sparkleCount && caughtTonight > 0
      ? `You caught ${caughtTonight} sparkle${caughtTonight === 1 ? "" : "s"}.`
      : null;

  function done() {
    setError(null);
    startTransition(async () => {
      try {
        unwrap(await closeCurtains());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t work — try again.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <StageBox stageKey={look.stage} curtains={curtains} decorations={decorations} rosettes={rosettes} glow={catchGlow(caughtTonight)}>
        <Pirouette ref={rig} size={150} costume={look.costume} />
      </StageBox>

      {data.earnedCats.length > 0 && (
        <div className="rounded-[1.25rem] bg-surface border border-line px-3 py-2 flex justify-center gap-1" aria-label="Your cat friends clap in the front row">
          {data.earnedCats.map((c, i) => (
            <span key={c} className={calm ? "" : "animate-lite-hop"} style={calm ? undefined : { animationDelay: `${i * 90}ms` }}>
              <FigurineCat variant={c} size={30} />
            </span>
          ))}
        </div>
      )}

      <div className="rounded-[1.25rem] bg-surface border border-line p-5 text-center">
        <p className="text-2xl font-bold">The end.</p>
        <p className="text-sm text-muted mt-1">{line}</p>
        {poster && (
          <div className="mt-3 flex justify-center">
            <PosterCard poster={poster} width={150} stageBackground={stageBackground(poster.stage)} />
          </div>
        )}
        {newDecorations.length > 0 && (
          <p className="text-sm font-medium mt-2">New on the stage: {newDecorations.join(" · ")}</p>
        )}
        {rosetteLines.map((l) => (
          <p key={l} className="text-sm font-medium mt-1">{l}</p>
        ))}
        {countLine && <p className="text-sm text-muted mt-1">{countLine}</p>}
        {danceName && <p className="text-xs text-muted mt-2">{danceName}</p>}
        {error && <p className="text-sm text-accent-deep mt-2">⚠ {error}</p>}
        <div className="mt-4 space-y-2">
          <button
            onClick={done}
            disabled={isPending}
            className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
          >
            Done for today
          </button>
          <button
            onClick={onDanceAgain}
            disabled={isPending}
            className="w-full h-14 rounded-2xl border border-line bg-surface font-semibold"
          >
            Dance again
          </button>
        </div>
      </div>
    </div>
  );
}
