"use client";

import type { ProgramLine } from "@/lib/dance-progress";
import { RecitalStar } from "@/components/schedule-strip";

/**
 * The Program line (GAME-DESIGN.md §3.0): four small circles and a small star
 * for where she is in the Program, then one "Next: …" line. Static, two rows.
 * Today's circle (or the star, on recital day) is ringed in coral and fills at
 * Finish: the one per-day completion mark.
 */
export function ProgramLineView({ line, className = "" }: { line: ProgramLine; className?: string }) {
  return (
    <div className={`rounded-[1.25rem] bg-surface border border-line px-4 py-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5" aria-hidden>
          {line.circles.map((filled, i) => {
            const isToday = i + 1 === line.position && !filled;
            return (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${filled ? "bg-accent" : isToday ? "border-2 border-accent" : "border border-line"}`}
              />
            );
          })}
          <span
            className={`inline-flex items-center justify-center rounded-full ${
              line.star === "today" ? "ring-2 ring-accent p-0.5" : line.star === "future" ? "opacity-35" : "bg-accent-soft p-0.5"
            }`}
          >
            <RecitalStar size={12} />
          </span>
        </div>
        <p className="text-sm font-medium" aria-label={`Program ${line.program}: ${line.text}`}>{line.text}</p>
      </div>
      <p className="text-xs text-muted mt-1">{line.nextText}</p>
    </div>
  );
}
