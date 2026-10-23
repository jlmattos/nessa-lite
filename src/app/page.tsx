import { getTodayData } from "@/actions/workouts";
import { TodayView } from "@/components/today-view";
import { longDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const data = await getTodayData();

  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{longDate(data.today)}</p>
          <h1 className="text-3xl font-bold tracking-tight mt-0.5">
            {data.workout ? data.workout.routineName ?? "Today’s workout" : "Hi Nessa! Ready to move?"}
          </h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="w-16 h-16 rounded-2xl shadow-sm shrink-0" />
      </div>
      <div className="mt-5">
        {/* Keyed by the day: a refresh the next morning starts clean, not on yesterday's picker or step. */}
        <TodayView key={data.today} data={data} />
      </div>
    </div>
  );
}
