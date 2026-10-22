/**
 * Day identity in the household's home timezone. Server code runs in UTC on
 * Vercel, so a workout logged after 8pm ET would otherwise be stamped with
 * tomorrow's date (a bug lift-log hit for real).
 */
const HOME_TZ = process.env.HOME_TZ ?? "America/New_York";

/** Today's date (YYYY-MM-DD) in the home timezone. */
export function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: HOME_TZ }).format(new Date());
}
