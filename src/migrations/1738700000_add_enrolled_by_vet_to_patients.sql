-- Track which veterinarian enrolled each patient
ALTER TABLE patients
ADD COLUMN enrolled_by_vet_email TEXT;

CREATE INDEX idx_patients_enrolled_by ON patients (enrolled_by_vet_email);
