-- Migration to add admin screening workflow to patients table

ALTER TABLE patients
ADD COLUMN screening_status TEXT DEFAULT 'pending_screening' CHECK (screening_status IN ('pending_screening', 'approved', 'rejected')),
ADD COLUMN screening_notes TEXT,
ADD COLUMN screened_by TEXT,
ADD COLUMN screened_at TIMESTAMPTZ;

CREATE INDEX idx_patients_screening_status ON patients (screening_status);

-- Update existing patients: those already enrolled should be approved
UPDATE patients 
SET screening_status = 'approved', 
    screened_by = 'system', 
    screened_at = NOW()
WHERE trial_status = 'enrolled' OR trial_status = 'completed';

-- Patients in screening should remain pending
UPDATE patients 
SET screening_status = 'pending_screening'
WHERE trial_status = 'screening';
