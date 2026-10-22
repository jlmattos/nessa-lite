import { listRoutines } from "@/actions/routine";
import { RoutineEditor } from "@/components/routine-editor";

export const dynamic = "force-dynamic";

export default async function RoutinePage() {
  const routines = await listRoutines();
  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <h1 className="text-3xl font-bold tracking-tight">Routines</h1>
      <p className="text-sm text-muted mt-1">
        The movements Nessa rotates through — tap anything to change it.
      </p>
      <div className="mt-5">
        <RoutineEditor routines={routines} />
      </div>
    </div>
  );
}
