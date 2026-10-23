"use client";

import type { CSSProperties, Ref } from "react";
import { COSTUMES } from "@/lib/dance-content";

/**
 * Pirouette, the ballerina cat — the rig. Same chibi proportions and palette
 * as the figurine cats, drawn as named groups so the player can move her:
 * legs, then the upper body (torso, arms, head). Moves are
 * CSS keyframes selected by `data-move` on the <svg>; see globals.css.
 * A costume is three colours (CSS custom properties on the root) plus a few
 * overlay shapes, exactly like the cat outfits.
 */
const CREAM = "#fff7ef";
const INK = "#3d3436";
const PINK = "#f2b3a6";

type CSSVars = CSSProperties & { [key: `--${string}`]: string };

export function Pirouette({
  size = 96,
  sway = false,
  costume = "classic",
  ref,
  onTap,
}: {
  size?: number;
  /** Gentle sway (the only motion allowed outside the Dance step, §7). Sparkles live on the stage, not on her. */
  sway?: boolean;
  /** A costume key from the catalog; unknown keys fall back to Classic. */
  costume?: string;
  /** The wrapper div: the player uses it to find the svg and force reflows. */
  ref?: Ref<HTMLDivElement>;
  /** Tap on Pirouette herself (the zero-decision Twirl). */
  onTap?: () => void;
}) {
  const def = COSTUMES.find((c) => c.key === costume) ?? COSTUMES[0];
  const c = def.colors;
  const vars: CSSVars = { "--tutu": c.tutu, "--leotard": c.leotard, "--bow": c.bow };

  return (
    <div
      ref={ref}
      className={`pir-wrap${sway ? " pir-sway" : ""}`}
      style={{ width: size, height: size * 1.2 }}
      onClick={onTap}
      role={onTap ? "button" : undefined}
      aria-label={onTap ? "Pirouette — tap for a twirl" : undefined}
    >
      <svg
        className="pir"
        viewBox="0 0 100 120"
        width={size}
        height={size * 1.2}
        role="img"
        aria-label={`Pirouette the ballerina cat in her ${def.name} costume`}
        data-costume={def.key}
        style={vars}
      >
        {/* standing leg (pivots at its foot) */}
        <g className="pir-leg-l">
          <path d="M44 94 L42 112" stroke={CREAM} strokeWidth="10" strokeLinecap="round" />
          <ellipse cx="42" cy="113" rx="7.5" ry="4.5" style={{ fill: "var(--leotard)" }} />
          <path d="M39 108 L45 102 M45 108 L39 102" style={{ stroke: "var(--bow)" }} strokeWidth="1.4" />
        </g>
        {/* pointed leg (pivots at the hip) */}
        <g className="pir-leg-r">
          <path d="M56 94 L74 103" stroke={CREAM} strokeWidth="10" strokeLinecap="round" />
          <ellipse cx="77" cy="105" rx="7.5" ry="4.5" style={{ fill: "var(--leotard)" }} transform="rotate(32 77 105)" />
        </g>

        <g className="pir-upper">
          <g className="pir-torso">
            <path d="M68 92 Q86 92 84 76" stroke={CREAM} strokeWidth="8" strokeLinecap="round" fill="none" />
            <ellipse cx="50" cy="80" rx="18" ry="18" fill={CREAM} />
            <path d="M34 78 Q50 72 66 78 L64 92 Q50 98 36 92 Z" style={{ fill: "var(--leotard)" }} />
            <ellipse cx="50" cy="90" rx="31" ry="9" style={{ fill: "var(--tutu)" }} />
            <ellipse cx="50" cy="88" rx="24" ry="5.5" style={{ fill: "var(--leotard)" }} opacity="0.45" />
            <CostumeBody overlay={def.overlay} />
          </g>
          <g className="pir-arm-l">
            <path d="M36 74 Q24 68 12 60" stroke={CREAM} strokeWidth="9" strokeLinecap="round" fill="none" />
          </g>
          <g className="pir-arm-r">
            <path d="M64 74 Q76 68 88 60" stroke={CREAM} strokeWidth="9" strokeLinecap="round" fill="none" />
          </g>
          <g className="pir-head">
            <CostumeBehindHead overlay={def.overlay} />
            <path d="M30 26 L36 8 L46 20 Z" fill={CREAM} />
            <path d="M70 26 L64 8 L54 20 Z" fill={CREAM} />
            <path d="M33 24 L37 12 L44 20 Z" fill={PINK} />
            <path d="M67 24 L63 12 L56 20 Z" fill={PINK} />
            <circle cx="50" cy="38" r="26" fill={CREAM} />
            {/* bun + bow */}
            <circle cx="50" cy="12" r="7" fill={CREAM} />
            <path d="M50 9 L43 5 L43 13 Z" style={{ fill: "var(--bow)" }} />
            <path d="M50 9 L57 5 L57 13 Z" style={{ fill: "var(--bow)" }} />
            <circle cx="50" cy="9" r="1.8" style={{ fill: "var(--bow)" }} />
            <CostumeHead overlay={def.overlay} />
            {/* face — happy closed eyes */}
            <path d="M36 38 Q41 33 46 38" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M54 38 Q59 33 64 38" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="34" cy="46" r="4" fill={PINK} opacity="0.65" />
            <circle cx="66" cy="46" r="4" fill={PINK} opacity="0.65" />
            <path d="M47 44 L53 44 L50 49 Z" fill="#d9705f" />
            <path d="M44 50 Q47 54 50 50 Q53 54 56 50" stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <g stroke={INK} strokeWidth="2" strokeLinecap="round">
              <path d="M28 42 L16 40" /><path d="M28 47 L15 47" />
              <path d="M72 42 L84 40" /><path d="M72 47 L85 47" />
            </g>
          </g>
        </g>

      </svg>
    </div>
  );
}

/* ── Costume overlays (GAME-DESIGN.md §5.1). Each is a few shapes; colours come from the root vars. ── */

/** Drawn behind the head, before the ears: feathers, flames. */
function CostumeBehindHead({ overlay }: { overlay: string | null }) {
  switch (overlay) {
    case "feathers": // Swan: three white feathers fanned behind the bun
      return (
        <g fill="#ffffff" stroke="#eee4dc" strokeWidth="0.8">
          <ellipse cx="38" cy="12" rx="3.5" ry="9" transform="rotate(-28 38 12)" />
          <ellipse cx="50" cy="6" rx="3.5" ry="9" />
          <ellipse cx="62" cy="12" rx="3.5" ry="9" transform="rotate(28 62 12)" />
        </g>
      );
    default:
      return null;
  }
}

/** Drawn on the head, after the bun and bow: tiaras, crowns, flakes. (Later costumes.) */
function CostumeHead({ overlay }: { overlay: string | null }) {
  switch (overlay) {
    default:
      return null;
  }
}

/** Drawn on the tutu: stars, rainbow arcs. (Later costumes.) */
function CostumeBody({ overlay }: { overlay: string | null }) {
  switch (overlay) {
    default:
      return null;
  }
}
