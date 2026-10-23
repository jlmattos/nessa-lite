/**
 * A rosette (GAME-DESIGN.md §6): a ribbon circle with two tails, in its own
 * colour. Static. The same shape hangs on the curtain tie-backs (stage.tsx
 * draws it inside the stage) and sits on the Season map.
 */
export function RosetteIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 30" width={size} height={(size * 30) / 24} aria-hidden className="inline-block shrink-0">
      <RosetteShape color={color} />
    </svg>
  );
}

/** The rosette's shapes in a 24×30 box, for use inside another svg. */
export function RosetteShape({ color }: { color: string }) {
  return (
    <g>
      <path d="M8 16 L5 29 L9 26 L11 29 L12 17 Z" fill={color} opacity="0.85" />
      <path d="M16 16 L19 29 L15 26 L13 29 L12 17 Z" fill={color} opacity="0.85" />
      <circle cx="12" cy="11" r="10" fill={color} />
      <circle cx="12" cy="11" r="10" fill="none" stroke="#fff7ef" strokeWidth="1.2" strokeDasharray="2 1.6" opacity="0.9" />
      <circle cx="12" cy="11" r="5" fill="#fff7ef" />
      <circle cx="12" cy="11" r="3" fill={color} opacity="0.7" />
    </g>
  );
}
