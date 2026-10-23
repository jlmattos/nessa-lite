"use client";

import { useRef, useState, useTransition } from "react";
import type { StageData, StageDance } from "@/actions/dance";
import { saveDance } from "@/actions/saved-dances";
import { Pirouette } from "@/components/dance/pirouette";
import { useDancePlayer } from "@/lib/dance-player";
import { MOVES, NAME_WORDS, QUIET_KEY, type MoveKey } from "@/lib/dance-content";
import { SONGS } from "@/lib/music";
import { setVolume } from "@/lib/sound";

type Words = [string | null, string | null];

/** Two words from the tile rows, if the name is made of them; otherwise none chosen yet. */
function wordsOf(name: string | undefined): Words {
  const parts = (name ?? "").split(" ");
  if (parts.length === 2 && NAME_WORDS[0].includes(parts[0]) && NAME_WORDS[1].includes(parts[1])) return [parts[0], parts[1]];
  if (parts.length === 1 && NAME_WORDS[0].includes(parts[0])) return [parts[0], null];
  if (parts.length === 1 && NAME_WORDS[1].includes(parts[0])) return [null, parts[0]];
  return [null, null];
}

/** The name Save will write, the same way saveDance settles it. */
function previewName(words: Words, editing: StageDance | null, data: StageData): string {
  const chosen = words.filter(Boolean).join(" ");
  if (!chosen) return editing ? editing.name : unique(`Dance ${data.savedCount + 1}`, data.takenNames);
  const others = editing ? data.takenNames.filter((n) => n !== editing.name) : data.takenNames;
  return unique(chosen, others);
}

function unique(name: string, taken: string[]): string {
  const used = new Set(taken.map((t) => t.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  for (let k = 2; ; k++) if (!used.has(`${name} ${k}`.toLowerCase())) return `${name} ${k}`;
}

/**
 * The editor (GAME-DESIGN.md §5.2), inside Choose a dance. One fixed
 * instruction line, the move strip of slots, a fixed 2×4 palette (Season Two's
 * row of two appears at 50). A move tap fills the next empty slot, Pirouette
 * previews it once and its note plays; a full strip glows instead. Tap a slot
 * to take it out; Undo takes out the last one. Then the naming screen: two rows
 * of word tiles and the only button called Save. Leaving with unsaved moves
 * asks once.
 */
export function Choreographer({
  data,
  costume,
  music,
  editing,
  onSaved,
  onLeave,
}: {
  data: StageData;
  costume: string;
  /** Her chosen music: previews play at its tempo. */
  music: string;
  /** The dance being changed, or null for a new one. */
  editing: StageDance | null;
  onSaved: (id: string) => void;
  onLeave: () => void;
}) {
  const [moves, setMoves] = useState<MoveKey[]>(editing?.moves ?? []);
  const [screen, setScreen] = useState<"moves" | "name">("moves");
  const initialWords = useRef<Words>(wordsOf(editing?.name));
  const [words, setWords] = useState<Words>(initialWords.current);
  const [asking, setAsking] = useState(false);
  const [glow, setGlow] = useState(false);
  const glowTimer = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const rig = useRef<HTMLDivElement>(null);
  const player = useDancePlayer(rig, { sound: data.settings.sound });

  const slots = Math.max(data.slotCount, moves.length);
  const unlocked = new Set(data.unlockedKeys);
  const palette = MOVES.filter((m) => m.season === 1 || data.nMax >= 50);
  const bpm = music === QUIET_KEY ? 66 : SONGS[music]?.bpm ?? 66;
  const changed = editing
    ? moves.join(",") !== editing.moves.join(",") || words[0] !== initialWords.current[0] || words[1] !== initialWords.current[1]
    : moves.length > 0;
  const name = previewName(words, editing, data);

  function addMove(key: MoveKey) {
    setVolume(data.settings.volume); // inside the tap: wakes the audio on iPad
    if (moves.length >= data.slotCount) {
      // Full: the strip glows once and no note plays, so the tap still does something.
      if (glowTimer.current != null) clearTimeout(glowTimer.current);
      setGlow(true);
      glowTimer.current = window.setTimeout(() => setGlow(false), 450);
      return;
    }
    setMoves((m) => [...m, key]);
    player.playMove(key, bpm);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        const saved = await saveDance({ id: editing?.id ?? null, words, moves });
        onSaved(saved.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t save — try again.");
      }
    });
  }

  function leave() {
    if (changed && moves.length > 0) {
      setAsking(true);
      return;
    }
    onLeave();
  }

  function pickWord(row: 0 | 1, word: string) {
    setWords((w) => {
      const next: Words = [w[0], w[1]];
      next[row] = w[row] === word ? null : word; // a second tap on the chosen word clears it
      return next;
    });
  }

  const top = (
    <div className="rounded-[1.25rem] bg-surface border border-line p-4 flex items-start gap-3">
      <Pirouette ref={rig} size={120} costume={costume} />
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted font-semibold">{editing ? "Change the dance" : "New dance"}</p>
        <p className="text-sm mt-1">Tap a move. It goes in the next empty slot.</p>
        <div className={`mt-2 rounded-xl transition-shadow duration-300 ${glow ? "shadow-[0_0_0_3px_#e6b422]" : "shadow-[0_0_0_3px_transparent]"}`}>
          <EditorStrip
            moves={moves}
            slots={slots}
            onRemove={screen === "moves" ? (i) => setMoves((m) => m.filter((_, k) => k !== i)) : undefined}
          />
        </div>
      </div>
    </div>
  );

  if (screen === "name") {
    return (
      <div className="space-y-3">
        {top}
        <div className="rounded-[1.25rem] bg-surface border border-line p-4">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Name the dance</p>
          <p className="text-2xl font-bold mt-1 min-h-8">{name}</p>
          {NAME_WORDS.map((row, r) => (
            <div key={r} className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label={r === 0 ? "First word" : "Second word"}>
              {row.map((w) => {
                const on = words[r] === w;
                return (
                  <button
                    key={w}
                    onClick={() => pickWord(r as 0 | 1, w)}
                    aria-pressed={on}
                    className={`h-14 rounded-xl border text-lg font-semibold ${on ? "bg-accent-soft/60 border-accent ring-2 ring-accent" : "bg-background border-line"}`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-accent-deep px-1">⚠ {error}</p>}
        <button
          onClick={save}
          disabled={isPending}
          className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          Save
        </button>
        <button onClick={() => setScreen("moves")} disabled={isPending} className="w-full h-14 rounded-2xl border border-line bg-surface font-semibold">
          Back to the moves
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {top}

      <div className="rounded-[1.25rem] bg-surface border border-line p-3">
        <div className="grid grid-cols-4 gap-2">
          {palette.map((m) => {
            const locked = !unlocked.has(m.key);
            return (
              <button
                key={m.key}
                onClick={locked ? undefined : () => addMove(m.key)}
                disabled={locked || asking}
                aria-label={`${m.name}${locked ? (m.shipped ? `, at ${m.unlockAt}` : ", not yet") : ""}`}
                className={`min-h-[72px] rounded-xl border border-line bg-background flex flex-col items-center justify-center gap-1 px-1 py-2 ${locked ? "opacity-40" : "active:bg-accent-soft/40"}`}
              >
                <span className="text-3xl leading-none" aria-hidden>{m.icon}</span>
                <span className="text-xs font-semibold leading-tight text-center">{m.name}</span>
                {locked && m.shipped && <span className="text-[10px] text-muted -mt-0.5">at {m.unlockAt}</span>}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setMoves((m) => m.slice(0, -1))}
          disabled={moves.length === 0 || asking}
          className="mt-3 w-full min-h-11 rounded-xl border border-line text-sm font-medium disabled:opacity-40"
        >
          Undo
        </button>
      </div>

      {asking ? (
        <div className="rounded-[1.25rem] bg-surface border border-line p-4 space-y-3">
          <p className="text-center font-semibold">Save this dance?</p>
          {error && <p className="text-sm text-accent-deep text-center">⚠ {error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={isPending} className="flex-1 h-14 rounded-xl bg-accent text-white font-semibold disabled:opacity-60">
              Save
            </button>
            <button onClick={onLeave} disabled={isPending} className="flex-1 h-14 rounded-xl border border-line font-semibold">
              Don’t save
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setScreen("name")}
            disabled={moves.length === 0}
            className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-40"
          >
            Next: Name the dance
          </button>
          <button onClick={leave} className="w-full h-14 rounded-2xl border border-line bg-surface font-semibold">
            Back to the dances
          </button>
        </>
      )}
    </div>
  );
}

/** The editor's move strip: every slot drawn, filled ones tappable to take that move out. */
function EditorStrip({ moves, slots, onRemove }: { moves: MoveKey[]; slots: number; onRemove?: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 p-1" role="list" aria-label="Moves in this dance">
      {Array.from({ length: slots }, (_, i) => {
        const key = moves[i];
        const m = key ? MOVES.find((x) => x.key === key) : null;
        if (!m) {
          return <div key={i} role="listitem" aria-label={`${i + 1}: empty`} className="w-11 h-14 rounded-lg border border-dashed border-line" />;
        }
        return (
          <button
            key={i}
            role="listitem"
            onClick={onRemove ? () => onRemove(i) : undefined}
            disabled={!onRemove}
            aria-label={`${i + 1}: ${m.name}${onRemove ? ", tap to take it out" : ""}`}
            className="w-11 h-14 rounded-lg bg-background border border-line flex flex-col items-center justify-center"
          >
            <span className="text-lg leading-none" aria-hidden>{m.icon}</span>
            <span className="text-[9px] text-muted mt-0.5 truncate max-w-[40px]">{m.name}</span>
          </button>
        );
      })}
    </div>
  );
}
