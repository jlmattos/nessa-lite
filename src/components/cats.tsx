"use client";

import { useEffect, useState } from "react";
import { COLLECTION, type CatId } from "@/lib/collection";

/* ─────────────────────────────────────────────────────────────────────────
 * All cats are inline SVG (a few KB total, no requests) with CSS-only
 * animation — nothing here can slow the app down.
 * ──────────────────────────────────────────────────────────────────────── */

const CREAM = "#fff7ef";
const INK = "#3d3436";
const PINK = "#f2b3a6";

/** Shared chibi base: big head, small body — collectible-figurine proportions. */
function ChibiBase({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {/* tail */}
      <path d="M72 98 Q84 96 82 84" stroke={CREAM} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* body */}
      <ellipse cx="50" cy="86" rx="24" ry="22" fill={CREAM} />
      {/* arms */}
      <path d="M32 74 L26 90" stroke={CREAM} strokeWidth="10" strokeLinecap="round" />
      <path d="M68 74 L74 90" stroke={CREAM} strokeWidth="10" strokeLinecap="round" />
      {/* feet */}
      <ellipse cx="40" cy="108" rx="8" ry="6" fill={CREAM} />
      <ellipse cx="60" cy="108" rx="8" ry="6" fill={CREAM} />
      {/* ears */}
      <path d="M30 26 L36 8 L46 20 Z" fill={CREAM} />
      <path d="M70 26 L64 8 L54 20 Z" fill={CREAM} />
      <path d="M33 24 L37 12 L44 20 Z" fill={PINK} />
      <path d="M67 24 L63 12 L56 20 Z" fill={PINK} />
      {/* head */}
      <circle cx="50" cy="38" r="26" fill={CREAM} />
      {/* face */}
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
      {children}
    </>
  );
}

/** Outfit overlays, drawn on top of the base. */
function Outfit({ variant }: { variant: CatId }) {
  switch (variant) {
    case "mochi": // coral sweatband
      return <path d="M27 28 Q50 18 73 28 L71 35 Q50 26 29 35 Z" fill="#e26d5c" />;
    case "miso": // chef toque + apron
      return (
        <>
          <path d="M36 70 L64 70 L60 98 L40 98 Z" fill="#ffffff" stroke="#e8ded6" />
          <path d="M40 70 L50 78 L60 70" stroke="#e8ded6" strokeWidth="2" fill="none" />
          <circle cx="40" cy="9" r="7" fill="#ffffff" stroke="#e8ded6" />
          <circle cx="50" cy="6" r="8" fill="#ffffff" stroke="#e8ded6" />
          <circle cx="60" cy="9" r="7" fill="#ffffff" stroke="#e8ded6" />
          <rect x="36" y="9" width="28" height="11" fill="#ffffff" stroke="#e8ded6" />
        </>
      );
    case "nori": // sailor collar + hat
      return (
        <>
          <path d="M34 66 L50 80 L66 66 L66 74 L50 88 L34 74 Z" fill="#4a6fa5" />
          <path d="M37 68 L50 79 L63 68" stroke="#ffffff" strokeWidth="2" fill="none" />
          <path d="M34 16 Q50 6 66 16 L66 21 L34 21 Z" fill="#ffffff" stroke="#e8ded6" />
          <rect x="34" y="19" width="32" height="5" fill="#4a6fa5" />
        </>
      );
    case "shadow": // ninja hood band + belt
      return (
        <>
          <rect x="25" y="24" width="50" height="9" rx="4.5" fill={INK} />
          <path d="M73 27 L84 22 M73 30 L85 30" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <rect x="30" y="88" width="40" height="7" rx="3" fill={INK} />
        </>
      );
    case "cosmo": // helmet + chest panel
      return (
        <>
          <circle cx="50" cy="38" r="30" fill="none" stroke="#8ab6d6" strokeWidth="3.5" />
          <rect x="42" y="78" width="16" height="10" rx="2" fill="#d7dee5" stroke="#8ab6d6" />
          <circle cx="47" cy="83" r="1.8" fill="#e26d5c" />
          <circle cx="53" cy="83" r="1.8" fill="#7fb069" />
        </>
      );
    case "reina": // crown + cape
      return (
        <>
          <path d="M38 16 L42 3 L50 11 L58 3 L62 16 Z" fill="#e6b422" stroke="#c9991a" />
          <circle cx="42" cy="5" r="2" fill="#e26d5c" /><circle cx="58" cy="5" r="2" fill="#e26d5c" />
          <path d="M28 70 Q22 90 30 104 L38 98 L34 72 Z" fill="#c94f3e" />
          <path d="M72 70 Q78 90 70 104 L62 98 L66 72 Z" fill="#c94f3e" />
        </>
      );
    case "bricks": // hard hat
      return (
        <>
          <path d="M32 22 Q50 4 68 22 L68 26 L32 26 Z" fill="#f2c14e" stroke="#d9a831" />
          <rect x="28" y="25" width="44" height="5" rx="2.5" fill="#f2c14e" stroke="#d9a831" />
          <rect x="47" y="10" width="6" height="12" fill="#d9a831" opacity="0.5" />
        </>
      );
    case "tank": // lifting belt + mini dumbbell
      return (
        <>
          <rect x="28" y="87" width="44" height="9" rx="3" fill="#8a6d4f" />
          <rect x="45" y="88" width="10" height="7" rx="1.5" fill="#e6b422" />
          <path d="M27 28 Q50 20 73 28 L71 34 Q50 27 29 34 Z" fill="#e26d5c" />
          <g transform="translate(74, 90) rotate(20)">
            <rect x="-2" y="-8" width="4" height="16" rx="1.5" fill={INK} />
            <rect x="-5" y="-9" width="3" height="6" rx="1" fill={INK} />
            <rect x="2" y="-9" width="3" height="6" rx="1" fill={INK} />
          </g>
        </>
      );
    case "sage": // zen robe
      return (
        <>
          <path d="M32 68 L68 68 L63 104 L37 104 Z" fill="#b7c9b1" />
          <path d="M42 68 L50 82 L58 68" stroke="#ffffff" strokeWidth="2.5" fill="none" />
          <rect x="34" y="84" width="32" height="5" rx="2.5" fill="#93a98c" />
        </>
      );
    case "champ": // gold medal
      return (
        <>
          <path d="M42 64 L50 78 M58 64 L50 78" stroke="#c94f3e" strokeWidth="3.5" />
          <circle cx="50" cy="83" r="7.5" fill="#e6b422" stroke="#c9991a" strokeWidth="1.5" />
          <path d="M50 79.5 L51.3 82.2 L54.2 82.5 L52 84.5 L52.6 87.3 L50 85.8 L47.4 87.3 L48 84.5 L45.8 82.5 L48.7 82.2 Z" fill="#fff7ef" />
        </>
      );
  }
}

/** A collectible cat figurine. Locked ones render as dark mystery silhouettes. */
export function FigurineCat({ variant, size = 72, locked = false }: { variant: CatId; size?: number; locked?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      aria-hidden
      style={locked ? { filter: "grayscale(1) brightness(0.32) opacity(0.55)" } : undefined}
    >
      <ChibiBase>
        <Outfit variant={variant} />
      </ChibiBase>
    </svg>
  );
}

/* ── The set-complete flex ───────────────────────────────────────────────── */

/**
 * Tiny cat that pops up and curls a dumbbell every time a set is logged.
 * Mounts for ~1.3s, pointer-events-none, transform/opacity animation only.
 */
export function SetFlexToast({ signal }: { signal: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (signal === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1350);
    return () => clearTimeout(t);
  }, [signal]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-[150px] left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div key={signal} className="rounded-full bg-surface border border-line shadow-lg px-3 py-1.5 animate-lite-toast">
        <svg viewBox="0 0 64 44" width="58" height="40" aria-hidden>
          {/* body + head */}
          <ellipse cx="22" cy="34" rx="14" ry="9" fill={CREAM} />
          <path d="M10 18 L13 8 L20 14 Z" fill={CREAM} />
          <path d="M30 18 L27 8 L20 14 Z" transform="translate(4 0)" fill={CREAM} />
          <circle cx="22" cy="21" r="12" fill={CREAM} />
          <path d="M16 20 Q18.5 17.5 21 20" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M25 20 Q27.5 17.5 30 20" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M21 25 Q23 27.5 25 25" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <circle cx="15" cy="24" r="2" fill={PINK} opacity="0.7" />
          <circle cx="29" cy="24" r="2" fill={PINK} opacity="0.7" />
          {/* upper arm out to the elbow */}
          <path d="M32 30 L44 30" stroke={CREAM} strokeWidth="7" strokeLinecap="round" />
          {/* forearm + dumbbell, curling around the elbow */}
          <g className="lite-flex-arm">
            <path d="M44 30 L44 16" stroke={CREAM} strokeWidth="7" strokeLinecap="round" />
            <g transform="translate(44 13)">
              <rect x="-8" y="-2" width="16" height="4" rx="2" fill={INK} />
              <rect x="-11" y="-4.5" width="4" height="9" rx="1.5" fill={INK} />
              <rect x="7" y="-4.5" width="4" height="9" rx="1.5" fill={INK} />
            </g>
          </g>
          {/* sparkle */}
          <path d="M55 8 L56.3 11 L59 12 L56.3 13 L55 16 L53.7 13 L51 12 L53.7 11 Z" fill="#e6b422" className="animate-lite-pop" />
        </svg>
      </div>
    </div>
  );
}

/* ── New-friend unlock moment ────────────────────────────────────────────── */

const SEEN_KEY = "lift-lite-cats-seen";

/**
 * Full-screen blind-box reveal the first time a new cat friend is earned.
 * localStorage-keyed so each friend reveals exactly once per device.
 */
export function CatUnlock({ earned }: { earned: CatId[] }) {
  const [reveal, setReveal] = useState<CatId | null>(null);
  const earnedKey = earned.join(",");

  useEffect(() => {
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {}
    if (seen.length === 0) {
      // First visit on this device: baseline whatever is already earned
      // silently — reveals are only for NEW unlocks from here on.
      localStorage.setItem(SEEN_KEY, JSON.stringify(["_init", ...earned]));
      return;
    }
    const fresh = earned.filter((id) => !seen.includes(id));
    // Never overwrite an active reveal; marking as seen happens on dismiss,
    // so re-runs (refreshes, strict mode) can't swallow the moment.
    if (fresh.length > 0) setReveal((prev) => prev ?? fresh[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnedKey]);

  function dismiss() {
    if (!reveal) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {}
    const nextSeen = [...new Set([...seen, reveal])];
    localStorage.setItem(SEEN_KEY, JSON.stringify(nextSeen));
    const next = earned.find((id) => !nextSeen.includes(id)) ?? null;
    setReveal(next);
  }

  if (!reveal) return null;
  const def = COLLECTION.find((c) => c.id === reveal)!;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-foreground/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-[1.5rem] bg-surface p-7 text-center shadow-2xl animate-lite-pop">
        {["🎁", "✨", "🐾", "⭐", "✨", "🎉"].map((e, i) => (
          <span
            key={i}
            className="absolute text-2xl animate-lite-float"
            style={{ left: `${8 + i * 15}%`, top: "72%", animationDelay: `${i * 120}ms` }}
            aria-hidden
          >
            {e}
          </span>
        ))}
        <p className="text-xs uppercase tracking-widest text-muted font-semibold">New friend unlocked</p>
        <div className="mt-3 inline-block animate-lite-hop">
          <FigurineCat variant={reveal} size={110} />
        </div>
        <p className="text-xl font-bold mt-1">
          {def.name} <span className="text-muted font-medium">{def.outfit}</span>
        </p>
        <p className="text-xs text-muted mt-1">She’ll be waiting on your shelf in Progress. 🐾</p>
        <button
          onClick={dismiss}
          className="mt-5 w-full py-3.5 rounded-2xl bg-accent text-white text-base font-semibold"
        >
          Hi, {def.name}! →
        </button>
      </div>
    </div>
  );
}
