// Obel laminitis grade utilities
// The Obel grade is a clinician-judged gait/lameness grade from 0 (sound) to 4 (non-ambulatory).
// It is NOT derived from pain score, mobility score, digital pulse, or vital signs.

export const OBEL_MIN = 0;
export const OBEL_MAX = 4;

export type ObelGrade = 0 | 1 | 2 | 3 | 4;

/**
 * Snap an incoming value to the valid Obel 0–4 integer range.
 * - null/undefined stay null
 * - non-numeric or non-finite values become null
 * - floats are rounded, then clamped
 * - integers outside 0–4 are clamped to the nearest bound
 */
export function normalizeObelGrade(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  return Math.max(OBEL_MIN, Math.min(OBEL_MAX, rounded));
}

/**
 * Standard clinical descriptions for each Obel grade, aligned with the
 * reference selector and the progression chart.
 */
export const OBEL_GRADE_DESCRIPTIONS: Record<ObelGrade, string> = {
  0: 'Sound — no lameness at any gait; rhythmic, symmetrical stride.',
  1: 'Mild — lameness visible at trot or on a hard surface; subtle head nod or shortened stride.',
  2: 'Moderate — obvious lameness at walk on a hard surface; choppy gait, weight shifting.',
  3: 'Severe — reluctant to walk even on a soft surface; marked head nod, difficulty lifting a foot.',
  4: 'Very severe — refuses to move or is recumbent; emergency intervention likely required.',
};
