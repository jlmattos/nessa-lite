"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StageData, Look, PerformancePlan } from "@/actions/dance";
import { closeCurtains } from "@/actions/dance";
import { Pirouette } from "@/components/dance/pirouette";
import { StageBox, type CurtainState } from "@/components/dance/stage";
import { FigurineCat } from "@/components/cats";

/**
 * Step 4 (GAME-DESIGN.md §3.9, §3.10). The curtains close, the cat friends in
 * the front row clap (one hop each), "The end.", where she is in the Program
 * (or "Recital N complete." and what is new on the stage), then two buttons:
 * Done for today (persisted) and Dance again (replays exactly what just
 * played; nothing more is written). Posters arrive in Phase 2.
 */
export function Bow({
  data,
  look,
  plan,
  decorations,
  newDecorations,
  onDanceAgain,
}: {
  data: StageData;
  look: Look;
  plan: PerformancePlan;
  /** Everything on the stage now, including what tonight's recital added. */
  decorations: string[];
  /** Names of the decorations tonight's recital added, for the one announcement. */
  newDecorations: string[];
  onDanceAgain: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const calm = data.settings.reducedMotion;
  // The curtains close over 3 s as the Bow opens; in calm mode they are simply closed.
  const curtains: CurtainState = calm ? "closed" : "closing";
  // What just played decides the line, not the text computed before the dance.
  const line = plan.recital ? `Recital ${plan.recital.program} complete.` : data.programLine.text;
  // On recital day the recital was the show; on other evenings name the dance she chose.
  const danceName = plan.recital?.onTime ? null : plan.dance.name;

  function done() {
    setError(null);
    startTransition(async () => {
      try {
        await closeCurtains();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t work — try again.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <StageBox stageKey={look.stage} curtains={curtains} decorations={decorations}>
        <Pirouette size={150} costume={look.costume} />
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
        {newDecorations.length > 0 && (
          <p className="text-sm font-medium mt-1">New on the stage: {newDecorations.join(" · ")}</p>
        )}
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
