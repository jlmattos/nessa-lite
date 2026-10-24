"use client";

import { useRef, useState, useTransition } from "react";
import type { StageData, StageDance } from "@/actions/dance";
import { putAwayDance, putBackDance } from "@/actions/saved-dances";
import { Pirouette } from "@/components/dance/pirouette";
import { useDancePlayer } from "@/lib/dance-player";
import { MOVE_BY_KEY, FEATURES, PIROUETTES_CHOICE_NAME, type MoveKey } from "@/lib/dance-content";
import { setVolume } from "@/lib/sound";
import { unwrap } from "@/lib/action-result";

/**
 * Step 2 (GAME-DESIGN.md §3.7). A fixed 2×2 grid that never reorders:
 * Pirouette's choice, Little Waltz, Twirl Song, New dance (dimmed until the
 * editor unlocks at 7; a tap opens the editor). Under it, "My dances" (hers,
 * newest first) with Change and Put away, and the put-away ones with "Put it
 * back". The last-danced dance is preselected; the default path is one tap.
 *
 * On recital day it shows "Today's dances" instead (read-only, §3.7); on the
 * visit after a late recital, one line above the grid says it plays first.
 */
export function ChooseDance({
  data,
  costume,
  selectedId,
  onSelect,
  onNext,
  onEdit,
}: {
  data: StageData;
  costume: string;
  /** null = Pirouette's choice */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onNext: () => void;
  /** Open the editor: null for a new dance, or one of hers to change. */
  onEdit: (dance: StageDance | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t work — try again.");
      }
    });
  }
  /** The dance that was chosen when it was put away: "Put it back" chooses it again (a full one-tap undo). */
  const wasSelected = useRef<string | null>(null);
  function putAway(d: StageDance) {
    if (selectedId === d.id) {
      wasSelected.current = d.id;
      onSelect(null); // its tile is leaving: Pirouette's choice is chosen instead
    }
    run(async () => { unwrap(await putAwayDance(d.id!)); });
  }
  function putBack(d: StageDance) {
    run(async () => {
      unwrap(await putBackDance(d.id!));
      if (wasSelected.current === d.id) {
        wasSelected.current = null;
        startTransition(() => onSelect(d.id)); // lands with the refreshed list
      }
    });
  }
  /** Her own choice always wins over a pending "Put it back" restore. */
  function choose(id: string | null) {
    wasSelected.current = null;
    onSelect(id);
  }
  // The tap Twirl works on every idle Pirouette while the stage is open, as on Get ready.
  const rig = useRef<HTMLDivElement>(null);
  const player = useDancePlayer(rig, { sound: data.settings.sound });
  const twirl = () => { setVolume(data.settings.volume); player.playMove("twirl"); };
  const selected: { name: string; moves: MoveKey[] } =
    selectedId == null
      ? { name: PIROUETTES_CHOICE_NAME, moves: data.pirouettesChoice }
      : data.dances.find((d) => d.id === selectedId) ?? { name: PIROUETTES_CHOICE_NAME, moves: data.pirouettesChoice };
  const presets = data.dances.filter((d) => d.presetKey);
  const hers = data.dances.filter((d) => !d.presetKey);
  const editor = FEATURES.find((f) => f.key === "new_dance")!;
  const editorUnlocked = data.unlockedKeys.includes(editor.key) && editor.shipped;
  const recital = data.recital;

  if (recital?.onTime) {
    return (
      <div className="space-y-3">
        <div className="rounded-[1.25rem] bg-surface border border-line p-4 flex items-center gap-3">
          <Pirouette ref={rig} size={120} costume={costume} onTap={twirl} />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">Recital {recital.program}</p>
            <p className="font-semibold text-lg leading-tight mt-0.5">Today’s dances</p>
            <p className="text-sm text-muted mt-1">Pirouette dances them all, then the finale.</p>
          </div>
        </div>
        <div className="space-y-2">
          {recital.dances.map((d, k) => (
            <div key={k} className="rounded-[1.25rem] bg-surface border border-line px-4 py-3">
              <p className="text-xs text-muted">Dance {k + 1}</p>
              <p className="font-semibold">{d.name}</p>
              <MoveStrip moves={d.moves} slots={d.moves.length} />
            </div>
          ))}
          <div className="rounded-[1.25rem] bg-surface border border-line px-4 py-3">
            <p className="font-semibold">Finale</p>
            <MoveStrip moves={recital.finale} slots={recital.finale.length} />
          </div>
        </div>
        <button
          onClick={onNext}
          className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform"
        >
          Next: Recital
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[1.25rem] bg-surface border border-line p-4 flex items-start gap-3">
        <Pirouette ref={rig} size={120} costume={costume} onTap={twirl} />
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">This dance</p>
          <p className="font-semibold text-lg leading-tight mt-0.5">{selected.name}</p>
          <MoveStrip moves={selected.moves} slots={data.slotCount} />
        </div>
      </div>

      {recital && (
        <p className="rounded-[1.25rem] bg-accent-soft/60 border border-accent/40 px-4 py-3 text-sm font-medium">
          Recital {recital.program} is ready. It plays first.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <DanceTile name={PIROUETTES_CHOICE_NAME} icon="🩰" selected={selectedId == null} onClick={() => choose(null)} />
        {presets.map((d) => (
          <DanceTile key={d.id} name={d.name} icon="🩰" selected={selectedId === d.id} onClick={() => choose(d.id)} />
        ))}
        <DanceTile
          name="New dance"
          icon="✏️"
          selected={false}
          locked={!editorUnlocked}
          hint={editor.shipped && !data.unlockedKeys.includes(editor.key) ? `at ${editor.unlockAt}` : undefined}
          onClick={() => onEdit(null)}
        />
      </div>

      {error && <p className="text-sm text-accent-deep px-1">⚠ {error}</p>}

      {(hers.length > 0 || data.putAway.length > 0) && (
        <div className="rounded-[1.25rem] bg-surface border border-line p-4">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">My dances</p>
          {/* Ten dances (§6): the shelf gets its second line. */}
          <div className="mt-1 border-t border-line" aria-hidden />
          {data.rosettes.some((r) => r.key === "ten_dances") && <div className="mt-0.5 border-t border-line" aria-hidden />}
          <div className="mt-2 space-y-2">
            {hers.map((d) => (
              <MyDance
                key={d.id}
                dance={d}
                selected={selectedId === d.id}
                busy={isPending}
                onClick={() => choose(d.id)}
                onChange={editorUnlocked ? () => onEdit(d) : undefined}
                onPutAway={() => putAway(d)}
              />
            ))}
          </div>
          {data.putAway.length > 0 && (
            <div className="mt-3 space-y-1">
              {data.putAway.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-sm text-muted">
                  <span className="flex-1 min-w-0 truncate">{d.name} is put away.</span>
                  <button
                    onClick={() => putBack(d)}
                    disabled={isPending}
                    className="min-h-11 px-2 underline shrink-0 disabled:opacity-60"
                  >
                    Put it back
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={isPending}
        className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
      >
        Next: Dance
      </button>
    </div>
  );
}

/** The moves of a dance drawn like the schedule strip: one tile per slot, empty slots outlined. */
export function MoveStrip({ moves, slots, current = null }: { moves: MoveKey[]; slots: number; current?: number | null }) {
  const cells = Array.from({ length: Math.max(slots, moves.length) }, (_, i) => moves[i] ?? null);
  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap" role="list" aria-label="Moves">
      {cells.map((k, i) => {
        const m = k ? MOVE_BY_KEY[k] : null;
        const now = current === i;
        return (
          <div
            key={i}
            role="listitem"
            aria-label={m ? `${i + 1}: ${m.name}${now ? ", now" : ""}` : `${i + 1}: empty`}
            className={`flex flex-col items-center w-11 rounded-lg py-1 ${now ? "bg-accent-soft ring-2 ring-accent" : m ? "bg-background" : "border border-dashed border-line"}`}
          >
            <span className="text-lg leading-none" aria-hidden>{m ? m.icon : " "}</span>
            <span className="text-[9px] text-muted mt-0.5 truncate max-w-[40px]">{m ? m.name : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

function DanceTile({
  name, icon, selected, locked = false, hint, onClick,
}: {
  name: string; icon: string; selected: boolean; locked?: boolean; hint?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      aria-pressed={selected}
      className={`rounded-[1.25rem] border p-4 text-left h-24 flex flex-col justify-between ${
        selected ? "bg-accent-soft/50 border-accent ring-2 ring-accent" : "bg-surface border-line"
      } ${locked ? "opacity-40" : "active:bg-accent-soft/40"}`}
    >
      <span className="text-2xl leading-none" aria-hidden>{icon}</span>
      <span className="font-semibold leading-tight">{name}{hint ? <span className="block text-[10px] text-muted font-normal">{hint}</span> : null}</span>
    </button>
  );
}

function MyDance({
  dance, selected, busy, onClick, onChange, onPutAway,
}: {
  dance: StageDance; selected: boolean; busy: boolean; onClick: () => void; onChange?: () => void; onPutAway: () => void;
}) {
  return (
    <div className={`rounded-xl border ${selected ? "border-accent bg-accent-soft/40 ring-2 ring-accent" : "border-line bg-background"}`}>
      <button onClick={onClick} disabled={busy} aria-pressed={selected} className="w-full px-3 pt-2 pb-1 text-left min-h-11">
        <p className="font-medium">{dance.name}</p>
        <p className="text-xs text-muted">{dance.moves.map((m) => MOVE_BY_KEY[m].name).join(" · ")}</p>
      </button>
      <div className="flex justify-end gap-1 px-1 pb-1">
        {onChange && (
          <button onClick={onChange} disabled={busy} className="min-h-11 px-3 text-sm font-medium text-accent-deep disabled:opacity-60">
            Change
          </button>
        )}
        <button onClick={onPutAway} disabled={busy} className="min-h-11 px-3 text-sm text-muted disabled:opacity-60">
          Put away
        </button>
      </div>
    </div>
  );
}
