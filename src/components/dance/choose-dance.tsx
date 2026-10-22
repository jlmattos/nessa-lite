"use client";

import type { StageData, StageDance } from "@/actions/dance";
import { Pirouette } from "@/components/dance/pirouette";
import { MOVE_BY_KEY, FEATURES, type MoveKey } from "@/lib/dance-content";

/**
 * Step 2 (GAME-DESIGN.md §3.7). A fixed 2×2 grid that never reorders:
 * Pirouette's choice, Little Waltz, Twirl Song, New dance (dimmed until the
 * editor ships). Under it, "My dances" (hers, newest first). The last-danced
 * dance is preselected; the default path is one tap.
 */
export function ChooseDance({
  data,
  costume,
  selectedId,
  onSelect,
  onNext,
}: {
  data: StageData;
  costume: string;
  /** null = Pirouette's choice */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onNext: () => void;
}) {
  const selected: { name: string; moves: MoveKey[] } =
    selectedId == null
      ? { name: "Pirouette’s choice", moves: data.pirouettesChoice }
      : data.dances.find((d) => d.id === selectedId) ?? { name: "Pirouette’s choice", moves: data.pirouettesChoice };
  const presets = data.dances.filter((d) => d.presetKey);
  const hers = data.dances.filter((d) => !d.presetKey);
  const editor = FEATURES.find((f) => f.key === "new_dance")!;
  const editorUnlocked = data.unlockedKeys.includes(editor.key) && editor.shipped;

  return (
    <div className="space-y-3">
      <div className="rounded-[1.25rem] bg-surface border border-line p-4 flex items-start gap-3">
        <Pirouette size={120} costume={costume} />
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">This dance</p>
          <p className="font-semibold text-lg leading-tight mt-0.5">{selected.name}</p>
          <MoveStrip moves={selected.moves} slots={data.slotCount} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DanceTile name="Pirouette’s choice" icon="🩰" selected={selectedId == null} onClick={() => onSelect(null)} />
        {presets.map((d) => (
          <DanceTile key={d.id} name={d.name} icon="🩰" selected={selectedId === d.id} onClick={() => onSelect(d.id)} />
        ))}
        <DanceTile
          name="New dance"
          icon="✏️"
          selected={false}
          locked={!editorUnlocked}
          hint={editor.shipped && !data.unlockedKeys.includes(editor.key) ? `at ${editor.unlockAt}` : undefined}
        />
      </div>

      {hers.length > 0 && (
        <div className="rounded-[1.25rem] bg-surface border border-line p-4">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">My dances</p>
          <div className="mt-2 space-y-2">
            {hers.map((d) => <MyDance key={d.id} dance={d} selected={selectedId === d.id} onClick={() => onSelect(d.id)} />)}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform"
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

function MyDance({ dance, selected, onClick }: { dance: StageDance; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-xl border px-3 py-2 text-left ${selected ? "border-accent bg-accent-soft/40 ring-2 ring-accent" : "border-line bg-background"}`}
    >
      <p className="font-medium">{dance.name}</p>
      <p className="text-xs text-muted">{dance.moves.map((m) => MOVE_BY_KEY[m].name).join(" · ")}</p>
    </button>
  );
}
