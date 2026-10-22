import { SpikeView } from "@/components/dance/spike-view";

/**
 * Phase 0 — the iPad spike (GAME-DESIGN.md §9). Not in the bottom nav and
 * needs no database: open /spike on the real iPad and work through the
 * checklist. Remove this page once Phase 1a replaces the Twirl button.
 */
export default function SpikePage() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <h1 className="text-3xl font-bold tracking-tight">Phase 0 · iPad spike</h1>
      <p className="text-sm text-muted mt-1">
        Pirouette’s rig, the beat clock, and one Music Box loop. For Jose to test on the iPad.
      </p>
      <div className="mt-5">
        <SpikeView />
      </div>
    </div>
  );
}
