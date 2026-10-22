import { getDanceData } from "@/actions/dance";
import { DanceStage } from "@/components/dance-stage";

export const dynamic = "force-dynamic";

export default async function DancePage() {
  const data = await getDanceData();
  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <h1 className="text-3xl font-bold tracking-tight">Pirouette’s stage</h1>
      <p className="text-sm text-muted mt-1">Finish today’s workout, then come dance. 🩰</p>
      <div className="mt-5">
        <DanceStage data={data} />
      </div>
    </div>
  );
}
