"use client";

import type { ProgressData } from "@/actions/progress";
import { COLLECTION } from "@/lib/collection";
import { FigurineCat } from "@/components/cats";
import { friendlyDate } from "@/lib/format";
import { SeasonMap } from "@/components/season-map";

export function CollectionView({ data }: { data: ProgressData }) {
  const nextCat = COLLECTION.find((c) => !data.earnedCats.includes(c.id));
  const toGo = nextCat ? nextCat.workouts - data.totalWorkouts : 0;

  return (
    <div className="space-y-4">
      {/* The shelf */}
      <div className="rounded-[1.25rem] bg-surface border border-line p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Cat friends</p>
          <p className="text-xs text-muted">{data.earnedCats.length} of {COLLECTION.length} collected</p>
        </div>
        <div className="grid grid-cols-5 gap-x-1 gap-y-3 mt-3">
          {COLLECTION.map((c) => {
            const earned = data.earnedCats.includes(c.id);
            return (
              <div key={c.id} className="text-center">
                <div className="relative inline-block">
                  <FigurineCat variant={c.id} size={56} locked={!earned} />
                  {!earned && (
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white/90" aria-hidden>
                      ?
                    </span>
                  )}
                </div>
                <p className={`text-[10px] leading-tight mt-0.5 ${earned ? "font-semibold" : "text-muted"}`}>
                  {earned ? c.name : c.hint}
                </p>
              </div>
            );
          })}
        </div>
        {nextCat && (
          <p className="text-sm mt-3">
            {toGo === 1 ? "One more workout" : `${toGo} more workouts`} and <span className="font-semibold">{nextCat.name} {nextCat.outfit}</span> arrives. 🐾
          </p>
        )}
        {!nextCat && <p className="text-sm mt-3">Every cat friend is here. Purr-fect! 🏆</p>}
      </div>

      {/* The Season map: the long story, next to the cats */}
      {data.season && <SeasonMap paths={data.season} rosettes={data.rosettes} />}

      {/* Friendly stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={data.workoutsThisMonth} label="workouts this month" />
        <StatCard value={data.totalWorkouts} label="workouts ever" />
      </div>

      {/* Recent workouts */}
      {data.recent.length > 0 && (
        <div className="rounded-[1.25rem] bg-surface border border-line p-4">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">Recent workouts</p>
          <div className="mt-2 space-y-1">
            {data.recent.map((w) => (
              <div key={w.id} className="flex items-center gap-3 py-1.5">
                <span className="text-xs text-muted w-12 shrink-0 tabular-nums">{friendlyDate(w.performedOn)}</span>
                <span className="flex-1 min-w-0 text-sm font-medium truncate">{w.routineName ?? "Workout"}</span>
                <span className="text-xs text-muted shrink-0">
                  {w.movementCount} movement{w.movementCount !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[1.25rem] bg-surface border border-line px-4 py-3 text-center">
      <p className="text-3xl font-bold text-accent-deep">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}
