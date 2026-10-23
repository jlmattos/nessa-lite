"use client";

import type { SeasonPath, SeasonSlot } from "@/lib/dance-progress";
import { RecitalStar } from "@/components/schedule-strip";

/**
 * The Season map (GAME-DESIGN.md §4 item 6): ten slots along a path, one per
 * Program, every theme name visible from day one. The Program she is in is
 * ringed in coral with "you are here", recital night included; a slot fills
 * once a recital at or after it has been performed (the gold star now, its
 * poster from Phase 2). No count: a skipped recital's slot fills too, so a
 * number would be wrong. Static: nothing moves.
 */
export function SeasonMap({ paths }: { paths: SeasonPath[] }) {
  return (
    <div className="space-y-4">
      {paths.map((path) => (
        <div key={path.season} className="rounded-[1.25rem] bg-surface border border-line p-4">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">
            Season {path.season === 1 ? "One" : "Two"}
          </p>
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

function Slot({ slot }: { slot: SeasonSlot }) {
  const later = !slot.done && !slot.now;
  const ring = slot.now ? "ring-2 ring-accent" : slot.done ? "ring-2 ring-gold" : "border border-line";
  return (
    <div
      className="relative flex flex-col items-center"
      aria-label={`Program ${slot.program}, ${slot.theme}${slot.done ? ", recital done" : ""}${slot.now ? ", you are here" : ""}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-surface ${ring} ${later ? "opacity-60" : ""}`}
        style={{ background: later ? undefined : `${slot.color}33` }}
      >
        {slot.done ? <RecitalStar /> : <span className="text-sm font-semibold text-muted">{slot.program}</span>}
      </div>
      <p className={`text-[10px] leading-tight text-center mt-1 ${slot.now ? "font-semibold text-accent-deep" : "text-muted"}`}>
        {slot.theme}
      </p>
      {slot.now && <p className="text-[9px] text-accent-deep">you are here</p>}
    </div>
  );
}
