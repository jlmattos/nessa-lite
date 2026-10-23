"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
import { playDone, playFinish, playStart } from "@/lib/sound";
import { useDancePlayer } from "@/lib/dance-player";
import type { MoveKey } from "@/lib/dance-content";

/**
 * Today (GAME-DESIGN.md §3.0–§3.4, §3.10). The schedule strip shows the whole
 * plan with the dance at the end, before and during the workout. One step is
 * current at a time, with the one big Done button; the others stay compact
 * and can be made current with a tap, so any order still works. Finish asks
 * once, then the slipper (or the Recital star) becomes what is next.
 */
export function TodayView({ data }: { data: TodayData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [flexSignal, setFlexSignal] = useState(0);
  const [pickRoutine, setPickRoutine] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const calm = data.settings.reducedMotion;
  const sound = data.settings.sound;
  const stage = data.stage;
  const recitalDay = stage?.programLine.isRecitalDay ?? false;
  const danceWord = recitalDay ? "Recital" : "Dance";
  const danceIcon = recitalDay ? <RecitalStar /> : "🩰";

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

  function start(routineId: string) {
    if (sound) playStart(); // the Start tap also wakes the audio for the chimes to come
    run(() => startWorkout(routineId));
  }

  // ── No workout yet: the plan, then the Start card ──
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
    const upcoming = data.suggestedRoutine?.movements ?? [];
    const planItems: StripItem[] = [
      ...upcoming.map((m, i) => ({
        key: m.movementId,
        icon: m.icon,
        label: String(i + 1),
        state: (i === 0 ? "now" : "later") as StripItem["state"],
        ariaLabel: `Step ${i + 1}: ${m.name}`,
      })),
      { key: "stage", icon: danceIcon, label: danceWord, state: "later", final: true, big: recitalDay },
    ];
    return (
      <div className="space-y-3">
        <CatUnlock earned={data.earnedCats} />
        {error && <ErrorCard message={error} onDismiss={() => setError(null)} />}
        {data.suggestedRoutine && !pickRoutine && upcoming.length > 0 && (
          <ScheduleStrip
            title="Today’s plan"
            items={planItems}
            line={
              <>
                Now: <span className="font-semibold">{upcoming[0].name}</span>
                <span className="text-muted"> · then: {upcoming[1]?.name ?? danceWord}</span>
              </>
            }
          />
        )}
        {stage && <ProgramLineView line={stage.programLine} />}
        {data.suggestedRoutine && !pickRoutine && (
          <Card className="text-center py-8 px-6">
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">Up next</p>
            <p className="text-2xl font-bold mt-1">{data.suggestedRoutine.name}</p>
            <p className="text-sm text-muted mt-1">
              {data.suggestedRoutine.movementCount} movement{data.suggestedRoutine.movementCount !== 1 ? "s" : ""}, then {recitalDay ? "the recital" : "a dance"} with Pirouette{" "}
              {recitalDay ? <RecitalStar size={16} className="align-[-2px]" /> : "🩰"}
            </p>
            <button
              onClick={() => start(data.suggestedRoutine!.id)}
              disabled={isPending}
              className="mt-5 w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
            >
              Start →
            </button>
            <button onClick={() => setPickRoutine(true)} className="mt-2 min-h-11 px-4 inline-flex items-center text-sm text-muted">
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
                onClick={() => start(r.id)}
                disabled={isPending}
                className="w-full h-14 rounded-xl border border-line bg-surface font-medium text-lg active:bg-accent-soft transition-colors"
              >
                {r.name}
              </button>
            ))}
            {pickRoutine && (
              <button onClick={() => setPickRoutine(false)} className="w-full min-h-11 text-sm text-muted">
                Back
              </button>
            )}
          </Card>
        )}
      </div>
    );
  }

  // ── Active workout: the visual schedule ──
  const total = data.movements.length;
  const done = data.movements.filter((m) => m.completion).length;
  const completed = !!data.workout.completedAt;
  const closed = !!stage?.closed;
  const waiting = completed && !!stage?.waiting;
  // The current step: the one she tapped, if it is still to do; otherwise the first one to do.
  const focusIdx = data.movements.findIndex((m) => m.movementId === focusId && !m.completion);
  const currentIdx = completed ? -1 : focusIdx >= 0 ? focusIdx : data.movements.findIndex((m) => !m.completion);
  const current = currentIdx >= 0 ? data.movements[currentIdx] : null;
  const next = current
    ? data.movements.find((m, i) => i !== currentIdx && !m.completion && (i > currentIdx || focusIdx >= 0)) ?? null
    : null;
  const allChecked = total > 0 && done === total;

  // The last step is the stage: outline until the workout is finished, ringed while she has not danced, dotted after.
  const finalState: StripItem["state"] = !completed ? "later" : waiting ? "now" : "done";
  const items: StripItem[] = [
    ...data.movements.map((m, i) => ({
      key: m.movementId,
      icon: m.icon,
      label: String(i + 1),
      state: (m.completion ? "done" : i === currentIdx ? "now" : "later") as StripItem["state"],
      ariaLabel: `Step ${i + 1}: ${m.name}${m.completion ? ", done" : i === currentIdx ? ", now" : ""}`,
    })),
    {
      key: "stage",
      icon: danceIcon,
      label: danceWord,
      state: finalState,
      final: true,
      big: recitalDay,
      ariaLabel: recitalDay ? "Last: the recital with Pirouette" : "Last: a dance with Pirouette",
    },
  ];
  const line = closed ? (
    <>Today is done.</>
  ) : completed ? (
    waiting ? <>Now: <span className="font-semibold">{danceWord}</span></> : <>Workout done.</>
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
        <Card className="p-4 border-success/50 bg-success-soft space-y-3">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <EndingPirouette
                costume={stage?.costume ?? "classic"}
                // On a move day she performs the new move once when the card appears (§3.4); calm mode keeps her still.
                newMove={!closed && !calm ? stage?.newMove ?? null : null}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-success text-lg">{closed ? "Today is done." : "Workout done."}</p>
              {!closed && stage?.newToday && <p className="text-xs font-medium mt-0.5">{stage.newToday}</p>}
              {closed && <p className="text-xs text-muted mt-0.5">The stage is closed for today. See you next time. 🐾</p>}
            </div>
            {!closed && (
              <button
                onClick={() => run(() => reopenWorkout(data.workout!.id))}
                disabled={isPending}
                className="min-h-11 px-2 text-xs text-muted underline shrink-0"
              >
                Reopen workout
              </button>
            )}
          </div>
          {!closed && (
            <Link
              href="/dance"
              className="block w-full h-14 rounded-2xl bg-accent text-white text-lg font-semibold text-center leading-[3.5rem] shadow-sm"
            >
              Go to the stage →
            </Link>
          )}
        </Card>
      )}

      {data.movements.map((m, i) => (
        <MovementCard
          key={m.movementId}
          index={i + 1}
          m={m}
          isCurrent={i === currentIdx}
          locked={completed}
          busy={isPending}
          onFocus={() => setFocusId(m.movementId)}
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
              className="w-full h-16 rounded-2xl bg-success text-white text-xl font-semibold shadow-sm"
            >
              ✓ Finish workout
            </button>
          ) : (
            <Card className="p-4 space-y-3">
              <p className="text-sm text-center">Finish today’s workout?</p>
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
          className="w-full min-h-11 text-center text-xs text-muted underline"
        >
          Started by mistake? Cancel this workout
        </button>
      )}
    </div>
  );
}

/** The ending card's Pirouette: static, except one silent performance of today's new move. */
function EndingPirouette({ costume, newMove }: { costume: string; newMove: MoveKey | null }) {
  const rig = useRef<HTMLDivElement>(null);
  // Silent: the card appears without a tap, and sound only ever follows a tap.
  const { playMove } = useDancePlayer(rig, { sound: false });
  const played = useRef(false);
  useEffect(() => {
    if (!newMove || played.current) return;
    played.current = true;
    playMove(newMove);
  }, [newMove, playMove]);
  return <Pirouette ref={rig} size={56} costume={costume} />;
}

function MovementCard({
  index, m, isCurrent, locked, busy, onFocus, onDone, onUndo,
}: {
  index: number;
  m: TodayMovement;
  isCurrent: boolean;
  locked: boolean;
  busy: boolean;
  onFocus: () => void;
  onDone: () => void;
  onUndo: () => void;
}) {
  const isDone = !!m.completion;

  // Done: the check, and a one-tap undo with a full-size target.
  if (isDone) {
    return (
      <Card className="border-success/50 bg-success-soft/40">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-3xl w-12 text-center shrink-0" aria-hidden>{m.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Step {index}</p>
            <p className="font-semibold text-lg leading-tight text-success">{m.name}</p>
          </div>
          <span className="text-3xl" role="img" aria-label="Done">✅</span>
          {!locked && (
            <button
              onClick={onUndo}
              disabled={busy}
              className="min-h-11 min-w-11 px-3 inline-flex items-center justify-center text-sm text-muted underline shrink-0"
            >
              undo
            </button>
          )}
        </div>
      </Card>
    );
  }

  // Not current: compact. A tap makes it the current step.
  if (!isCurrent || locked) {
    return (
      <button
        onClick={locked ? undefined : onFocus}
        disabled={locked}
        aria-label={`Step ${index}: ${m.name}, ${targetLabel(m.targetReps, m.targetSecs)}`}
        className="w-full text-left rounded-[1.25rem] bg-surface border border-line shadow-[0_1px_3px_rgba(61,52,54,0.06)]"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-2xl w-12 text-center shrink-0" aria-hidden>{m.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Step {index}</p>
            <p className="font-semibold leading-tight">{m.name}</p>
          </div>
          <p className="text-sm text-muted shrink-0">{targetLabel(m.targetReps, m.targetSecs)}</p>
        </div>
      </button>
    );
  }

  // The current step: big, with its cue and the one Done button.
  return (
    <Card className="border-accent/60 ring-2 ring-accent/30">
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="text-4xl w-12 text-center shrink-0" aria-hidden>{m.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted">Step {index} · now</p>
          <p className="font-semibold text-xl leading-tight">{m.name}</p>
          <p className="text-sm text-muted mt-0.5">{targetLabel(m.targetReps, m.targetSecs)}</p>
          {m.cue && <p className="text-xs text-muted/80 mt-1 leading-relaxed">{m.cue}</p>}
        </div>
        <button
          onClick={onDone}
          disabled={busy}
          className="shrink-0 h-16 px-6 rounded-2xl bg-accent text-white text-lg font-semibold shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          Done ✓
        </button>
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
        <button onClick={onDismiss} className="min-h-11 px-2 text-xs text-accent-deep/70 shrink-0">Dismiss</button>
      </div>
    </Card>
  );
}
