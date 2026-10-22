"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StageData, Look, PerformancePlan } from "@/actions/dance";
import { closeCurtains } from "@/actions/dance";
import { Pirouette } from "@/components/dance/pirouette";
import { StageBox } from "@/components/dance/stage";
import { FigurineCat } from "@/components/cats";

/**
 * Step 4 (GAME-DESIGN.md §3.9, §3.10). "The end.", where she is in the
 * Program, then two buttons: Done for today (persisted) and Dance again
 * (replays exactly what just played; nothing more is written).
 */
export function Bow({
  data,
  look,
  plan,
  onDanceAgain,
}: {
  data: StageData;
  look: Look;
  plan: PerformancePlan;
  onDanceAgain: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const calm = data.settings.reducedMotion;

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
      <StageBox stageKey={look.stage} curtains="closed" decorations={data.decorations}>
        <div className={calm ? "" : "animate-lite-hop"}>
          <Pirouette size={150} costume={look.costume} />
        </div>
      </StageBox>

      {data.earnedCats.length > 0 && (
        <div className="flex justify-center gap-1 -mt-1" aria-label="Your cat friends in the front row">
          {data.earnedCats.slice(0, 10).map((c) => (
            <FigurineCat key={c} variant={c} size={30} />
          ))}
        </div>
      )}

      <div className="rounded-[1.25rem] bg-surface border border-line p-5 text-center">
        <p className="text-2xl font-bold">The end.</p>
        <p className="text-sm text-muted mt-1">{data.programLine.text}</p>
        <p className="text-xs text-muted mt-2">{plan.dance.name}</p>
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
