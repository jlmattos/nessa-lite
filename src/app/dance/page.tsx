import { getStageData } from "@/actions/dance";
import { DanceFlow } from "@/components/dance/dance-flow";

export const dynamic = "force-dynamic";

export default async function DancePage() {
  const data = await getStageData();
  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <h1 className="text-3xl font-bold tracking-tight">Pirouette’s stage</h1>
      <p className="text-sm text-muted mt-1">Finish today’s workout, then come to the stage. 🩰</p>
      <div className="mt-5">
        {/* A fresh flow whenever the stage opens, closes or reopens, so "Open the curtains" starts at Get ready. */}
        <DanceFlow key={`${data.unlocked}-${data.closed}`} data={data} />
      </div>
    </div>
  );
}
