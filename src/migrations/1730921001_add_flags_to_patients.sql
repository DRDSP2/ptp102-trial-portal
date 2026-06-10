-- Add flag system to patients table for marking suspicious entries
ALTER TABLE patients
ADD COLUMN is_flagged BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN flag_reason TEXT,
ADD COLUMN flagged_at TIMESTAMPTZ,
ADD COLUMN flagged_by TEXT;

-- Create index for flagged patients
CREATE INDEX idx_patients_is_flagged ON patients (is_flagged);
