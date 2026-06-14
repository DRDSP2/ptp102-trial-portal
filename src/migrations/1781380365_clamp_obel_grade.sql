--- -----------------------------------------------------------------------------
--- Clamp Obel grade to the valid 0–4 clinical range
--- -----------------------------------------------------------------------------
--- The application collects Obel laminitis grades as a direct clinician selection
--- on a 0–4 scale. This migration hardens the database to match that contract.
--- Existing localStorage deployments are backfilled at runtime by the mock layer.
--- -----------------------------------------------------------------------------

--- Harden clinical_assessments to the standard 0–4 Obel range.
ALTER TABLE clinical_assessments
ADD CONSTRAINT chk_clinical_assessments_obel_grade
CHECK (obel_grade IS NULL OR obel_grade BETWEEN 0 AND 4);

--- Tighten treatment_outcomes which previously allowed the invalid value 5.
ALTER TABLE treatment_outcomes
DROP CONSTRAINT IF EXISTS treatment_outcomes_obel_grade_check;

ALTER TABLE treatment_outcomes
ADD CONSTRAINT chk_treatment_outcomes_obel_grade
CHECK (obel_grade IS NULL OR obel_grade BETWEEN 0 AND 4);
