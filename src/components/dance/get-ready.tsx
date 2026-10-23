"use client";

import { useRef, useState, useTransition } from "react";
import type { StageData, Look } from "@/actions/dance";
import { setLook } from "@/actions/dance";
import { Pirouette } from "@/components/dance/pirouette";
import { StageBox } from "@/components/dance/stage";
import { useDancePlayer } from "@/lib/dance-player";
import { COSTUMES, STAGES, MUSIC, SPARKLES, QUIET_KEY, NONE_KEY, type CatalogItem } from "@/lib/dance-content";
import { SONGS, sequencer } from "@/lib/music";
import { getAudioContext, masterOut, setVolume, tone } from "@/lib/sound";

type RowKind = keyof Look;

const ROW_TITLE: Record<RowKind, string> = { costume: "Costume", stage: "Stage", music: "Music", sparkle: "Sparkle style" };

/**
 * Step 1: the dress rehearsal (GAME-DESIGN.md §3.6, §5.1). Pirouette in her
 * last look on her chosen stage, a quiet banner, and four choice cards. A card
 * opens its row as its own screen. Nothing is required: "Next" is always enabled.
 */
export function GetReady({
  data,
  look,
  decorations,
  onLook,
  onNext,
}: {
  data: StageData;
  look: Look;
  /** Tonight's decorations, frozen at open. */
  decorations: string[];
  onLook: (patch: Partial<Look>) => void;
  onNext: () => void;
}) {
  const [row, setRow] = useState<RowKind | null>(null);
  // Frozen when the step opens: the first pick writes today's row, and the banner must not vanish under her.
  const [banner] = useState(() => ({
    today: data.bannerToday,
    since: data.hasRowToday ? [] : data.bannerSince,
  }));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const rig = useRef<HTMLDivElement>(null);
  const player = useDancePlayer(rig, { sound: data.settings.sound });
  const calm = data.settings.reducedMotion;

  function save(patch: Partial<Look>) {
    const nextLook = { ...look, ...patch };
    onLook(patch);
    setError(null);
    startTransition(async () => {
      try {
        // The whole look on screen: the first write never falls back to the column
        // defaults, and the last request to arrive always carries complete state.
        await setLook(nextLook);
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t save — try again.");
      }
    });
  }

  function next() {
    // The row must exist even when she changed nothing: it is what retires the banner.
    if (!data.hasRowToday) save({});
    sequencer.stop(0.3);
    onNext();
  }

  if (row) {
    return (
      <PickerRow
        kind={row}
        data={data}
        value={look[row]}
        onPick={(key) => save({ [row]: key } as Partial<Look>)}
        onBack={() => { sequencer.stop(0.3); setRow(null); }}
      />
    );
  }

  const musicName = look.music === QUIET_KEY ? "Quiet" : MUSIC.find((m) => m.key === look.music)?.name ?? "Music Box";

  return (
    <div className="space-y-3">
      <div>
        <StageBox stageKey={look.stage} curtains="open" decorations={decorations}>
          <Pirouette
            ref={rig}
            size={220}
            costume={look.costume}
            sway={!calm}
            onTap={() => { setVolume(data.settings.volume); player.playMove("twirl"); }}
          />
        </StageBox>
        <p className="mt-1 text-xs text-muted text-center">{musicName}</p>
      </div>

      {(banner.today || banner.since.length > 0) && (
        <div className="rounded-[1.25rem] bg-accent-soft/60 border border-accent/40 px-4 py-3 text-sm">
          {banner.today && <p className="font-medium">{banner.today}</p>}
          {banner.since.length > 0 && (
            <p className="text-muted">New since last time: {banner.since.join(" · ")}</p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-accent-deep px-1">⚠ {error}</p>}

      <div className="grid grid-cols-2 gap-3">
        {(["costume", "stage", "music", "sparkle"] as RowKind[]).map((kind) => (
          <button
            key={kind}
            onClick={() => setRow(kind)}
            className="rounded-[1.25rem] bg-surface border border-line p-3 text-left active:bg-accent-soft/40"
          >
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">{ROW_TITLE[kind]}</p>
            <div className="mt-2 flex items-center gap-3">
              <Tile kind={kind} itemKey={look[kind]} size={64} selected={false} locked={false} />
              <p className="font-semibold leading-tight">{nameOf(kind, look[kind])}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={next}
        className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm active:scale-[0.99] transition-transform"
      >
        Next: Choose a dance
      </button>
    </div>
  );
}

function itemsFor(kind: RowKind): CatalogItem[] {
  switch (kind) {
    case "costume": return COSTUMES;
    case "stage": return STAGES;
    case "music": return MUSIC;
    case "sparkle": return SPARKLES;
  }
}

function nameOf(kind: RowKind, key: string): string {
  if (kind === "music" && key === QUIET_KEY) return "Quiet";
  if (kind === "sparkle" && key === NONE_KEY) return "None";
  return itemsFor(kind).find((i) => i.key === key)?.name ?? key;
}

/** One row as its own screen: tiles four per line, chosen ringed, locked dimmed with "at N" once shipped. */
function PickerRow({
  kind, data, value, onPick, onBack,
}: {
  kind: RowKind; data: StageData; value: string; onPick: (key: string) => void; onBack: () => void;
}) {
  const unlocked = new Set(data.unlockedKeys);
  const items = itemsFor(kind).filter((i) => i.season === 1 || data.nMax >= 50);
  const permanent = kind === "music" ? [{ key: QUIET_KEY, name: "Quiet" }] : kind === "sparkle" ? [{ key: NONE_KEY, name: "None" }] : [];

  function pick(key: string) {
    if (data.settings.sound) {
      setVolume(data.settings.volume);
      tick();
    }
    onPick(key);
    if (kind === "music" && data.settings.sound && data.settings.music) {
      const song = SONGS[key];
      if (song && key !== QUIET_KEY) sequencer.preview(song, 2000);
      else sequencer.stop(0.3);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[1.25rem] bg-surface border border-line p-4">
        <p className="text-xs uppercase tracking-wider text-muted font-semibold">{ROW_TITLE[kind]}</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {permanent.map((p) => (
            <TileButton key={p.key} kind={kind} itemKey={p.key} name={p.name} selected={value === p.key} locked={false} onClick={() => pick(p.key)} />
          ))}
          {items.map((i) => {
            const locked = !unlocked.has(i.key);
            return (
              <TileButton
                key={i.key}
                kind={kind}
                itemKey={i.key}
                name={i.name}
                selected={value === i.key}
                locked={locked}
                hint={locked && i.shipped ? `at ${i.unlockAt}` : undefined}
                isNew={!locked && i.unlockAt > 1 && i.unlockAt === data.n}
                onClick={locked ? undefined : () => pick(i.key)}
              />
            );
          })}
        </div>
      </div>
      <button onClick={onBack} className="w-full h-16 rounded-2xl bg-accent text-white text-xl font-semibold shadow-sm">
        Back to Get ready
      </button>
    </div>
  );
}

function TileButton({
  kind, itemKey, name, selected, locked, hint, isNew, onClick,
}: {
  kind: RowKind; itemKey: string; name: string; selected: boolean; locked: boolean; hint?: string; isNew?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={selected}
      aria-label={`${name}${locked ? (hint ? `, ${hint}` : ", not yet") : ""}`}
      className={`flex flex-col items-center gap-1 rounded-xl p-1.5 ${locked ? "opacity-40" : ""} ${selected ? "ring-2 ring-accent bg-accent-soft/40" : ""} ${isNew && !selected ? "ring-2 ring-gold" : ""}`}
    >
      <Tile kind={kind} itemKey={itemKey} size={72} selected={selected} locked={locked} />
      <span className="text-[11px] leading-tight text-center">{name}</span>
      {hint && <span className="text-[10px] text-muted -mt-0.5">{hint}</span>}
    </button>
  );
}

/** A 72 px picture of one catalog item. */
function Tile({ kind, itemKey, size, locked }: { kind: RowKind; itemKey: string; size: number; selected: boolean; locked: boolean }) {
  const box = { width: size, height: size };
  if (kind === "costume") {
    return (
      <div className="rounded-xl bg-background flex items-end justify-center overflow-hidden" style={box}>
        <Pirouette size={size * 0.72} costume={itemKey} />
      </div>
    );
  }
  if (kind === "stage") {
    const bg = itemKey === "moon_night" ? "linear-gradient(180deg,#1f2a4a,#4a6fa5)" : "linear-gradient(180deg,#fbe9e5,#f1e6dc)";
    return <div className="rounded-xl border border-line" style={{ ...box, background: locked ? "#eee4dc" : bg }} />;
  }
  if (kind === "music") {
    const m = MUSIC.find((x) => x.key === itemKey);
    return (
      <div className="rounded-xl bg-background flex flex-col items-center justify-center" style={box}>
        {itemKey === QUIET_KEY ? (
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden><rect x="4" y="12" width="22" height="13" rx="3" fill="#d9c7b5" /><rect x="3" y="8" width="24" height="5" rx="2" fill="#cdb79e" /></svg>
        ) : (
          <>
            <span className="text-2xl leading-none" aria-hidden>🎵</span>
            {m && <span className="text-[10px] text-muted mt-1">{m.tempoWord}</span>}
          </>
        )}
      </div>
    );
  }
  const sp = SPARKLES.find((x) => x.key === itemKey);
  return (
    <div className="rounded-xl bg-background flex items-center justify-center" style={box}>
      {itemKey === NONE_KEY ? null : (
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
          <path d="M14 2 l2.6 7 7.4 2.6 -7.4 2.6 -2.6 7.4 -2.6 -7.4 -7.4 -2.6 7.4 -2.6 z" fill={sp?.color ?? "#e6b422"} />
        </svg>
      )}
    </div>
  );
}

/** The 80 ms triangle tick for a tile tap. */
function tick() {
  const ac = getAudioContext();
  const out = masterOut();
  if (!ac || !out) return;
  tone(ac, out, 880, ac.currentTime, 0.08, 0.3, "triangle", 0.005);
}
