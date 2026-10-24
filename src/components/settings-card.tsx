"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Settings } from "@/lib/settings";
import { updateSettings } from "@/actions/settings";
import { setVolume } from "@/lib/sound";
import { unwrap } from "@/lib/action-result";

/**
 * The preferences card (GAME-DESIGN.md §7 Controls), in the doc's order.
 * Plain words, two-state switches and two-way choices. Jose or Nessa can
 * change them; they apply everywhere. "Show caught sparkles" arrives in Phase 3.
 */
export function SettingsCard({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(patch: Partial<Settings>) {
    setError(null);
    startTransition(async () => {
      try {
        unwrap(await updateSettings(patch));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn’t work — try again.");
      }
    });
  }

  return (
    <div className="rounded-[1.25rem] bg-surface border border-line p-4">
      <p className="text-xs uppercase tracking-wider text-muted font-semibold">How the app feels</p>
      <div className="mt-2 divide-y divide-line/70">
        <Toggle
          label="Sounds"
          sub="Chimes when you tap Done, and the notes Pirouette dances to"
          on={settings.sound}
          busy={isPending}
          onClick={() => save({ sound: !settings.sound })}
        />
        <Toggle
          label="Music"
          sub="The music loops on the stage. Quiet is also a tile you can pick."
          on={settings.music}
          busy={isPending}
          onClick={() => save({ music: !settings.music })}
        />
        <Choice
          label="Volume"
          value={settings.volume}
          options={[["soft", "soft"], ["medium", "medium"]]}
          busy={isPending}
          onPick={(v) => { setVolume(v); save({ volume: v }); }}
        />
        <Choice
          label="Sparkle amount"
          value={settings.sparkleAmount}
          options={[["lots", "lots"], ["some", "some"]]}
          busy={isPending}
          onPick={(v) => save({ sparkleAmount: v })}
        />
        <Toggle
          label="Sparkle catch"
          sub="A sparkle floats to Pirouette during the dance; tap when it reaches her. You can also just watch."
          on={settings.sparkleTaps}
          busy={isPending}
          onClick={() => save({ sparkleTaps: !settings.sparkleTaps })}
        />
        <Toggle
          label="Bow showers"
          sub="Petals, confetti and fireworks at the bow, once the stage has earned them"
          on={settings.bowShowers}
          busy={isPending}
          onClick={() => save({ bowShowers: !settings.bowShowers })}
        />
        <Toggle
          label="Calm mode"
          sub="Turns off the moving things and sparkles"
          on={settings.reducedMotion}
          busy={isPending}
          onClick={() => save({ reducedMotion: !settings.reducedMotion })}
        />
      </div>
      {error && <p className="text-sm text-accent-deep mt-2">⚠ {error}</p>}
    </div>
  );
}

function Toggle({ label, sub, on, busy, onClick }: { label: string; sub: string; on: boolean; busy: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      role="switch"
      aria-checked={on}
      className="w-full flex items-center gap-3 py-3 text-left disabled:opacity-60"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted mt-0.5">{sub}</p>
      </div>
      <span
        className={`relative inline-block w-12 h-7 rounded-full transition-colors shrink-0 ${on ? "bg-accent" : "bg-line"}`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

function Choice<T extends string>({
  label, value, options, busy, onPick,
}: {
  label: string; value: T; options: [T, string][]; busy: boolean; onPick: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <p className="flex-1 font-medium">{label}</p>
      <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            disabled={busy}
            onClick={() => onPick(v)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium border disabled:opacity-60 ${
              value === v ? "bg-accent text-white border-accent" : "bg-surface text-muted border-line"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
