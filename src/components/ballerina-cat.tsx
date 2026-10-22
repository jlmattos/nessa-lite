"use client";

/**
 * Pirouette, the ballerina cat — same chibi proportions and palette as the
 * figurine cats, in a tutu with arms in second position and one foot pointed.
 * Inline SVG, CSS-only animation. `dancing` adds a gentle sway and breathing
 * sparkles; both are switched off by calm mode / prefers-reduced-motion.
 */
const CREAM = "#fff7ef";
const INK = "#3d3436";
const PINK = "#f2b3a6";
const TUTU = "#f7c6d9";
const TUTU_DARK = "#ec9fbd";
const RIBBON = "#e26d5c";
const GOLD = "#e6b422";

export function BallerinaCat({ size = 96, dancing = false }: { size?: number; dancing?: boolean }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      role="img"
      aria-label="Pirouette the ballerina cat"
      className={dancing ? "animate-lite-sway" : undefined}
    >
      {/* tail */}
      <path d="M68 92 Q86 92 84 76" stroke={CREAM} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* standing leg + pointed leg */}
      <path d="M44 92 L42 112" stroke={CREAM} strokeWidth="10" strokeLinecap="round" />
      <path d="M56 92 L74 103" stroke={CREAM} strokeWidth="10" strokeLinecap="round" />
      {/* slippers with ribbons */}
      <ellipse cx="42" cy="113" rx="7.5" ry="4.5" fill={TUTU_DARK} />
      <ellipse cx="77" cy="105" rx="7.5" ry="4.5" fill={TUTU_DARK} transform="rotate(32 77 105)" />
      <path d="M39 108 L45 102 M45 108 L39 102" stroke={RIBBON} strokeWidth="1.4" />
      {/* body + leotard */}
      <ellipse cx="50" cy="80" rx="18" ry="18" fill={CREAM} />
      <path d="M34 78 Q50 72 66 78 L64 92 Q50 98 36 92 Z" fill={TUTU_DARK} />
      {/* tutu */}
      <ellipse cx="50" cy="90" rx="31" ry="9" fill={TUTU} />
      <ellipse cx="50" cy="88" rx="24" ry="5.5" fill={TUTU_DARK} opacity="0.45" />
      {/* arms in second position */}
      <path d="M34 74 Q22 68 12 60" stroke={CREAM} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M66 74 Q78 68 88 60" stroke={CREAM} strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* ears */}
      <path d="M30 26 L36 8 L46 20 Z" fill={CREAM} />
      <path d="M70 26 L64 8 L54 20 Z" fill={CREAM} />
      <path d="M33 24 L37 12 L44 20 Z" fill={PINK} />
      <path d="M67 24 L63 12 L56 20 Z" fill={PINK} />
      {/* head */}
      <circle cx="50" cy="38" r="26" fill={CREAM} />
      {/* bun + bow */}
      <circle cx="50" cy="12" r="7" fill={CREAM} />
      <path d="M50 9 L43 5 L43 13 Z" fill={RIBBON} />
      <path d="M50 9 L57 5 L57 13 Z" fill={RIBBON} />
      <circle cx="50" cy="9" r="1.8" fill={RIBBON} />
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
      {/* sparkles — she loves sparkle */}
      {dancing && (
        <g fill={GOLD}>
          <path className="animate-lite-sparkle" d="M12 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
          <path className="animate-lite-sparkle" style={{ animationDelay: "0.5s" }} d="M90 36 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" />
          <path className="animate-lite-sparkle" style={{ animationDelay: "1s" }} d="M22 100 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" />
        </g>
      )}
    </svg>
  );
}
