# Obel Grade Source-of-Truth Fix — Plan

## Current State

- `AddAssessmentForm` already lets the veterinarian **directly select** an Obel grade 0–4 via the `ObelGradeReference` component; it is stored as `obel_grade`.
- There is **no formula** that derives Obel from pain, mobility, digital pulse, or vitals.
- `ObelScoreChart` renders `assessment.obel_grade` and assumes the 0–4 scale.
- Several inconsistencies make the chart/source-of-truth unclear:
  - `ObelScoreChart` maps only grades 1–4 in its legend; grade 0 renders an invisible 0 % bar.
  - Chart text labels differ from the `ObelGradeReference` descriptions and from the standard Obel laminitis grade definitions.
  - `MonitoringChecklist` labels the item “Pain Score (Obel Grade)”, conflating two separate fields.
  - `xmlExport.ts` codelist for `digital_pulse_score` only covers 0–3 and labels differ from the form.
  - `xmlExport.ts` declares `temperature` unit as Celsius while the form collects °F.
  - SQL `treatment_outcomes` permits Obel 0–5; `clinical_assessments` has no CHECK.
  - No runtime validation/backfill exists for legacy records that may contain invalid `obel_grade` values.

## Decision

Per the standard Obel laminitis grading system, the Obel grade is a **direct clinical observational selection** (0–4) made by the veterinarian. It must **not** be derived from pain/mobility/vitals. The authoritative value is the vet-selected `obel_grade`.

## Implementation Plan

### 1. Runtime backfill & validation (`src/lib/uibakeryDataMock.ts`)
- Add `normalizeObelGrade(raw: unknown): number | null` that clamps/rounds to 0–4 and preserves `null`.
- Hook `getAssessments()` to run once per app session:
  - Load the raw array.
  - For each record whose `obel_grade` is outside 0–4, non-integer, or non-numeric:
    - Snapshot the original into `obel_grade_original`.
    - Replace `obel_grade` with the normalized value.
  - If any changed, save and write an audit entry (`UPDATE`/`clinical_assessment`, reason `"Backfill to valid 0-4 Obel grade"`).
- In `addClinicalAssessment` mock handler, clamp `obelGrade` to 0–4 before saving and audit exactly what is stored.

### 2. Form validation (`src/components/AddAssessmentForm.tsx`)
- Tighten the Zod schema so `obelGrade` must be `'0'|'1'|'2'|'3'|'4'` (not just non-empty).
- Add range checks for numeric optional fields (pain 0–10, mobility 0–10, digital pulse 0–4, heart rate ≥ 0, respiratory rate ≥ 0, temperature ≥ 0).
- Keep the existing direct Obel selector; update the form label from sr-only to visible: **“Obel Laminitis Grade (0–4)”**.
- Add a help line explaining that the grade is a clinician-judged gait/lameness assessment, not calculated from vitals.

### 3. Chart alignment (`src/components/ObelScoreChart.tsx`)
- Ensure grade 0 is visible (minimum bar height + distinct color).
- Align color mapping and legend labels with `ObelGradeReference`/standard Obel definitions.
- Keep trend logic based on `obel_grade` (source of truth).

### 4. Monitoring checklist (`src/components/MonitoringChecklist.tsx`)
- Split the conflated item into:
  - **Obel Grade** — completed when `obel_grade !== null`.
  - **Pain Score** — completed when `pain_score !== null`.

### 5. Export codelist fixes (`src/lib/xmlExport.ts`)
- Add value `4` to `digital_pulse_score` codelist with label `Bounding`, align `0` label with form (`None`).
- Change `temperature` unit label to `Fahrenheit` to match the form.

### 6. Schema migrations
- Add a new migration `src/migrations/1749600000_clamp_obel_grade.sql`:
  - Add CHECK constraint on `clinical_assessments.obel_grade` (0–4 or NULL).
  - Tighten `treatment_outcomes.obel_grade` CHECK from 0–5 to 0–4.
- These SQL files are for documentation/deployment; the localStorage mock handles runtime backfill.

### 7. Tests
- `src/__tests__/obelGrade.test.ts` — pure unit tests for `normalizeObelGrade` covering:
  - valid values 0–4 unchanged,
  - `null`/`undefined` remain `null`,
  - out-of-range (`-1`, `5`, `99`) clamped,
  - floats rounded then clamped (`2.7 → 3`, `2.2 → 2`),
  - non-numeric strings/objects become `null`.
- `src/__tests__/obelAssessmentMigration.test.tsx` — integration test seeding invalid records, calling `loadPatientCaseDataAction`, and asserting normalized values plus audit trail.
- `src/__tests__/obelScoreChart.test.tsx` — render the chart with grades 0–4 and assert visible labels/colors, trend text, and empty state.
- `src/__tests__/addAssessmentForm.test.tsx` — render `AddAssessmentForm`, submit with invalid/blank Obel/pain, assert validation errors; submit valid data and assert storage.
- Update existing tests if any expectations changed (expected: none).

### 8. Acceptance Criteria
1. The Obel grade displayed on the progression chart is always the directly entered `obel_grade` value (0–4), never a derived calculation.
2. Legacy assessments with invalid `obel_grade` values are automatically backfilled to a valid 0–4 integer without data loss (original value preserved in `obel_grade_original`).
3. `AddAssessmentForm` rejects non-Obel values and out-of-range numeric inputs with clear validation messages.
4. `ObelScoreChart` renders all grades 0–4, including a visible grade 0 bar, and uses consistent labels/colors.
5. `MonitoringChecklist` shows separate Obel Grade and Pain Score items.
6. XML export codelists/units match the form.
7. All tests pass; lint and build succeed.

## Files to Modify
- `src/lib/uibakeryDataMock.ts`
- `src/components/AddAssessmentForm.tsx`
- `src/components/ObelScoreChart.tsx`
- `src/components/MonitoringChecklist.tsx`
- `src/lib/xmlExport.ts`
- `src/migrations/1749600000_clamp_obel_grade.sql` (new)
- `src/__tests__/obelGrade.test.ts` (new)
- `src/__tests__/obelAssessmentMigration.test.tsx` (new)
- `src/__tests__/obelScoreChart.test.tsx` (new)
- `src/__tests__/addAssessmentForm.test.tsx` (new)
