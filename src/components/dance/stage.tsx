"use client";

import { Fragment, type MouseEvent, type ReactNode } from "react";
import { RosetteShape } from "@/components/rosette";

export type CurtainState = "closed" | "opening" | "open" | "closing";
/** An earned rosette on a tie-back: `slot` is its fixed place in the catalog order, so none ever moves. */
export type StageRosette = { slot: number; color: string };

/**
 * The stage box: a backdrop by stage key, whatever stands on it, the
 * curtains, and the decorations and rosettes earned so far. Decorations sit in
 * front of the curtain line (footlights at the lip, string lights across the top,
 * garlands above them and down the curtain edges, rosettes on the tie-backs), so
 * they show on a closed stage too: on the Bow that announces them, and every day after.
 * Darker backdrops stay inside the box; the page around it is always light.
 */
export function StageBox({
  stageKey,
  curtains,
  decorations = [],
  rosettes = [],
  glow = 0,
  onTap,
  children,
  front,
  className = "",
}: {
  stageKey: string;
  curtains: CurtainState;
  decorations?: string[];
  /** Earned rosettes, each in its own fixed slot. */
  rosettes?: StageRosette[];
  /** Tonight's caught sparkles as a soft gold pool on the floor (opacity 0–0.6, static). */
  glow?: number;
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
      style={{ background: stageBackground(stageKey) }}
      onClick={onTap}
    >
      <Backdrop stageKey={stageKey} />
      {/* floor */}
      <div className="absolute bottom-0 inset-x-0 h-[14%] bg-black/10" aria-hidden />
      {glow > 0 && (
        <div
          className="absolute bottom-0 inset-x-[12%] h-[22%] pointer-events-none"
          style={{ opacity: glow, background: "radial-gradient(ellipse at 50% 85%, rgba(230,180,34,0.95) 0%, rgba(230,180,34,0.45) 35%, rgba(230,180,34,0) 70%)" }}
          aria-hidden
        />
      )}
      <div className="absolute inset-0 flex items-end justify-center pb-[8%]">{children}</div>
      {/* curtains */}
      <div className={`stage-curtain-l absolute inset-y-0 left-0 w-1/2 ${CURTAIN}`} data-state={curtains} aria-hidden />
      <div className={`stage-curtain-r absolute inset-y-0 right-0 w-1/2 ${CURTAIN}`} data-state={curtains} aria-hidden />
      <Decorations keys={decorations} rosettes={rosettes} />
      {front && <div className="absolute inset-0 flex items-end justify-center pb-[8%]">{front}</div>}
    </div>
  );
}

const CURTAIN = "bg-[linear-gradient(90deg,#c94f3e_0%,#e26d5c_18%,#c94f3e_36%,#e26d5c_54%,#c94f3e_72%,#e26d5c_90%,#c94f3e_100%)] shadow-[inset_0_0_30px_rgba(0,0,0,0.25)]";

/** A stage's backdrop as a CSS background (also behind Pirouette on a poster). */
export function stageBackground(key: string): string {
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

/** Decorations arrive with recitals: footlights, string lights, flower garlands. Rosettes hang on the tie-backs. All static. */
function Decorations({ keys, rosettes }: { keys: string[]; rosettes: StageRosette[] }) {
  if (keys.length === 0 && rosettes.length === 0) return null;
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
      {keys.includes("garlands") && <Garlands />}
      {keys.includes("footlights") && (
        <g fill="#e6b422" opacity="0.9">
          {[40, 100, 160, 220, 280, 340].map((x) => <circle key={x} cx={x} cy="262" r="4" />)}
        </g>
      )}
      {keys.includes("string_lights") && (
        <g>
          {/* Two side swags, nothing in the middle: her bun, bow and Swan feathers stay clear at rest
              and at the top of a Sauté hop; the bulbs stay below the garland. */}
          <path d="M0 30 Q80 46 160 30" stroke="#8a7f82" strokeWidth="1.5" fill="none" />
          <path d="M240 30 Q320 46 400 30" stroke="#8a7f82" strokeWidth="1.5" fill="none" />
          {[30, 90, 150, 250, 310, 370].map((x, i) => {
            const t = ((x < 200 ? x : x - 240) / 160);
            return <circle key={x} cx={x} cy={30 + 32 * t * (1 - t)} r="3.5" fill={i % 2 ? "#f2b3a6" : "#e6b422"} />;
          })}
        </g>
      )}
      {/* Rosettes, alternating left and right down the tie-back bands (x < 34 and x > 366,
          y 120–230): each is 14.4 × 18, so six a side fit. Each has its own slot by
          catalog order, so one earned out of order never moves the others. */}
      {rosettes.map(({ slot, color }) => (
        <g key={slot} transform={`translate(${slot % 2 ? 379.6 : 6} ${122 + Math.floor(slot / 2) * 18}) scale(0.6)`}>
          <RosetteShape color={color} />
        </g>
      ))}
    </svg>
  );
}

/* ── Flower garlands (Recital 3) ──────────────────────────────────────────────
   A scalloped swag across the very top (y 4–26, above the string lights) and a
   short drop down each curtain edge, ending above y 110, so the tie-back bands
   (x < 34 and x > 366, y 120–230) stay free for the rosettes. Static: nothing
   here ever moves. Built once from a few curves; about 70 nodes. */
const G_CORAL = "#e26d5c";
const G_GOLD = "#e6b422";
const G_PINK = "#f2b3a6";
const G_LEAF = "#7fb069";
const G_CREAM = "#fff7ef";
const LEAF_PATH = "M0 0Q4.5 -3 9 0Q4.5 3 0 0Z"; // points along +x from its stem

type Pt = [number, number];
type Bloom = { x: number; y: number; r: number; color: string };
type Leaf = { x: number; y: number; angle: number };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A point on a quadratic curve and the direction it runs there, in degrees. */
function onCurve(p0: Pt, c: Pt, p2: Pt, t: number) {
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * t * u * c[0] + t * t * p2[0];
  const y = u * u * p0[1] + 2 * t * u * c[1] + t * t * p2[1];
  const dx = 2 * u * (c[0] - p0[0]) + 2 * t * (p2[0] - c[0]);
  const dy = 2 * u * (c[1] - p0[1]) + 2 * t * (p2[1] - c[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/** Five round petals in one path, about r from the centre to the edge. */
function petals(cx: number, cy: number, r: number): string {
  const pr = r1(r * 0.46);
  let d = "";
  for (let k = 0; k < 5; k++) {
    const a = ((-90 + k * 72) * Math.PI) / 180;
    const px = r1(cx + r * 0.54 * Math.cos(a) + pr);
    const py = r1(cy + r * 0.54 * Math.sin(a));
    d += `M${px} ${py}a${pr} ${pr} 0 1 0 ${-2 * pr} 0a${pr} ${pr} 0 1 0 ${2 * pr} 0`;
  }
  return d;
}

const GARLAND = (() => {
  const blooms: Bloom[] = [];
  const leaves: Leaf[] = [];
  // The swag: five scallops between six hanging points along the top.
  const xs = [0, 80, 160, 240, 320, 400];
  const top = 5;
  const dip = 36; // each scallop bottoms out at y 20.5
  let swag = `M0 ${top}`;
  const bottomColors = [G_PINK, G_GOLD, G_PINK, G_GOLD, G_PINK];
  const sideColors = [G_GOLD, G_CORAL, G_GOLD, G_CORAL, G_GOLD];
  for (let i = 0; i < 5; i++) {
    const p0: Pt = [xs[i], top];
    const c: Pt = [xs[i] + 40, dip];
    const p2: Pt = [xs[i + 1], top];
    swag += `Q${c[0]} ${c[1]} ${p2[0]} ${p2[1]}`;
    const bottom = onCurve(p0, c, p2, 0.5);
    blooms.push({ x: bottom.x, y: bottom.y, r: 4, color: bottomColors[i] });
    for (const t of [0.2, 0.8]) {
      const p = onCurve(p0, c, p2, t);
      blooms.push({ x: p.x, y: p.y, r: 3, color: sideColors[i] });
    }
    // two leaves either side of the bottom flower, angled down and out
    const l = onCurve(p0, c, p2, 0.38);
    const rt = onCurve(p0, c, p2, 0.62);
    leaves.push({ x: l.x, y: l.y, angle: l.angle + 145 }, { x: rt.x, y: rt.y, angle: rt.angle + 35 });
  }
  // The drops: one strand down each curtain edge, mirrored.
  const drops: string[] = [];
  for (const mirror of [false, true]) {
    const X = (x: number) => (mirror ? 400 - x : x);
    const A = (a: number) => (mirror ? 180 - a : a);
    const p0: Pt = [5, 6];
    const c: Pt = [15, 52];
    const p2: Pt = [9, 100]; // the last flower ends at y 104
    drops.push(`M${X(p0[0])} ${p0[1]}Q${X(c[0])} ${c[1]} ${X(p2[0])} ${p2[1]}`);
    for (const [t, side] of [[0.22, 1], [0.5, -1], [0.78, 1]] as const) {
      const p = onCurve(p0, c, p2, t);
      leaves.push({ x: X(p.x), y: p.y, angle: A(p.angle - side * 50) });
    }
    for (const [t, color, r] of [[0.36, G_PINK, 3.5], [0.64, G_GOLD, 3.5], [1, G_PINK, 4]] as const) {
      const p = onCurve(p0, c, p2, t);
      blooms.push({ x: X(p.x), y: p.y, r, color });
    }
    blooms.push({ x: X(7), y: 7, r: 4, color: G_CORAL }); // where the drop meets the swag
  }
  return {
    swag,
    drops,
    buds: xs.slice(1, -1),
    leaves: leaves.map((l) => `translate(${r1(l.x)} ${r1(l.y)}) rotate(${Math.round(l.angle)})`),
    blooms: blooms.map((b) => ({ d: petals(b.x, b.y, b.r), cx: r1(b.x), cy: r1(b.y), r: r1(b.r * 0.34), color: b.color })),
  };
})();

function Garlands() {
  return (
    <g>
      <path d={GARLAND.swag} stroke={G_LEAF} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d={GARLAND.swag} stroke={G_CREAM} strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="5 4" strokeLinecap="round" fill="none" />
      {GARLAND.drops.map((d) => (
        <path key={d} d={d} stroke={G_LEAF} strokeWidth="3" strokeLinecap="round" fill="none" />
      ))}
      {GARLAND.leaves.map((transform) => (
        <path key={transform} d={LEAF_PATH} fill={G_LEAF} transform={transform} />
      ))}
      {GARLAND.buds.map((x) => (
        <circle key={x} cx={x} cy="6" r="2.6" fill={G_GOLD} />
      ))}
      {GARLAND.blooms.map((b) => (
        <Fragment key={b.d}>
          {/* the cream rim sits under the petals, so each flower reads on the curtain and on a pale backdrop */}
          <path d={b.d} fill={b.color} stroke={G_CREAM} strokeWidth="1.3" paintOrder="stroke" />
          <circle cx={b.cx} cy={b.cy} r={b.r} fill={b.color === G_GOLD ? G_CREAM : G_GOLD} />
        </Fragment>
      ))}
    </g>
  );
}
