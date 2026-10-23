"use client";

import type { MouseEvent, ReactNode } from "react";

export type CurtainState = "closed" | "opening" | "open" | "closing";

/**
 * The stage box: a backdrop by stage key, whatever stands on it, the
 * curtains, and the decorations earned so far. Decorations sit in front of the
 * curtain line (footlights at the lip, string lights across the top), so they
 * show on a closed stage too: on the Bow that announces them, and every day after.
 * Darker backdrops stay inside the box; the page around it is always light.
 */
export function StageBox({
  stageKey,
  curtains,
  decorations = [],
  onTap,
  children,
  front,
  className = "",
}: {
  stageKey: string;
  curtains: CurtainState;
  decorations?: string[];
  onTap?: (e: MouseEvent<HTMLDivElement>) => void;
  /** On the stage, behind the curtains. */
  children?: ReactNode;
  /** In front of the curtains: what she sees on a closed stage. */
  front?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full aspect-[4/3] rounded-[1.25rem] border border-line overflow-hidden select-none ${className}`}
      style={{ background: backdropFor(stageKey) }}
      onClick={onTap}
    >
      <Backdrop stageKey={stageKey} />
      {/* floor */}
      <div className="absolute bottom-0 inset-x-0 h-[14%] bg-black/10" aria-hidden />
      <div className="absolute inset-0 flex items-end justify-center pb-[8%]">{children}</div>
      {/* curtains */}
      <div className={`stage-curtain-l absolute inset-y-0 left-0 w-1/2 ${CURTAIN}`} data-state={curtains} aria-hidden />
      <div className={`stage-curtain-r absolute inset-y-0 right-0 w-1/2 ${CURTAIN}`} data-state={curtains} aria-hidden />
      <Decorations keys={decorations} />
      {front && <div className="absolute inset-0 flex items-end justify-center pb-[8%]">{front}</div>}
    </div>
  );
}

const CURTAIN = "bg-[linear-gradient(90deg,#c94f3e_0%,#e26d5c_18%,#c94f3e_36%,#e26d5c_54%,#c94f3e_72%,#e26d5c_90%,#c94f3e_100%)] shadow-[inset_0_0_30px_rgba(0,0,0,0.25)]";

function backdropFor(key: string): string {
  switch (key) {
    case "moon_night":
      return "linear-gradient(180deg, #1f2a4a 0%, #3b4d7a 70%, #4a6fa5 100%)";
    case "practice_room":
    default:
      return "linear-gradient(180deg, #fbe9e5 0%, #faf6f1 65%, #f1e6dc 100%)";
  }
}

function Backdrop({ stageKey }: { stageKey: string }) {
  switch (stageKey) {
    case "moon_night":
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
          <circle cx="320" cy="70" r="34" fill="#fff7ef" />
          <circle cx="334" cy="60" r="30" fill="#2a3760" />
          <g fill="#fff7ef" opacity="0.8">
            <circle cx="60" cy="50" r="1.6" /><circle cx="120" cy="90" r="1.2" /><circle cx="200" cy="40" r="1.4" />
            <circle cx="260" cy="110" r="1.1" /><circle cx="40" cy="130" r="1.3" /><circle cx="370" cy="150" r="1.2" />
          </g>
        </svg>
      );
    case "practice_room":
    default:
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
          {/* the barre */}
          <rect x="30" y="150" width="340" height="6" rx="3" fill="#d9c7b5" />
          <rect x="60" y="156" width="6" height="90" fill="#cdb79e" />
          <rect x="334" y="156" width="6" height="90" fill="#cdb79e" />
        </svg>
      );
  }
}

/** Decorations arrive with recitals (Phase 1b: footlights, string lights). */
function Decorations({ keys }: { keys: string[] }) {
  if (keys.length === 0) return null;
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
      {keys.includes("footlights") && (
        <g fill="#e6b422" opacity="0.9">
          {[40, 100, 160, 220, 280, 340].map((x) => <circle key={x} cx={x} cy="262" r="4" />)}
        </g>
      )}
      {keys.includes("string_lights") && (
        <g>
          <path d="M0 30 Q200 70 400 30" stroke="#8a7f82" strokeWidth="1.5" fill="none" />
          {[30, 90, 150, 210, 270, 330, 390].map((x, i) => (
            <circle key={x} cx={x} cy={30 + Math.sin((i / 6) * Math.PI) * 36} r="3.5" fill={i % 2 ? "#f2b3a6" : "#e6b422"} />
          ))}
        </g>
      )}
    </svg>
  );
}
