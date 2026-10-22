"use client";

import { useState } from "react";
import Link from "next/link";
import type { DanceData } from "@/actions/dance";
import { BallerinaCat } from "@/components/ballerina-cat";

/**
 * Pirouette's stage. Locked until today's workout is finished. The game
 * itself is designed in GAME-DESIGN.md and not built yet — for now she twirls
 * on request, so Nessa can meet her early.
 */
export function DanceStage({ data }: { data: DanceData }) {
  const [twirl, setTwirl] = useState(0);
  const calm = data.settings.reducedMotion;

  return (
    <div className="space-y-4">
      <div
        className="rounded-[1.25rem] border border-line overflow-hidden"
        style={{ background: "linear-gradient(180deg, #fbe9e5 0%, #faf6f1 70%)" }}
      >
        <div className="relative flex flex-col items-center pt-8 pb-6 px-10">
          {/* curtains */}
          <div className="absolute inset-y-0 left-0 w-7 bg-accent/60 rounded-r-2xl" aria-hidden />
          <div className="absolute inset-y-0 right-0 w-7 bg-accent/60 rounded-l-2xl" aria-hidden />
          {/* stage floor */}
          <div className="absolute bottom-0 inset-x-7 h-6 bg-line/70 rounded-t-[50%]" aria-hidden />

          <div key={twirl} className={twirl > 0 && !calm ? "animate-lite-pirouette" : undefined}>
            <BallerinaCat size={170} dancing={data.unlocked && !calm} />
          </div>
          <p className="mt-3 font-semibold text-lg">Pirouette</p>
          <p className="text-xs text-muted">the ballerina cat</p>
        </div>
      </div>

      {data.unlocked ? (
        <Card>
          <p className="font-semibold">Dance time! 🩰</p>
          <p className="text-sm text-muted mt-1">
            You finished today’s workout. The dance game is still being built — for now, Pirouette will twirl whenever you ask.
          </p>
          <button
            onClick={() => setTwirl((n) => n + 1)}
            className="mt-4 w-full h-14 rounded-2xl bg-accent text-white text-lg font-semibold shadow-sm active:scale-[0.99] transition-transform"
          >
            Twirl! ✨
          </button>
        </Card>
      ) : (
        <Card>
          <p className="font-semibold">Pirouette is resting 💤</p>
          <p className="text-sm text-muted mt-1">
            Finish today’s workout and she’ll be ready to dance with you.
          </p>
          <Link
            href="/"
            className="mt-4 block w-full h-14 rounded-2xl border border-line bg-surface text-center leading-[3.5rem] font-semibold"
          >
            Go to today’s workout →
          </Link>
        </Card>
      )}

      <Card>
        <p className="text-xs uppercase tracking-wider text-muted font-semibold">Workouts so far</p>
        <p className="text-3xl font-bold text-accent-deep mt-1">{data.totalWorkouts}</p>
        <p className="text-xs text-muted mt-0.5">The more you do, the more Pirouette can show you.</p>
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] bg-surface border border-line shadow-[0_1px_3px_rgba(61,52,54,0.06)] p-4">
      {children}
    </div>
  );
}
