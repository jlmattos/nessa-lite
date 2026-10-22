"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TodayData, TodayMovement } from "@/actions/workouts";
import {
  startWorkout, completeMovement, undoCompletion, finishWorkout, reopenWorkout, cancelWorkout,
} from "@/actions/workouts";
import { SetFlexToast, CatUnlock } from "@/components/cats";
import { Pirouette } from "@/components/dance/pirouette";
import { ScheduleStrip, RecitalStar, type StripItem } from "@/components/schedule-strip";
import { ProgramLineView } from "@/components/program-line";
import { targetLabel } from "@/lib/format";
import { playDone, playFinish } from "@/lib/sound";

export function TodayView({ data }: { data: TodayData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [flexSignal, setFlexSignal] = useState(0);
  const [pickRoutine, setPickRoutine] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const calm = data.settings.reducedMotion;
  const sound = data.settings.sound;
  const stage = data.stage;
  const recitalDay = stage?.programLine.isRecitalDay ?? false;
  const danceWord = recitalDay ? "Recital" : "Dance";

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong — try again.");
      }
    });
  }

  // ── No workout yet: the start card ──
  if (!data.workout) {
    if (!data.hasRoutine) {
      return (
        <Card className="text-center py-10 px-6">
          <p className="text-3xl mb-2">🗓️</p>
          <p className="font-semibold text-lg">Let’s set up a routine first</p>
          <p className="text-muted text-sm mt-1">
            Add a few movements in the Routine tab — then this screen will always know what’s next.
          </p>
        </Card>
      );
    }
    return (
      <div className="space-y-3">
        <CatUnlock earned={data.earnedCats} />
        {error && <ErrorCard message={error} onDismiss={() => setError(null)} />}
        {data.suggestedRoutine && !pickRoutine && (
          <Card className="text-center py-8 px-6">
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">Up next</p>
            <p className="text-2xl font-bold mt-1">{data.suggestedRoutine.name}</p>
            <p className="text-sm text-muted mt-1">
              {data.suggestedRoutine.movementCount} movement{data.suggestedRoutine.movementCount !== 1 ? "s" : ""}, then {recitalDay ? "a recital" : "a dance"} with Pirouette 🩰
            </p>
            <button
              onClick={() => run(() => startWorkout(data.suggestedRoutine!.id))}
              disabled={isPending}
              className="mt-5 w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
            >
              Start →
            </button>
            <button onClick={() => setPickRoutine(true)} className="mt-3 text-sm text-muted">
              Do a different one instead
            </button>
          </Card>
        )}
        {(pickRoutine || !data.suggestedRoutine) && (
          <Card className="p-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted font-semibold px-1">Pick a routine</p>
            {data.allRoutines.map((r) => (
              <button
                key={r.id}
                onClick={() => run(() => startWorkout(r.id))}
                disabled={isPending}
                className="w-full h-14 rounded-xl border border-line bg-surface font-medium text-lg active:bg-accent-soft transition-colors"
              >
                {r.name}
              </button>
            ))}
            {pickRoutine && (
              <button onClick={() => setPickRoutine(false)} className="w-full text-sm text-muted pt-1">
                Back
              </button>
            )}
          </Card>
        )}
        {stage && <ProgramLineView line={stage.programLine} />}
      </div>
    );
  }

  // ── Active workout: the visual schedule ──
  const total = data.movements.length;
  const done = data.movements.filter((m) => m.completion).length;
  const completed = !!data.workout.completedAt;
  const closed = !!stage?.closed;
  const currentIdx = data.movements.findIndex((m) => !m.completion);
  const current = currentIdx >= 0 ? data.movements[currentIdx] : null;
  const next = currentIdx >= 0 ? data.movements.slice(currentIdx + 1).find((m) => !m.completion) ?? null : null;
  const allChecked = total > 0 && done === total;

  // The last step is the stage: outline until the workout is finished, ringed while she has not danced, dotted after.
  const finalState = !completed ? "later" : stage?.waiting ? "now" : "done";
  const items: StripItem[] = [
    ...data.movements.map((m, i) => ({
      key: m.movementId,
      icon: m.icon,
      label: String(i + 1),
      state: (m.completion ? "done" : i === currentIdx && !completed ? "now" : "later") as StripItem["state"],
      ariaLabel: `Step ${i + 1}: ${m.name}${m.completion ? ", done" : i === currentIdx && !completed ? ", now" : ""}`,
    })),
    {
      key: "stage",
      icon: recitalDay ? <RecitalStar /> : "🩰",
      label: recitalDay ? "Recital" : "dance",
      state: finalState,
      final: true,
      big: recitalDay,
      keepIconWhenDone: true,
      ariaLabel: recitalDay ? "Last: the recital with Pirouette" : "Last: a dance with Pirouette",
    },
  ];
  const line = completed ? (
    closed ? <>Today is done.</> : <>All done — Pirouette is ready on the stage.</>
  ) : current ? (
    <>
      Now: <span className="font-semibold">{current.name}</span>
      <span className="text-muted"> · then: {next ? next.name : danceWord}</span>
    </>
  ) : total === 0 ? (
    <span className="text-muted">This routine has no movements yet — add some in the Routine tab.</span>
  ) : (
    <>Everything is checked — tap <span className="font-semibold">Finish</span> below.</>
  );

  return (
    <div className="space-y-3">
      <CatUnlock earned={data.earnedCats} />
      {!calm && <SetFlexToast signal={flexSignal} />}
      {error && <ErrorCard message={error} onDismiss={() => setError(null)} />}

      <ScheduleStrip title="Today’s plan" items={items} line={line} />
      {stage && <ProgramLineView line={stage.programLine} />}

      {completed && (
        <Card className="p-4 border-success/50 bg-success-soft flex items-center gap-4">
          <div className={calm || closed ? "shrink-0" : "shrink-0 animate-lite-hop"}>
            <Pirouette size={56} costume={stage?.costume ?? "classic"} dancing={!calm && !closed} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-success text-lg">{closed ? "Today is done." : "Workout done."}</p>
            {!closed && stage?.newToday && <p className="text-xs font-medium mt-0.5">{stage.newToday}</p>}
            {!closed && (
              <Link
                href="/dance"
                className="inline-block mt-2 rounded-xl bg-accent text-white text-sm font-semibold px-4 py-2.5"
              >
                Go to the stage →
              </Link>
            )}
            {closed && <p className="text-xs text-muted mt-0.5">The stage is closed for today. See you next time. 🐾</p>}
          </div>
          <button
            onClick={() => run(() => reopenWorkout(data.workout!.id))}
            disabled={isPending}
            className="text-xs text-muted underline shrink-0"
          >
            Reopen
          </button>
        </Card>
      )}

      {data.movements.map((m, i) => (
        <MovementCard
          key={m.movementId}
          index={i + 1}
          m={m}
          isCurrent={i === currentIdx && !completed}
          locked={completed}
          busy={isPending}
          onDone={() => {
            if (sound) playDone();
            setFlexSignal((n) => n + 1);
            run(() => completeMovement(data.workout!.id, m.movementId, m.targetReps, m.targetSecs));
          }}
          onUndo={() => run(() => undoCompletion(m.completion!.id))}
        />
      ))}

      {!completed && done > 0 && (
        <div className="pt-1">
          {!confirmFinish ? (
            <button
              onClick={() => setConfirmFinish(true)}
              className={`w-full h-16 rounded-2xl text-white text-xl font-semibold shadow-sm ${
                allChecked ? "bg-success" : "bg-success/80"
              }`}
            >
              ✓ Finish workout
            </button>
          ) : (
            <Card className="p-4 space-y-3">
              <p className="text-sm text-center">
                {allChecked ? "Finish today’s workout?" : `${total - done} step${total - done !== 1 ? "s" : ""} left — finish anyway?`}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmFinish(false)} className="flex-1 h-14 rounded-xl border border-line font-medium">
                  Not yet
                </button>
                <button
                  onClick={() => {
                    if (sound) playFinish();
                    run(async () => {
                      await finishWorkout(data.workout!.id);
                      setConfirmFinish(false);
                    });
                  }}
                  disabled={isPending}
                  className="flex-1 h-14 rounded-xl bg-success text-white font-semibold"
                >
                  Finish
                </button>
              </div>
            </Card>
          )}
        </div>
      )}

      {!completed && done === 0 && (
        <button
          onClick={() => run(() => cancelWorkout(data.workout!.id))}
          disabled={isPending}
          className="w-full text-center text-xs text-muted underline pt-2"
        >
          Started by mistake? Cancel this workout
        </button>
      )}
    </div>
  );
}

function MovementCard({
  index, m, isCurrent, locked, busy, onDone, onUndo,
}: {
  index: number;
  m: TodayMovement;
  isCurrent: boolean;
  locked: boolean;
  busy: boolean;
  onDone: () => void;
  onUndo: () => void;
}) {
  const isDone = !!m.completion;
  return (
    <Card
      className={
        isDone ? "border-success/50 bg-success-soft/40" : isCurrent ? "border-accent/60 ring-2 ring-accent/30" : ""
      }
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="text-4xl w-12 text-center shrink-0" aria-hidden>{m.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted">Step {index}{isCurrent ? " · now" : ""}</p>
          <p className={`font-semibold text-xl leading-tight ${isDone ? "text-success" : ""}`}>{m.name}</p>
          <p className="text-sm text-muted mt-0.5">{targetLabel(m.targetReps, m.targetSecs)}</p>
          {m.cue && !isDone && <p className="text-xs text-muted/80 mt-1 leading-relaxed">{m.cue}</p>}
        </div>
        {isDone ? (
          <div className="text-right shrink-0">
            <span className="text-3xl" role="img" aria-label="Done">✅</span>
            {!locked && (
              <button onClick={onUndo} disabled={busy} className="block text-xs text-muted underline mt-1 ml-auto">
                undo
              </button>
            )}
          </div>
        ) : (
          !locked && (
            <button
              onClick={onDone}
              disabled={busy}
              className="shrink-0 h-16 px-6 rounded-2xl bg-accent text-white text-lg font-semibold shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              Done ✓
            </button>
          )
        )}
      </div>
    </Card>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.25rem] bg-surface border border-line shadow-[0_1px_3px_rgba(61,52,54,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function ErrorCard({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <Card className="p-3 border-accent-deep/40 bg-accent-soft">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-accent-deep">⚠ {message}</p>
        <button onClick={onDismiss} className="text-xs text-accent-deep/70 shrink-0">Dismiss</button>
      </div>
    </Card>
  );
}
