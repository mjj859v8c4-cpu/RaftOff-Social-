import type { DurationChoice } from "@/lib/validation";

export const DURATION_CHOICES: { id: DurationChoice; label: string }[] = [
  { id: "60", label: "1 hour" },
  { id: "120", label: "2 hours" },
  { id: "240", label: "4 hours" },
  { id: "rest_of_day", label: "Rest of day" },
];

/** Minutes remaining until local midnight in the given IANA timezone. */
export function minutesUntilEndOfDay(timeZone: string, now: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(now);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const secondsSinceMidnight = (get("hour") % 24) * 3600 + get("minute") * 60 + get("second");
    return Math.max(15, Math.round((24 * 3600 - secondsSinceMidnight) / 60));
  } catch {
    const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return Math.max(15, Math.round((24 * 3600 - secondsSinceMidnight) / 60));
  }
}

/** Turn a duration choice into an absolute minute count for expires_at math. */
export function resolveDurationMinutes(choice: DurationChoice, timeZone: string): number {
  if (choice === "rest_of_day") return minutesUntilEndOfDay(timeZone);
  return Number(choice);
}
