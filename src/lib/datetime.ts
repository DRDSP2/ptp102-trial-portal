/**
 * Format a Date as the value of an <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
 * in LOCAL time.
 *
 * `new Date().toISOString().slice(0, 16)` produces UTC, which silently shifts
 * every clinical timestamp by the user's timezone offset (audit-trail defect,
 * UI_REVIEW.md P0 #8). Use this helper for all datetime-local form defaults.
 */
export function toLocalDatetimeInputValue(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
