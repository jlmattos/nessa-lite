"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Settings } from "@/lib/settings";
import { updateSettings } from "@/actions/settings";

/** Two switches, plain words. Jose or Nessa can flip them; they apply everywhere. */
export function SettingsCard({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(key: keyof Settings) {
    startTransition(async () => {
      await updateSettings(key === "sound" ? { sound: !settings.sound } : { reducedMotion: !settings.reducedMotion });
      router.refresh();
    });
  }

  return (
    <div className="rounded-[1.25rem] bg-surface border border-line p-4">
      <p className="text-xs uppercase tracking-wider text-muted font-semibold">How the app feels</p>
      <div className="mt-2 divide-y divide-line/70">
        <Toggle
          label="Soft sounds"
          sub="A little chime when you tap Done, and a chord when you finish"
          on={settings.sound}
          busy={isPending}
          onClick={() => toggle("sound")}
        />
        <Toggle
          label="Calm mode"
          sub="Turns off the moving things and sparkles"
          on={settings.reducedMotion}
          busy={isPending}
          onClick={() => toggle("reducedMotion")}
        />
      </div>
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
