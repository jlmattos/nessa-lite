"use client";

import { useRef, useState } from "react";
import { Pirouette } from "@/components/dance/pirouette";
import { useDancePlayer } from "@/lib/dance-player";
import { MOVES, PRESET_DANCES, type MoveKey } from "@/lib/dance-content";
import { CARNIVAL_PARADE, MUSIC_BOX, sequencer, type Song } from "@/lib/music";
import { setVolume, type Volume } from "@/lib/sound";

const SIZES = [120, 170, 220];
const TEMPOS = [56, 66, 84];

export function SpikeView() {
  const rig = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(170);
  const [bpm, setBpm] = useState(66);
  const [songKey, setSongKey] = useState<"music_box" | "carnival_parade" | "quiet">("music_box");
  const [volume, setVol] = useState<Volume>("soft");
  const [musicOnly, setMusicOnly] = useState(false);
  const player = useDancePlayer(rig, { sound: true });

  const base: Song | null = songKey === "music_box" ? MUSIC_BOX : songKey === "carnival_parade" ? CARNIVAL_PARADE : null;
  const song: Song | null = base ? { ...base, bpm } : null;
  const busy = player.state === "playing" || player.state === "bowing";
  const currentDance = useRef<MoveKey[]>([]);
  const currentName = player.currentIndex != null ? MOVES.find((m) => m.key === currentDance.current[player.currentIndex!])?.name : null;

  function playDance(moves: MoveKey[]) {
    setMusicOnly(false);
    currentDance.current = moves;
    player.play(moves, song, bpm);
  }

  function stopAll() {
    setMusicOnly(false);
    player.stop(0.6);
  }

  return (
    <div className="space-y-4">
      {/* The stage */}
      <div
        className="rounded-[1.25rem] border border-line overflow-hidden"
        style={{ background: "linear-gradient(180deg, #fbe9e5 0%, #faf6f1 70%)" }}
      >
        <div className="relative flex flex-col items-center pt-8 pb-6 px-10">
          <div className="absolute inset-y-0 left-0 w-7 bg-accent/60 rounded-r-2xl" aria-hidden />
          <div className="absolute inset-y-0 right-0 w-7 bg-accent/60 rounded-l-2xl" aria-hidden />
          <div className="absolute bottom-0 inset-x-7 h-6 bg-line/70 rounded-t-[50%]" aria-hidden />
          <Pirouette ref={rig} size={size} dancing={busy || musicOnly} />
          <p className="mt-3 font-semibold text-lg h-7">
            {player.state === "bowing" ? "Bow" : currentName ?? (player.state === "done" ? "The end." : "Pirouette")}
          </p>
        </div>
      </div>

      {/* Single moves */}
      <Card title="One move at a time">
        <div className="grid grid-cols-2 gap-2">
          {MOVES.map((m) => (
            <button
              key={m.key}
              onClick={() => player.playMove(m.key, bpm)}
              disabled={busy}
              className="h-14 rounded-xl border border-line bg-surface font-semibold text-lg active:bg-accent-soft disabled:opacity-50"
            >
              {m.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">Each tap plays the move once with its note. Tap the same one twice to check it restarts.</p>
      </Card>

      {/* Dances */}
      <Card title="A whole dance, on the beat">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PRESET_DANCES).map(([key, d]) => (
            <button
              key={key}
              onClick={() => playDance(d.moves)}
              disabled={busy}
              className="h-14 rounded-xl bg-accent text-white font-semibold text-lg shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {d.name}
            </button>
          ))}
          <button
            onClick={() => { if (song) { setMusicOnly(true); sequencer.start(song); } }}
            disabled={busy || !song}
            className="h-14 rounded-xl border border-line bg-surface font-semibold active:bg-accent-soft disabled:opacity-50"
          >
            Music only
          </button>
          <button onClick={stopAll} className="h-14 rounded-xl border border-line bg-surface font-semibold active:bg-accent-soft">
            Stop
          </button>
        </div>
      </Card>

      {/* Knobs */}
      <Card title="Try different settings">
        <Row label="Size">
          {SIZES.map((s) => (
            <Chip key={s} on={size === s} onClick={() => setSize(s)}>{s} px</Chip>
          ))}
        </Row>
        <Row label="Tempo">
          {TEMPOS.map((t) => (
            <Chip key={t} on={bpm === t} onClick={() => setBpm(t)}>{t} bpm</Chip>
          ))}
        </Row>
        <Row label="Music">
          <Chip on={songKey === "music_box"} onClick={() => { setSongKey("music_box"); setBpm(MUSIC_BOX.bpm); }}>Music Box</Chip>
          <Chip on={songKey === "carnival_parade"} onClick={() => { setSongKey("carnival_parade"); setBpm(CARNIVAL_PARADE.bpm); }}>Carnival Parade</Chip>
          <Chip on={songKey === "quiet"} onClick={() => setSongKey("quiet")}>Quiet (clock only)</Chip>
        </Row>
        <Row label="Volume">
          <Chip on={volume === "soft"} onClick={() => { setVol("soft"); setVolume("soft"); }}>soft</Chip>
          <Chip on={volume === "medium"} onClick={() => { setVol("medium"); setVolume("medium"); }}>medium</Chip>
        </Row>
      </Card>

      {/* What to look for */}
      <Card title="Checklist for the iPad">
        <ol className="list-decimal pl-5 space-y-1.5 text-sm">
          <li>Tap any move first. Does the note play? (Audio needs one tap before it can start.)</li>
          <li>Twirl and Big spin at 220 px: are the spins smooth and comfortable to watch? Try 84 bpm (fastest) and 56 bpm.</li>
          <li>Plié, Reach, Arabesque: do the legs and arms pivot at the right spots, with no jumping?</li>
          <li>Little Waltz with Music Box: do moves land on the beat? Does the loop repeat without a hiccup?</li>
          <li>Play a dance, then press the Home button or switch apps. Everything should stop.</li>
          <li>Music Box (gentle) and Carnival Parade (brightest): do they sound like something she’d enjoy, or should we use recorded music?</li>
          <li>Rotate the iPad. Does the stage still fit without horizontal scrolling?</li>
        </ol>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] bg-surface border border-line shadow-[0_1px_3px_rgba(61,52,54,0.06)] p-4">
      <p className="text-xs uppercase tracking-wider text-muted font-semibold mb-3">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1.5 flex-wrap">
      <span className="text-sm text-muted w-16 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-3 py-1.5 text-sm font-medium border ${on ? "bg-accent text-white border-accent" : "bg-surface text-muted border-line"}`}
    >
      {children}
    </button>
  );
}
