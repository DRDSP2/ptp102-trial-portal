-- Migration to enhance patients table and create trial tracking tables

-- Add laminitis-specific fields to patients table
ALTER TABLE patients
ADD COLUMN unique_id TEXT UNIQUE,
ADD COLUMN laminitis_grade INT,
ADD COLUMN laminitis_duration_days INT,
ADD COLUMN affected_limbs TEXT,
ADD COLUMN inclusion_criteria_met BOOLEAN DEFAULT true,
ADD COLUMN exclusion_criteria_notes TEXT,
ADD COLUMN protocol_start_time TIMESTAMPTZ;

-- Create treatments table for 72-hour protocol tracking
CREATE TABLE treatments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  administration_datetime TIMESTAMPTZ NOT NULL,
  dosage_mg NUMERIC(10, 2) NOT NULL,
  route TEXT NOT NULL,
  veterinarian_name TEXT NOT NULL,
  batch_number TEXT,
  immediate_reactions TEXT,
  notes TEXT,
  protocol_hour INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_treatments_patient_id ON treatments (patient_id);
CREATE INDEX idx_treatments_administration_datetime ON treatments (administration_datetime);
CREATE INDEX idx_treatments_protocol_hour ON treatments (protocol_hour);

-- Create clinical_notes table for structured text notes
CREATE TABLE clinical_notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  veterinarian_name TEXT NOT NULL,
  note_type TEXT NOT NULL,
  note_content TEXT NOT NULL,
  protocol_hour INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinical_notes_patient_id ON clinical_notes (patient_id);
CREATE INDEX idx_clinical_notes_created_at ON clinical_notes (created_at);

-- Create media_uploads table for images/videos
CREATE TABLE media_uploads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL,
  media_category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  protocol_hour INT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_uploads_patient_id ON media_uploads (patient_id);
CREATE INDEX idx_media_uploads_media_category ON media_uploads (media_category);

-- Create lab_results table
CREATE TABLE lab_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_datetime TIMESTAMPTZ NOT NULL,
  protocol_hour INT,
  wbc NUMERIC(10, 2),
  rbc NUMERIC(10, 2),
  hemoglobin NUMERIC(10, 2),
  hematocrit NUMERIC(10, 2),
  platelets NUMERIC(10, 2),
  glucose NUMERIC(10, 2),
  creatinine NUMERIC(10, 2),
  bun NUMERIC(10, 2),
  alt NUMERIC(10, 2),
  ast NUMERIC(10, 2),
  alkaline_phosphatase NUMERIC(10, 2),
  total_protein NUMERIC(10, 2),
  albumin NUMERIC(10, 2),
  serum_amyloid_a NUMERIC(10, 2),
  fibrinogen NUMERIC(10, 2),
  lactate NUMERIC(10, 2),
  additional_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_results_patient_id ON lab_results (patient_id);
CREATE INDEX idx_lab_results_test_datetime ON lab_results (test_datetime);

-- Create radiograph_assessments table
CREATE TABLE radiograph_assessments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assessment_datetime TIMESTAMPTZ NOT NULL,
  protocol_hour INT,
  keenan_angle NUMERIC(5, 2),
  affected_limb TEXT NOT NULL,
  image_url TEXT,
  interpretation TEXT,
  veterinarian_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_radiograph_assessments_patient_id ON radiograph_assessments (patient_id);

-- Create clinical_assessments table for pain/mobility scoring
CREATE TABLE clinical_assessments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assessment_datetime TIMESTAMPTZ NOT NULL,
  protocol_hour INT,
  obel_grade INT,
  pain_score INT,
  mobility_score INT,
  digital_pulse_score INT,
  hoof_temperature TEXT,
  heart_rate INT,
  respiratory_rate INT,
  temperature NUMERIC(4, 1),
  clinical_notes TEXT,
  veterinarian_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinical_assessments_patient_id ON clinical_assessments (patient_id);
CREATE INDEX idx_clinical_assessments_assessment_datetime ON clinical_assessments (assessment_datetime);

-- Update existing patients with unique IDs and laminitis grades
UPDATE patients SET unique_id = 'LAM-' || LPAD(id::text, 5, '0');
UPDATE patients SET laminitis_grade = (RANDOM() * 3 + 1)::INT WHERE laminitis_grade IS NULL;
UPDATE patients SET laminitis_duration_days = (RANDOM() * 14 + 1)::INT WHERE laminitis_duration_days IS NULL;
UPDATE patients SET affected_limbs = CASE 
  WHEN RANDOM() < 0.3 THEN 'Front Both'
  WHEN RANDOM() < 0.6 THEN 'All Four'
  ELSE 'Front Left'
END WHERE affected_limbs IS NULL;
