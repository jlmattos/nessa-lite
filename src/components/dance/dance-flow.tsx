"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StageData, Look, PerformancePlan } from "@/actions/dance";
import { openCurtains } from "@/actions/dance";
import { ScheduleStrip, RecitalStar, type StripItem, type StripState } from "@/components/schedule-strip";
import { Pirouette } from "@/components/dance/pirouette";
import { StageBox } from "@/components/dance/stage";
import { GetReady } from "@/components/dance/get-ready";
import { ChooseDance } from "@/components/dance/choose-dance";
import { Performance } from "@/components/dance/performance";
import { Bow } from "@/components/dance/bow";
import { ProgramLineView } from "@/components/program-line";

type Step = "get_ready" | "choose" | "dance" | "bow";
const STEPS: Step[] = ["get_ready", "choose", "dance", "bow"];
const STEP_NAME: Record<Step, string> = { get_ready: "Get ready", choose: "Choose a dance", dance: "Dance", bow: "Bow" };

/**
 * The stage session (GAME-DESIGN.md §3.5–§3.11): one fixed four-step strip,
 * the same every evening. Locked until today's workout is finished; closed
 * after "Done for today" until "Open the curtains".
 */
export function DanceFlow({ data }: { data: StageData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("get_ready");
  const [look, setLookState] = useState<Look>(data.look);
  const [danceId, setDanceId] = useState<string | null>(data.lastDanceId);
  const [plan, setPlan] = useState<PerformancePlan | null>(null);
  const [replay, setReplay] = useState<PerformancePlan | null>(null);
  const [dancedThisVisit, setDancedThisVisit] = useState(false);
  const recitalDay = data.programLine.isRecitalDay;

  const onBow = useCallback((p: PerformancePlan) => {
    setPlan(p);
    setDancedThisVisit(true);
    setStep("bow");
  }, []);

  if (!data.unlocked) {
    return (
      <div className="space-y-3">
        <StageBox stageKey={look.stage} curtains="closed" decorations={data.decorations}>
          <Pirouette size={150} costume={look.costume} dancing={!data.settings.reducedMotion} />
        </StageBox>
        <div className="rounded-[1.25rem] bg-surface border border-line p-4">
          <p className="font-semibold">Pirouette is resting 💤</p>
          <p className="text-sm text-muted mt-1">Finish today’s workout. Then Pirouette dances.</p>
          <Link href="/" className="mt-4 block w-full h-14 rounded-2xl border border-line bg-surface text-center leading-[3.5rem] font-semibold">
            Go to today’s workout →
          </Link>
        </div>
        <ProgramLineView line={data.programLine} />
      </div>
    );
  }

  if (data.closed) {
    return (
      <div className="space-y-3">
        <StageBox stageKey={look.stage} curtains="closed" decorations={data.decorations}>
          <Pirouette size={150} costume={look.costume} />
        </StageBox>
        <div className="rounded-[1.25rem] bg-surface border border-line p-4 text-center">
          <p className="font-semibold text-lg">The stage is closed for today.</p>
          <button
            onClick={() => startTransition(async () => { await openCurtains(); router.refresh(); })}
            disabled={isPending}
            className="mt-3 text-sm text-muted underline disabled:opacity-60"
          >
            Open the curtains
          </button>
        </div>
        <ProgramLineView line={data.programLine} />
      </div>
    );
  }

  const idx = STEPS.indexOf(step);
  const dancedDots = data.dancedToday || dancedThisVisit;
  const items: StripItem[] = STEPS.map((s, i) => {
    let state: StripState = i < idx ? "done" : i === idx ? "now" : "later";
    if (state === "later" && dancedDots && (s === "dance" || s === "bow")) state = "done";
    const isDance = s === "dance";
    return {
      key: s,
      icon: s === "get_ready" ? "👗" : s === "choose" ? "🎼" : isDance ? (recitalDay ? <RecitalStar /> : "🩰") : "👏",
      label: isDance && recitalDay ? "Recital" : STEP_NAME[s],
      state,
      big: isDance && recitalDay,
    };
  });
  const next = STEPS[idx + 1];
  const line = (
    <>
      Now: <span className="font-semibold">{step === "dance" && recitalDay ? "Recital" : STEP_NAME[step]}</span>
      {next && <span className="text-muted"> · then: {next === "dance" && recitalDay ? "Recital" : STEP_NAME[next]}</span>}
    </>
  );

  return (
    <div className="space-y-3">
      <ScheduleStrip title="Tonight on the stage" items={items} line={line} />

      {step === "get_ready" && (
        <GetReady
          data={data}
          look={look}
          onLook={(patch) => setLookState((l) => ({ ...l, ...patch }))}
          onNext={() => setStep("choose")}
        />
      )}
      {step === "choose" && (
        <ChooseDance
          data={data}
          costume={look.costume}
          selectedId={danceId}
          onSelect={setDanceId}
          onNext={() => { setReplay(null); setStep("dance"); }}
        />
      )}
      {step === "dance" && (
        <Performance data={data} look={look} danceId={danceId} replay={replay} onBow={onBow} />
      )}
      {step === "bow" && plan && (
        <Bow
          data={data}
          look={look}
          plan={plan}
          onDanceAgain={() => { setReplay(plan); setStep("dance"); }}
        />
      )}
    </div>
  );
}
