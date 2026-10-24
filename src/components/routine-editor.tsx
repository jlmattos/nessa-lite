"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Routine, RoutineMovement } from "@/actions/routine";
import {
  addRoutine, renameRoutine, deleteRoutine, moveRoutine,
  addMovementToRoutine, updateRoutineMovement, removeRoutineMovement, moveRoutineMovement,
} from "@/actions/routine";
import { NumberInput } from "@/components/number-input";
import { targetLabel } from "@/lib/format";
import { unwrap } from "@/lib/action-result";

type Run = (fn: () => Promise<void>) => void;

// Pickable icons for a movement card. Keep the set small and consistent.
const ICONS = ["⭐", "🤸", "🧘", "🏃", "🩰", "💪", "🦵", "🙆", "🪑", "🐾", "🎵", "🌟"];

// Friendly starter suggestions — suggestions only; Jose decides the routine.
const STARTERS = [
  "March in place", "Arm circles", "Wall push-ups", "Sit-to-stand", "Balance on one foot",
  "Toe touches", "Plié squats", "Relevés (tiptoes)", "Stretch and reach", "Jumping jacks",
];

export function RoutineEditor({ routines }: { routines: Routine[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const run: Run = (fn) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-accent-deep/40 bg-accent-soft p-3">
          <p className="text-sm text-accent-deep">⚠ {error}</p>
        </div>
      )}

      {routines.length === 0 && !adding && (
        <div className="rounded-[1.25rem] bg-surface border border-line text-center py-10 px-6">
          <p className="text-3xl mb-2">🌱</p>
          <p className="font-semibold text-lg">Build a routine</p>
          <p className="text-sm text-muted mt-1">
            A routine is a short list of movements Nessa does in order — like “Dance warm-up” or
            “Strong legs”. The app rotates through them so she always knows what’s next.
          </p>
        </div>
      )}

      {routines.map((routine, i) => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          isFirst={i === 0}
          isLast={i === routines.length - 1}
          busy={isPending}
          run={run}
        />
      ))}

      {adding ? (
        <div className="rounded-[1.25rem] bg-surface border border-line p-4 space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Routine name — e.g. Dance warm-up"
            autoFocus
            className="w-full h-12 rounded-xl border border-line bg-background px-4 font-medium focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setAdding(false); setNewName(""); }}
              className="flex-1 h-12 rounded-xl border border-line font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => run(async () => { unwrap(await addRoutine(newName)); setAdding(false); setNewName(""); })}
              disabled={isPending || !newName.trim()}
              className="flex-1 h-12 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
            >
              Add routine
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full h-14 rounded-2xl border-2 border-dashed border-line text-muted font-medium"
        >
          + Add a routine
        </button>
      )}
    </div>
  );
}

function RoutineCard({
  routine, isFirst, isLast, busy, run,
}: {
  routine: Routine; isFirst: boolean; isLast: boolean; busy: boolean; run: Run;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(routine.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adding, setAdding] = useState(false);

  function saveName() {
    setEditingName(false);
    if (name.trim() && name.trim() !== routine.name) run(async () => { unwrap(await renameRoutine(routine.id, name)); });
    else setName(routine.name);
  }

  return (
    <div className="rounded-[1.25rem] bg-surface border border-line overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line/70">
        {editingName ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
            autoFocus
            className="flex-1 h-10 rounded-lg border border-line bg-background px-3 font-bold focus:outline-none focus:border-accent"
          />
        ) : (
          <button onClick={() => setEditingName(true)} className="flex-1 text-left font-bold text-lg truncate">
            {routine.name}
          </button>
        )}
        <button onClick={() => run(async () => { unwrap(await moveRoutine(routine.id, -1)); })} disabled={busy || isFirst} aria-label="Move up" className="w-9 h-9 rounded-lg text-muted disabled:opacity-30">↑</button>
        <button onClick={() => run(async () => { unwrap(await moveRoutine(routine.id, 1)); })} disabled={busy || isLast} aria-label="Move down" className="w-9 h-9 rounded-lg text-muted disabled:opacity-30">↓</button>
        {confirmDelete ? (
          <span className="flex items-center gap-1 text-xs">
            <button onClick={() => run(async () => { unwrap(await deleteRoutine(routine.id)); })} disabled={busy} className="text-accent-deep font-medium px-2 py-1">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="text-muted px-2 py-1">Keep</button>
          </span>
        ) : (
          <button onClick={() => setConfirmDelete(true)} aria-label={`Delete ${routine.name}`} className="w-9 h-9 rounded-lg text-muted/60">✕</button>
        )}
      </div>

      <div className="divide-y divide-line/70">
        {routine.movements.map((m, i) => (
          <MovementRow
            key={m.id}
            m={m}
            index={i + 1}
            isFirst={i === 0}
            isLast={i === routine.movements.length - 1}
            busy={busy}
            run={run}
          />
        ))}
        {routine.movements.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted">No movements yet.</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-line/70">
        {adding ? (
          <AddMovementForm routineId={routine.id} busy={busy} run={run} onClose={() => setAdding(false)} />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full h-11 rounded-xl border-2 border-dashed border-line text-muted text-sm font-medium"
          >
            + Add a movement
          </button>
        )}
      </div>
    </div>
  );
}

function MovementRow({
  m, index, isFirst, isLast, busy, run,
}: {
  m: RoutineMovement; index: number; isFirst: boolean; isLast: boolean; busy: boolean; run: Run;
}) {
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState(m.targetReps != null ? String(m.targetReps) : "");
  const [secs, setSecs] = useState(m.targetSecs != null ? String(m.targetSecs) : "");
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-2xl w-9 text-center shrink-0" aria-hidden>{m.icon}</span>
        <button onClick={() => setEditing((v) => !v)} className="flex-1 text-left min-w-0">
          <p className="font-medium truncate">{index}. {m.name}</p>
          <p className="text-xs text-muted">{targetLabel(m.targetReps, m.targetSecs)}{m.cue ? ` · ${m.cue}` : ""}</p>
        </button>
        <button onClick={() => run(async () => { unwrap(await moveRoutineMovement(m.id, -1)); })} disabled={busy || isFirst} aria-label="Move up" className="w-9 h-9 rounded-lg text-muted disabled:opacity-30">↑</button>
        <button onClick={() => run(async () => { unwrap(await moveRoutineMovement(m.id, 1)); })} disabled={busy || isLast} aria-label="Move down" className="w-9 h-9 rounded-lg text-muted disabled:opacity-30">↓</button>
        {confirmRemove ? (
          <span className="flex items-center gap-1 text-xs">
            <button onClick={() => run(async () => { unwrap(await removeRoutineMovement(m.id)); })} disabled={busy} className="text-accent-deep font-medium px-2 py-1">Remove</button>
            <button onClick={() => setConfirmRemove(false)} className="text-muted px-2 py-1">Keep</button>
          </span>
        ) : (
          <button onClick={() => setConfirmRemove(true)} aria-label={`Remove ${m.name}`} className="w-9 h-9 rounded-lg text-muted/60">✕</button>
        )}
      </div>
      {editing && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted font-medium mb-1 pl-1">How many times</p>
              <NumberInput value={reps} onChange={(v) => { setReps(v); if (v) setSecs(""); }} inputMode="numeric" placeholder="10" />
            </div>
            <div>
              <p className="text-xs text-muted font-medium mb-1 pl-1">or how many seconds</p>
              <NumberInput value={secs} onChange={(v) => { setSecs(v); if (v) setReps(""); }} inputMode="numeric" placeholder="30" />
            </div>
          </div>
          <p className="text-xs text-muted">Leave both blank for “until it feels done”.</p>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 h-11 rounded-xl border border-line font-medium">Cancel</button>
            <button
              onClick={() => run(async () => {
                unwrap(await updateRoutineMovement(m.id, parseInt(reps) || null, parseInt(secs) || null));
                setEditing(false);
              })}
              disabled={busy}
              className="flex-1 h-11 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddMovementForm({
  routineId, busy, run, onClose,
}: {
  routineId: string; busy: boolean; run: Run; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [cue, setCue] = useState("");
  const [reps, setReps] = useState("10");
  const [secs, setSecs] = useState("");

  const suggestions = STARTERS.filter((s) => !name || s.toLowerCase().includes(name.toLowerCase())).slice(0, 6);

  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Movement name — e.g. Arm circles"
        autoFocus
        className="w-full h-12 rounded-xl border border-line bg-background px-4 font-medium focus:outline-none focus:border-accent"
      />
      {suggestions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setName(s)} className="text-xs rounded-full border border-line px-3 py-1.5 text-muted">
              {s}
            </button>
          ))}
        </div>
      )}
      <div>
        <p className="text-xs text-muted font-medium mb-1 pl-1">Picture</p>
        <div className="flex gap-1.5 flex-wrap">
          {ICONS.map((i) => (
            <button
              key={i}
              onClick={() => setIcon(i)}
              aria-label={`Icon ${i}`}
              aria-pressed={icon === i}
              className={`w-11 h-11 rounded-xl text-2xl border ${icon === i ? "bg-accent-soft border-accent" : "border-line"}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted font-medium mb-1 pl-1">How many times</p>
          <NumberInput value={reps} onChange={(v) => { setReps(v); if (v) setSecs(""); }} inputMode="numeric" placeholder="10" />
        </div>
        <div>
          <p className="text-xs text-muted font-medium mb-1 pl-1">or how many seconds</p>
          <NumberInput value={secs} onChange={(v) => { setSecs(v); if (v) setReps(""); }} inputMode="numeric" placeholder="30" />
        </div>
      </div>
      <input
        value={cue}
        onChange={(e) => setCue(e.target.value)}
        placeholder="A little reminder (optional) — e.g. slow and gentle"
        className="w-full h-12 rounded-xl border border-line bg-background px-4 text-sm focus:outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-line font-medium">Cancel</button>
        <button
          onClick={() => run(async () => {
            unwrap(await addMovementToRoutine(routineId, name, icon, cue.trim() || null, parseInt(reps) || null, parseInt(secs) || null));
            onClose();
          })}
          disabled={busy || !name.trim()}
          className="flex-1 h-12 rounded-xl bg-accent text-white font-semibold disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
