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

export const AUDIT_TIME_ZONE = 'Europe/Dublin';

/**
 * Format an audit timestamp in the sponsor's declared inspection timezone.
 * The zone abbreviation is included so summer (IST) and winter (GMT) records
 * remain unambiguous when displayed or exported outside Ireland.
 */
export function formatAuditTimestamp(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : 'Invalid date';

  return new Intl.DateTimeFormat('en-IE', {
    timeZone: AUDIT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).format(date);
}

export function auditDateSlug(value: string | Date = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: AUDIT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
