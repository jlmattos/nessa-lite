"use client";

import type { Poster } from "@/lib/dance-progress";
import { MOVE_BY_KEY } from "@/lib/dance-content";
import { Pirouette } from "@/components/dance/pirouette";

/** A dark theme colour gets light words. */
function isDark(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

/**
 * A Program's poster (GAME-DESIGN.md §5.4): 3:4, the Program's theme colour,
 * Pirouette in the look that performed its recital on a little stage,
 * "Program 2" with the theme name under it, and one row of move icons per
 * distinct dance. Derived, never stored; everything scales with `width`, so
 * the same poster fills a Season map slot and the Bow card.
 */
export function PosterCard({ poster, width, stageBackground }: { poster: Poster; width: number; stageBackground: string }) {
  const dark = isDark(poster.color);
  const ink = dark ? "#fff7ef" : "#3d3436";
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center shadow-sm"
      style={{
        width,
        height: Math.round((width * 4) / 3),
        fontSize: width / 10,
        borderRadius: width / 12,
        background: `linear-gradient(180deg, ${poster.color} 0%, ${poster.color}cc 100%)`,
        color: ink,
        padding: "0.5em 0.5em 0.4em",
      }}
      role="img"
      aria-label={`Poster: Program ${poster.program}, ${poster.theme}`}
    >
      <p style={{ fontSize: "1.15em", fontWeight: 700, lineHeight: 1.1 }}>Program {poster.program}</p>
      <p style={{ fontSize: "0.75em", lineHeight: 1.2, opacity: 0.85 }}>{poster.theme}</p>
      <div
        className="w-full flex items-end justify-center overflow-hidden"
        style={{ marginTop: "0.35em", height: "4.6em", borderRadius: "0.5em", background: stageBackground }}
      >
        <Pirouette size={width * 0.36} costume={poster.costume} />
      </div>
      <div className="w-full flex-1 flex flex-col justify-center" style={{ gap: "0.15em", marginTop: "0.3em" }}>
        {poster.dances.slice(0, 4).map((moves, i) => (
          <p key={i} className="text-center whitespace-nowrap overflow-hidden" style={{ fontSize: "0.62em", lineHeight: 1.25 }} aria-hidden>
            {moves.map((m) => MOVE_BY_KEY[m]?.icon ?? "").join("")}
          </p>
        ))}
      </div>
    </div>
  );
}
