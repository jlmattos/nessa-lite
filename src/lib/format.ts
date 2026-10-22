/** "Oct 22" — a date she can place without doing arithmetic. */
export function friendlyDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Wednesday, October 22" — for a page heading. */
export function longDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** "10 times", "30 seconds", or the literal, pressure-free default. */
export function targetLabel(reps: number | null, secs: number | null): string {
  if (secs != null && secs > 0) return `${secs} seconds`;
  if (reps != null && reps > 0) return `${reps} times`;
  return "until it feels done";
}
