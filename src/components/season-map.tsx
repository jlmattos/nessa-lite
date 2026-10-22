"use client";

import type { SeasonPath } from "@/lib/dance-progress";
import { RecitalStar } from "@/components/schedule-strip";

/**
 * The Season map (GAME-DESIGN.md §4 item 6): ten slots along a path, one per
 * Program, every theme name visible from day one. The Program she is in is
 * ringed in coral; a slot fills once a recital at or after it has been
 * performed (the gold star now, its poster from Phase 2). Static: nothing moves.
 */
export function SeasonMap({ paths }: { paths: SeasonPath[] }) {
  return (
    <div className="space-y-4">
      {paths.map((path) => (
        <div key={path.season} className="rounded-[1.25rem] bg-surface border border-line p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">
              Season {path.season === 1 ? "One" : "Two"}
            </p>
            <p className="text-xs text-muted">
              {path.slots.filter((s) => s.state === "done").length} of {path.slots.length} recitals
            </p>
          </div>
          {/* two rows of five, both read left to right, joined by a dashed path */}
          {[path.slots.slice(0, 5), path.slots.slice(5, 10)].map((row, r) => (
            <div key={r} className={`relative grid grid-cols-5 gap-1 ${r === 0 ? "mt-3" : "mt-1"}`}>
              <div className="absolute left-[10%] right-[10%] top-[28px] border-t-2 border-dashed border-line" aria-hidden />
              {row.map((slot) => (
                <Slot key={slot.program} slot={slot} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Slot({ slot }: { slot: { program: number; theme: string; color: string; state: "done" | "now" | "later" } }) {
  const ring =
    slot.state === "now" ? "ring-2 ring-accent" : slot.state === "done" ? "ring-2 ring-gold" : "border border-line";
  return (
    <div
      className="relative flex flex-col items-center"
      aria-label={`Program ${slot.program}, ${slot.theme}${slot.state === "done" ? ", recital done" : slot.state === "now" ? ", you are here" : ""}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-surface ${ring} ${slot.state === "later" ? "opacity-60" : ""}`}
        style={{ background: slot.state === "later" ? undefined : `${slot.color}33` }}
      >
        {slot.state === "done" ? <RecitalStar /> : <span className="text-sm font-semibold text-muted">{slot.program}</span>}
      </div>
      <p className={`text-[10px] leading-tight text-center mt-1 ${slot.state === "now" ? "font-semibold text-accent-deep" : "text-muted"}`}>
        {slot.theme}
      </p>
      {slot.state === "now" && <p className="text-[9px] text-accent-deep">you are here</p>}
    </div>
  );
}
