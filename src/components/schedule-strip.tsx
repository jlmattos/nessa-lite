"use client";

import type { ReactNode } from "react";

/**
 * The visual schedule. One tile per step, in order: the current step ringed
 * in coral, done steps keeping their own icon with a small static gold dot
 * (§3.2), later steps plain. Both Today (movements, then the dance) and the
 * stage (Get ready · Choose a dance · Dance · Bow) draw with it, so the
 * grammar is the same everywhere. The row wraps rather than scrolls, so every
 * step, including the reward at the end, is always on screen.
 */
export type StripState = "done" | "now" | "later";

export type StripItem = {
  key: string;
  /** An emoji or a small SVG: the tile's picture, kept when the step is done. */
  icon: ReactNode;
  /** The small word under the tile ("1", "Dance", "Bow"). */
  label: string;
  state: StripState;
  ariaLabel?: string;
  /** A larger tile (the recital star). */
  big?: boolean;
  /** Draw an arrow before this tile: it is the reward at the end of the steps. */
  final?: boolean;
};

export function ScheduleStrip({ title, items, line }: { title: string; items: StripItem[]; line: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] bg-surface border border-line shadow-[0_1px_3px_rgba(61,52,54,0.06)] px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted font-semibold">{title}</p>
      <div className="flex flex-wrap items-center gap-1.5 mt-2" role="list">
        {items.map((it) => (
          <StripTile key={it.key} item={it} />
        ))}
      </div>
      <p className="text-sm mt-2">{line}</p>
    </div>
  );
}

function StripTile({ item }: { item: StripItem }) {
  const { state } = item;
  const tone =
    state === "now" ? "bg-accent-soft ring-2 ring-accent" : state === "done" ? "bg-success-soft" : "bg-background";
  const size = item.big ? "w-16 py-2" : "w-14 py-1.5";
  return (
    <>
      {item.final && <span className="text-muted px-0.5 shrink-0" aria-hidden>→</span>}
      <div
        role="listitem"
        className={`relative flex flex-col items-center shrink-0 rounded-xl ${size} ${tone}`}
        aria-label={item.ariaLabel ?? `${item.label}${state === "done" ? ", done" : state === "now" ? ", now" : ""}`}
      >
        <span className={`leading-none ${item.big ? "text-3xl" : "text-2xl"}`} aria-hidden>{item.icon}</span>
        <span className="text-[10px] text-muted mt-1">{item.label}</span>
        {state === "done" && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold" aria-hidden />}
      </div>
    </>
  );
}

/** The gold recital star: large on the strip (the big day), small on the Program line. */
export function RecitalStar({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`inline-block ${className}`} aria-hidden>
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
        fill="#e6b422"
        stroke="#c94f3e"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
