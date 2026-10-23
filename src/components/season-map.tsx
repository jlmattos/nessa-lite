"use client";

import type { EarnedRosette, SeasonPath, SeasonSlot } from "@/lib/dance-progress";
import { PosterCard } from "@/components/dance/poster";
import { RosetteIcon } from "@/components/rosette";
import { stageBackground } from "@/components/dance/stage";

const SLOT_W = 48;

/**
 * The Season map (GAME-DESIGN.md §4 item 6, §6): ten slots along a path, one
 * per Program, every theme name visible from day one. The Program she is in is
 * ringed in coral with "you are here", recital night included; a slot shows
 * its poster once a recital at or after it has been performed (a skipped
 * recital's poster derives too, Program 1's included). No count: a skipped
 * recital's slot fills too, so a number would be wrong. Earned rosettes sit
 * under the path; unearned ones never show. Static: nothing moves.
 */
export function SeasonMap({ paths, rosettes }: { paths: SeasonPath[]; rosettes: EarnedRosette[] }) {
  return (
    <div className="space-y-4">
      {paths.map((path) => (
        <div key={path.season} className="rounded-[1.25rem] bg-surface border border-line p-4">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">
            Season {path.season === 1 ? "One" : "Two"}
          </p>
          {/* two rows of five, both read left to right, joined by a dashed path */}
          {[path.slots.slice(0, 5), path.slots.slice(5, 10)].map((row, r) => (
            <div key={r} className={`relative grid grid-cols-5 gap-1 ${r === 0 ? "mt-3" : "mt-2"}`}>
              <div className="absolute left-[10%] right-[10%] top-[32px] border-t-2 border-dashed border-line" aria-hidden />
              {row.map((slot) => (
                <Slot key={slot.program} slot={slot} />
              ))}
            </div>
          ))}
          {path.season === 1 && rosettes.length > 0 && (
            <div className="mt-4 pt-3 border-t border-line">
              <p className="text-xs uppercase tracking-wider text-muted font-semibold">Rosettes</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {rosettes.map((r) => (
                  <div key={r.key} className="flex items-center gap-2 min-w-0">
                    <RosetteIcon color={r.color} size={22} />
                    <span className="text-xs leading-tight">{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Slot({ slot }: { slot: SeasonSlot }) {
  const later = !slot.done && !slot.now;
  return (
    <div
      className="relative flex flex-col items-center"
      aria-label={`Program ${slot.program}, ${slot.theme}${slot.done ? ", recital done" : ""}${slot.now ? ", you are here" : ""}`}
    >
      <div className={`rounded-[6px] ${slot.now ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}>
        {slot.poster ? (
          <PosterCard poster={slot.poster} width={SLOT_W} stageBackground={stageBackground(slot.poster.stage)} />
        ) : (
          <div
            className={`flex items-center justify-center bg-surface rounded-[6px] ${slot.done ? "ring-2 ring-gold" : "border border-line"} ${later ? "opacity-60" : ""}`}
            style={{ width: SLOT_W, height: (SLOT_W * 4) / 3, background: later ? undefined : `${slot.color}33` }}
          >
            <span className="text-sm font-semibold text-muted">{slot.program}</span>
          </div>
        )}
      </div>
      <p className={`text-[10px] leading-tight text-center mt-1 ${slot.now ? "font-semibold text-accent-deep" : "text-muted"}`}>
        {slot.theme}
      </p>
      {slot.now && <p className="text-[9px] text-accent-deep">you are here</p>}
    </div>
  );
}
