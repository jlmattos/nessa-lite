/**
 * One question before leaving (GAME-DESIGN.md §5.2: "Leaving the editor with
 * unsaved moves asks once"). A screen with unsaved work registers a guard; the
 * bottom nav asks it before switching tabs. The guard returns true when it
 * took over (it shows its question and calls `go` once she has answered).
 */
type Guard = (go: () => void) => boolean;

let guard: Guard | null = null;

export function setLeaveGuard(next: Guard | null) {
  guard = next;
}

/** True when a guard is asking first; it will call `go` itself. */
export function askBeforeLeaving(go: () => void): boolean {
  return guard ? guard(go) : false;
}
