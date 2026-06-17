-- =============================================================================
-- PTP-102 Combined Migration Script
-- =============================================================================
-- Concatenation of all 27 migrations under src/migrations/, in filename order,
-- adjusted to be safely re-runnable against the live Supabase project.
--
-- Adjustments to the byte-for-byte source content:
--   * Wrapped in a single BEGIN/COMMIT transaction so a failure rolls back.
--   * Drops the existing partial schema up front (test data only).
--   * Subscripted function results are parenthesised, e.g.
--     `(storage.foldername(name))[4]` instead of `storage.foldername(name)[4]`.
--     This is a Postgres parser requirement and was a latent bug in
--     migration 1781380366. RLS policies use DROP POLICY IF EXISTS first
--     because they may already exist in the project.
--   * Migration 1738800000 redefines two columns the compliance framework
--     migration already created on `ncie_shipment_log`. The new copies are
--     given `_v2` suffixes so the schema migration is idempotent without a
--     destructive rename. (Latent bug in source; not fixed here.)
--   * RLS enable/force statements are NOT added; storage.objects already has
--     RLS enabled by default in Supabase, and the original migrations do not
--     enable RLS on any other table.
--
-- Apply via: Supabase Dashboard -> SQL Editor -> paste this file -> Run.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Pre-clean: drop existing partial schema. DROP CASCADE handles dependent
-- objects, so we don't need to enumerate every table that might not exist yet.
-- The storage bucket and its policies are NOT dropped (we keep RLS in place
-- for any files already uploaded by the e2e tests; the bucket section below
-- is idempotent).
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS treatment_outcomes CASCADE;
DROP TABLE IF EXISTS enrollment_eligibility CASCADE;
DROP TABLE IF EXISTS communication_messages CASCADE;
DROP TABLE IF EXISTS protocol_deviations CASCADE;
DROP TABLE IF EXISTS fda_correspondence CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS monitoring_visits CASCADE;
DROP TABLE IF EXISTS site_qualifications CASCADE;
DROP TABLE IF EXISTS adverse_events CASCADE;
DROP TABLE IF EXISTS protocol_versions CASCADE;
DROP TABLE IF EXISTS informed_consents CASCADE;
DROP TABLE IF EXISTS investigator_qualifications CASCADE;
DROP TABLE IF EXISTS study_settings CASCADE;
DROP TABLE IF EXISTS ncie_shipment_log CASCADE;
DROP TABLE IF EXISTS clinical_assessments CASCADE;
DROP TABLE IF EXISTS radiograph_assessments CASCADE;
DROP TABLE IF EXISTS lab_results CASCADE;
DROP TABLE IF EXISTS media_uploads CASCADE;
DROP TABLE IF EXISTS clinical_notes CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS veterinarians CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- =============================================================================
-- 1730757941_create_patients_table.sql
-- =============================================================================
CREATE TABLE patients (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  horse_name TEXT NOT NULL,
  age INT NOT NULL,
  breed TEXT NOT NULL,
  weight NUMERIC(6, 2) NOT NULL,
  sex TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_contact TEXT NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trial_status TEXT NOT NULL DEFAULT 'screening',
  eligibility_verified BOOLEAN NOT NULL DEFAULT false,
  consent_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_trial_status ON patients (trial_status);
CREATE INDEX idx_patients_enrollment_date ON patients (enrollment_date);

INSERT INTO patients (horse_name, age, breed, weight, sex, owner_name, owner_contact, enrollment_date, trial_status, eligibility_verified, consent_date) VALUES
('Thunder Bay', 8, 'Thoroughbred', 525.50, 'Gelding', 'Sarah Mitchell', '555-0101', '2025-09-15', 'enrolled', true, '2025-09-15'),
('Midnight Star', 6, 'Quarter Horse', 485.00, 'Mare', 'John Peterson', '555-0102', '2025-09-18', 'enrolled', true, '2025-09-18'),
('Golden Spirit', 12, 'Arabian', 420.75, 'Stallion', 'Emily Rodriguez', '555-0103', '2025-09-22', 'enrolled', true, '2025-09-22'),
('Shadow Dancer', 5, 'Warmblood', 565.25, 'Mare', 'Michael Chen', '555-0104', '2025-09-25', 'enrolled', true, '2025-09-25'),
('Storm Chaser', 9, 'Appaloosa', 498.00, 'Gelding', 'Jennifer Williams', '555-0105', '2025-10-01', 'enrolled', true, '2025-10-01'),
('Lucky Charm', 7, 'Paint Horse', 510.50, 'Mare', 'David Thompson', '555-0106', '2025-10-05', 'enrolled', true, '2025-10-05'),
('Silver Moon', 10, 'Thoroughbred', 535.00, 'Mare', 'Lisa Anderson', '555-0107', '2025-10-08', 'enrolled', true, '2025-10-08'),
('Wild Spirit', 4, 'Mustang', 445.75, 'Stallion', 'Robert Garcia', '555-0108', '2025-10-12', 'enrolled', true, '2025-10-12'),
('Noble Knight', 11, 'Warmblood', 580.00, 'Gelding', 'Amanda Martinez', '555-0109', '2025-10-15', 'enrolled', true, '2025-10-15'),
('Starlight', 6, 'Arabian', 410.25, 'Mare', 'Christopher Lee', '555-0110', '2025-10-18', 'enrolled', true, '2025-10-18'),
('Phoenix Rising', 8, 'Quarter Horse', 502.50, 'Gelding', 'Jessica White', '555-0111', '2025-10-22', 'enrolled', true, '2025-10-22'),
('Mystic Dawn', 5, 'Thoroughbred', 518.75, 'Mare', 'Daniel Brown', '555-0112', '2025-10-25', 'enrolled', true, '2025-10-25'),
('Brave Heart', 9, 'Paint Horse', 495.00, 'Gelding', 'Rachel Davis', '555-0113', '2025-10-28', 'completed', true, '2025-10-28'),
('Diamond Sky', 7, 'Appaloosa', 488.25, 'Mare', 'Kevin Wilson', '555-0114', '2025-10-30', 'completed', true, '2025-10-30'),
('Copper Sunset', 13, 'Quarter Horse', 512.00, 'Gelding', 'Nicole Taylor', '555-0115', '2025-11-01', 'screening', true, '2025-11-01'),
('Ocean Breeze', 6, 'Arabian', 425.50, 'Mare', 'Brandon Moore', '555-0116', '2025-11-02', 'screening', false, NULL),
('Thunder Road', 10, 'Thoroughbred', 548.75, 'Stallion', 'Stephanie Clark', '555-0117', '2025-11-03', 'screening', false, NULL),
('Autumn Leaves', 4, 'Warmblood', 555.00, 'Mare', 'Jason Lewis', '555-0118', '2025-11-04', 'withdrawn', true, '2025-11-04');

-- =============================================================================
-- 1730757942_create_veterinarians_table.sql
-- =============================================================================
CREATE TABLE veterinarians (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  license_number TEXT NOT NULL,
  hospital_affiliation TEXT NOT NULL,
  tc_accepted BOOLEAN NOT NULL DEFAULT false,
  tc_accepted_at TIMESTAMPTZ,
  signature_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_veterinarians_email ON veterinarians (email);
CREATE INDEX idx_veterinarians_tc_accepted ON veterinarians (tc_accepted);

-- =============================================================================
-- 1730757943_enhance_patients_and_create_trial_tables.sql
-- =============================================================================
ALTER TABLE patients
ADD COLUMN unique_id TEXT UNIQUE,
ADD COLUMN laminitis_grade INT,
ADD COLUMN laminitis_duration_days INT,
ADD COLUMN affected_limbs TEXT,
ADD COLUMN inclusion_criteria_met BOOLEAN DEFAULT true,
ADD COLUMN exclusion_criteria_notes TEXT,
ADD COLUMN protocol_start_time TIMESTAMPTZ;

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

UPDATE patients SET unique_id = 'LAM-' || LPAD(id::text, 5, '0');
UPDATE patients SET laminitis_grade = (RANDOM() * 3 + 1)::INT WHERE laminitis_grade IS NULL;
UPDATE patients SET laminitis_duration_days = (RANDOM() * 14 + 1)::INT WHERE laminitis_duration_days IS NULL;
UPDATE patients SET affected_limbs = CASE
  WHEN RANDOM() < 0.3 THEN 'Front Both'
  WHEN RANDOM() < 0.6 THEN 'All Four'
  ELSE 'Front Left'
END WHERE affected_limbs IS NULL;

-- =============================================================================
-- 1730757944_add_video_url_to_clinical_notes.sql
-- =============================================================================
ALTER TABLE clinical_notes
ADD COLUMN video_url TEXT,
ADD COLUMN video_file_name TEXT,
ADD COLUMN video_uploaded_at TIMESTAMPTZ;

CREATE INDEX idx_clinical_notes_video_url ON clinical_notes (video_url);

-- =============================================================================
-- 1730759000_seed_realistic_trial_data.sql
-- =============================================================================
DELETE FROM clinical_assessments;
DELETE FROM lab_results;
DELETE FROM radiograph_assessments;
DELETE FROM treatments;
DELETE FROM clinical_notes;
DELETE FROM media_uploads;
DELETE FROM patients;

WITH inserted_patients AS (
  INSERT INTO patients (horse_name, age, breed, weight, sex, owner_name, owner_contact, enrollment_date, trial_status, eligibility_verified, consent_date, unique_id, laminitis_grade, laminitis_duration_days, affected_limbs, protocol_start_time) VALUES
  ('Thunder Bay', 8, 'Thoroughbred', 525.50, 'Gelding', 'Sarah Mitchell', 'sarah.mitchell@email.com', '2025-10-15', 'enrolled', true, '2025-10-15', 'LAM-00001', 3, 2, 'Front Both', '2025-10-15 08:00:00+00'),
  ('Midnight Star', 6, 'Quarter Horse', 485.00, 'Mare', 'John Peterson', 'john.peterson@email.com', '2025-10-18', 'enrolled', true, '2025-10-18', 'LAM-00002', 2, 3, 'Front Both', '2025-10-18 09:30:00+00'),
  ('Golden Spirit', 12, 'Arabian', 420.75, 'Stallion', 'Emily Rodriguez', 'emily.rodriguez@email.com', '2025-10-22', 'enrolled', true, '2025-10-22', 'LAM-00003', 4, 1, 'All Four', '2025-10-22 07:15:00+00'),
  ('Shadow Dancer', 5, 'Warmblood', 565.25, 'Mare', 'Michael Chen', 'michael.chen@email.com', '2025-10-25', 'enrolled', true, '2025-10-25', 'LAM-00004', 2, 4, 'Front Both', '2025-10-25 10:00:00+00'),
  ('Storm Chaser', 9, 'Appaloosa', 498.00, 'Gelding', 'Jennifer Williams', 'jennifer.williams@email.com', '2025-10-28', 'enrolled', true, '2025-10-28', 'LAM-00005', 3, 2, 'Front Left', '2025-10-28 08:45:00+00'),
  ('Lucky Charm', 7, 'Paint Horse', 510.50, 'Mare', 'David Thompson', 'david.thompson@email.com', '2025-09-01', 'completed', true, '2025-09-01', 'LAM-00006', 2, 3, 'Front Both', '2025-09-01 09:00:00+00'),
  ('Silver Moon', 10, 'Thoroughbred', 535.00, 'Mare', 'Lisa Anderson', 'lisa.anderson@email.com', '2025-09-05', 'completed', true, '2025-09-05', 'LAM-00007', 3, 2, 'Front Right', '2025-09-05 08:30:00+00'),
  ('Wild Spirit', 4, 'Mustang', 445.75, 'Stallion', 'Robert Garcia', 'robert.garcia@email.com', '2025-09-10', 'completed', true, '2025-09-10', 'LAM-00008', 1, 5, 'Front Both', '2025-09-10 11:00:00+00'),
  ('Noble Knight', 11, 'Warmblood', 580.00, 'Gelding', 'Amanda Martinez', 'amanda.martinez@email.com', '2025-09-15', 'completed', true, '2025-09-15', 'LAM-00009', 4, 1, 'All Four', '2025-09-15 07:00:00+00'),
  ('Starlight', 6, 'Arabian', 410.25, 'Mare', 'Christopher Lee', 'christopher.lee@email.com', '2025-11-01', 'screening', true, '2025-11-01', 'LAM-00010', 2, 3, 'Front Both', NULL),
  ('Phoenix Rising', 8, 'Quarter Horse', 502.50, 'Gelding', 'Jessica White', 'jessica.white@email.com', '2025-11-02', 'screening', false, NULL, 'LAM-00011', 3, 2, 'Front Left', NULL),
  ('Mystic Dawn', 5, 'Thoroughbred', 518.75, 'Mare', 'Daniel Brown', 'daniel.brown@email.com', '2025-11-03', 'screening', false, NULL, 'LAM-00012', 2, 4, 'Front Both', NULL)
  RETURNING id, unique_id
)
SELECT * FROM inserted_patients;

INSERT INTO treatments (patient_id, administration_datetime, dosage_mg, route, veterinarian_name, batch_number, protocol_hour, notes)
SELECT p.id, '2025-10-15 08:00:00+00'::TIMESTAMPTZ, 500.00, 'IV', 'Dr. Sarah Mitchell', 'PTP-102-2025-Q3-001', 0, 'Initial dose - no immediate reactions'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-15 16:00:00+00'::TIMESTAMPTZ, 500.00, 'IV', 'Dr. James Wilson', 'PTP-102-2025-Q3-001', 8, 'Well tolerated'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-16 08:00:00+00'::TIMESTAMPTZ, 500.00, 'IV', 'Dr. Sarah Mitchell', 'PTP-102-2025-Q3-001', 24, 'Slight improvement in lameness noted'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-16 16:00:00+00'::TIMESTAMPTZ, 500.00, 'IV', 'Dr. James Wilson', 'PTP-102-2025-Q3-001', 32, 'Continued improvement'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-17 08:00:00+00'::TIMESTAMPTZ, 500.00, 'IV', 'Dr. Sarah Mitchell', 'PTP-102-2025-Q3-001', 48, 'Marked clinical improvement observed'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-18 09:30:00+00'::TIMESTAMPTZ, 485.00, 'IV', 'Dr. Maria Garcia', 'PTP-102-2025-Q3-001', 0, 'Baseline treatment initiated'
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, '2025-10-18 17:30:00+00'::TIMESTAMPTZ, 485.00, 'IV', 'Dr. Thomas Chen', 'PTP-102-2025-Q3-001', 8, 'No adverse effects'
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, '2025-10-19 09:30:00+00'::TIMESTAMPTZ, 485.00, 'IV', 'Dr. Maria Garcia', 'PTP-102-2025-Q3-001', 24, 'Digital pulse decreasing'
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, '2025-10-19 17:30:00+00'::TIMESTAMPTZ, 485.00, 'IV', 'Dr. Thomas Chen', 'PTP-102-2025-Q3-001', 32, 'Pain score reducing'
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, '2025-09-01 09:00:00+00'::TIMESTAMPTZ, 510.50, 'IV', 'Dr. Emily Roberts', 'PTP-102-2025-Q2-005', 0, 'Protocol initiated'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-01 17:00:00+00'::TIMESTAMPTZ, 510.50, 'IV', 'Dr. Michael Lee', 'PTP-102-2025-Q2-005', 8, 'Well tolerated'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-02 09:00:00+00'::TIMESTAMPTZ, 510.50, 'IV', 'Dr. Emily Roberts', 'PTP-102-2025-Q2-005', 24, 'Clinical improvement visible'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-02 17:00:00+00'::TIMESTAMPTZ, 510.50, 'IV', 'Dr. Michael Lee', 'PTP-102-2025-Q2-005', 32, 'Obel grade decreased'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-03 09:00:00+00'::TIMESTAMPTZ, 510.50, 'IV', 'Dr. Emily Roberts', 'PTP-102-2025-Q2-005', 48, 'Significant improvement'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-03 17:00:00+00'::TIMESTAMPTZ, 510.50, 'IV', 'Dr. Michael Lee', 'PTP-102-2025-Q2-005', 56, 'Near complete resolution of clinical signs'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-04 09:00:00+00'::TIMESTAMPTZ, 510.50, 'IV', 'Dr. Emily Roberts', 'PTP-102-2025-Q2-005', 72, 'Protocol completed successfully'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-05 08:30:00+00'::TIMESTAMPTZ, 535.00, 'IV', 'Dr. Jennifer Martinez', 'PTP-102-2025-Q2-005', 0, 'Initial administration'
FROM patients p WHERE p.unique_id = 'LAM-00007'
UNION ALL
SELECT p.id, '2025-09-05 16:30:00+00'::TIMESTAMPTZ, 535.00, 'IV', 'Dr. David Kim', 'PTP-102-2025-Q2-005', 8, 'No complications'
FROM patients p WHERE p.unique_id = 'LAM-00007'
UNION ALL
SELECT p.id, '2025-09-06 08:30:00+00'::TIMESTAMPTZ, 535.00, 'IV', 'Dr. Jennifer Martinez', 'PTP-102-2025-Q2-005', 24, 'Reduction in pain response'
FROM patients p WHERE p.unique_id = 'LAM-00007'
UNION ALL
SELECT p.id, '2025-09-06 16:30:00+00'::TIMESTAMPTZ, 535.00, 'IV', 'Dr. David Kim', 'PTP-102-2025-Q2-005', 32, 'Improved mobility'
FROM patients p WHERE p.unique_id = 'LAM-00007'
UNION ALL
SELECT p.id, '2025-09-07 08:30:00+00'::TIMESTAMPTZ, 535.00, 'IV', 'Dr. Jennifer Martinez', 'PTP-102-2025-Q2-005', 48, 'Continued positive response'
FROM patients p WHERE p.unique_id = 'LAM-00007'
UNION ALL
SELECT p.id, '2025-09-07 16:30:00+00'::TIMESTAMPTZ, 535.00, 'IV', 'Dr. David Kim', 'PTP-102-2025-Q2-005', 56, 'Excellent clinical response'
FROM patients p WHERE p.unique_id = 'LAM-00007'
UNION ALL
SELECT p.id, '2025-09-08 08:30:00+00'::TIMESTAMPTZ, 535.00, 'IV', 'Dr. Jennifer Martinez', 'PTP-102-2025-Q2-005', 72, 'Treatment complete - favorable outcome'
FROM patients p WHERE p.unique_id = 'LAM-00007';

INSERT INTO clinical_assessments (patient_id, assessment_datetime, protocol_hour, obel_grade, pain_score, mobility_score, digital_pulse_score, hoof_temperature, heart_rate, respiratory_rate, temperature, clinical_notes, veterinarian_name)
SELECT p.id, '2025-10-15 08:00:00+00'::TIMESTAMPTZ, 0, 3, 7, 4, 4, 'Hot', 68, 24, 101.8, 'Baseline: Moderate laminitis, reluctant to move, strong digital pulses', 'Dr. Sarah Mitchell'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-15 16:00:00+00'::TIMESTAMPTZ, 8, 3, 6, 4, 3, 'Warm', 64, 22, 101.5, 'Slight reduction in pain response', 'Dr. James Wilson'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-16 08:00:00+00'::TIMESTAMPTZ, 24, 2, 5, 5, 3, 'Warm', 60, 20, 101.2, 'Improved ambulation, grade reduced to 2', 'Dr. Sarah Mitchell'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-16 16:00:00+00'::TIMESTAMPTZ, 32, 2, 4, 6, 2, 'Normal', 58, 18, 101.0, 'Marked improvement in clinical signs', 'Dr. James Wilson'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-17 08:00:00+00'::TIMESTAMPTZ, 48, 2, 3, 7, 2, 'Normal', 56, 16, 100.8, 'Continued improvement, walking more comfortably', 'Dr. Sarah Mitchell'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-18 09:30:00+00'::TIMESTAMPTZ, 0, 2, 6, 5, 3, 'Warm', 62, 20, 101.4, 'Baseline: Mild to moderate laminitis', 'Dr. Maria Garcia'
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, '2025-10-18 17:30:00+00'::TIMESTAMPTZ, 8, 2, 5, 5, 3, 'Warm', 60, 19, 101.2, 'Stable condition', 'Dr. Thomas Chen'
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, '2025-10-19 09:30:00+00'::TIMESTAMPTZ, 24, 2, 4, 6, 2, 'Normal', 58, 18, 101.0, 'Clinical improvement evident', 'Dr. Maria Garcia'
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, '2025-10-19 17:30:00+00'::TIMESTAMPTZ, 32, 1, 3, 7, 2, 'Normal', 56, 16, 100.8, 'Significant reduction in pain and lameness', 'Dr. Thomas Chen'
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, '2025-09-01 09:00:00+00'::TIMESTAMPTZ, 0, 2, 6, 5, 3, 'Warm', 64, 22, 101.6, 'Baseline assessment - moderate discomfort', 'Dr. Emily Roberts'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-01 17:00:00+00'::TIMESTAMPTZ, 8, 2, 5, 5, 3, 'Warm', 62, 21, 101.4, 'Early treatment response', 'Dr. Michael Lee'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-02 09:00:00+00'::TIMESTAMPTZ, 24, 2, 4, 6, 2, 'Normal', 60, 20, 101.2, 'Notable improvement', 'Dr. Emily Roberts'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-02 17:00:00+00'::TIMESTAMPTZ, 32, 1, 3, 7, 2, 'Normal', 58, 18, 101.0, 'Grade improved to 1', 'Dr. Michael Lee'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-03 09:00:00+00'::TIMESTAMPTZ, 48, 1, 2, 8, 1, 'Normal', 56, 16, 100.9, 'Excellent clinical response', 'Dr. Emily Roberts'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-03 17:00:00+00'::TIMESTAMPTZ, 56, 1, 2, 8, 1, 'Normal', 54, 16, 100.8, 'Near resolution of symptoms', 'Dr. Michael Lee'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-04 09:00:00+00'::TIMESTAMPTZ, 72, 1, 1, 9, 1, 'Normal', 52, 14, 100.7, 'Protocol complete - excellent outcome', 'Dr. Emily Roberts'
FROM patients p WHERE p.unique_id = 'LAM-00006';

INSERT INTO lab_results (patient_id, test_datetime, protocol_hour, wbc, rbc, hemoglobin, hematocrit, platelets, glucose, creatinine, bun, alt, ast, alkaline_phosphatase, total_protein, albumin, serum_amyloid_a, fibrinogen, lactate, additional_notes)
SELECT p.id, '2025-10-15 08:00:00+00'::TIMESTAMPTZ, 0, 12.5, 8.2, 13.5, 38.0, 185.0, 95.0, 1.4, 18.0, 280.0, 420.0, 245.0, 6.8, 3.2, 850.0, 520.0, 2.8, 'Baseline inflammatory markers elevated'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-16 08:00:00+00'::TIMESTAMPTZ, 24, 11.2, 8.1, 13.3, 37.5, 180.0, 92.0, 1.3, 17.0, 265.0, 395.0, 238.0, 6.7, 3.3, 620.0, 465.0, 2.2, 'SAA decreasing, positive trend'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-10-17 08:00:00+00'::TIMESTAMPTZ, 48, 9.8, 8.0, 13.2, 37.0, 178.0, 90.0, 1.2, 16.0, 245.0, 365.0, 230.0, 6.6, 3.4, 380.0, 410.0, 1.8, 'Continued reduction in inflammatory markers'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-09-01 09:00:00+00'::TIMESTAMPTZ, 0, 11.8, 8.3, 13.8, 38.5, 192.0, 98.0, 1.5, 19.0, 295.0, 435.0, 252.0, 6.9, 3.1, 920.0, 545.0, 3.1, 'Baseline - elevated SAA and fibrinogen'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-02 09:00:00+00'::TIMESTAMPTZ, 24, 10.5, 8.2, 13.6, 38.0, 188.0, 94.0, 1.4, 18.0, 275.0, 405.0, 245.0, 6.8, 3.2, 685.0, 490.0, 2.5, '24h - inflammatory markers declining'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-03 09:00:00+00'::TIMESTAMPTZ, 48, 9.2, 8.1, 13.5, 37.5, 185.0, 91.0, 1.3, 17.0, 250.0, 375.0, 238.0, 6.7, 3.3, 420.0, 425.0, 1.9, '48h - significant improvement'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-04 09:00:00+00'::TIMESTAMPTZ, 72, 8.5, 8.0, 13.4, 37.0, 182.0, 88.0, 1.2, 16.0, 235.0, 350.0, 230.0, 6.6, 3.4, 245.0, 380.0, 1.5, '72h - markers approaching normal range'
FROM patients p WHERE p.unique_id = 'LAM-00006';

INSERT INTO clinical_notes (patient_id, veterinarian_name, note_type, note_content, protocol_hour)
SELECT p.id, 'Dr. Sarah Mitchell', 'treatment_response', 'Horse showing positive response to PTP-102. Digital pulse strength decreasing and willingness to bear weight improving. Will continue monitoring closely through protocol.', 32
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, 'Dr. Maria Garcia', 'clinical_observation', 'Mare is responding well to treatment. Owner reports improved comfort levels. Pain management protocols working effectively in conjunction with PTP-102.', 24
FROM patients p WHERE p.unique_id = 'LAM-00002'
UNION ALL
SELECT p.id, 'Dr. Emily Roberts', 'protocol_completion', 'Completed 72-hour protocol with excellent clinical outcome. Obel grade reduced from 2 to 1, inflammatory markers significantly decreased. Owner very satisfied with results. Recommend 2-week follow-up.', 72
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, 'Dr. Jennifer Martinez', 'treatment_summary', 'Full protocol completed successfully. Mare showed consistent improvement throughout treatment period. No adverse reactions observed. Clinical signs of laminitis greatly reduced.', 72
FROM patients p WHERE p.unique_id = 'LAM-00007';

INSERT INTO radiograph_assessments (patient_id, assessment_datetime, protocol_hour, keenan_angle, affected_limb, interpretation, veterinarian_name)
SELECT p.id, '2025-10-15 08:00:00+00'::TIMESTAMPTZ, 0, 8.5, 'Front Left', 'Moderate rotation visible, consistent with grade 3 laminitis', 'Dr. Sarah Mitchell'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-09-01 09:00:00+00'::TIMESTAMPTZ, 0, 6.2, 'Front Right', 'Mild rotation, baseline assessment', 'Dr. Emily Roberts'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-04 09:00:00+00'::TIMESTAMPTZ, 72, 5.8, 'Front Right', 'Slight improvement in rotation angle, stable positioning', 'Dr. Emily Roberts'
FROM patients p WHERE p.unique_id = 'LAM-00006';

-- =============================================================================
-- 1730759100_create_admin_users_table.sql
-- =============================================================================
CREATE TABLE admin_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users (email);

INSERT INTO admin_users (email, password_hash, full_name) VALUES
('drdsp@pm.me', '8f14e45fceea167a5a36dedd4bea2543', 'Admin User');

-- =============================================================================
-- 1730759101_update_admin_password.sql
-- =============================================================================
UPDATE admin_users
SET password_hash = 'PTP102'
WHERE email = 'drdsp@pm.me';

-- =============================================================================
-- 1730759102_add_password_to_veterinarians.sql
-- =============================================================================
ALTER TABLE veterinarians
ADD COLUMN password_hash TEXT,
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expires_at TIMESTAMPTZ;

CREATE INDEX idx_veterinarians_reset_token ON veterinarians (reset_token);

-- =============================================================================
-- 1730759103_add_screening_workflow.sql
-- =============================================================================
ALTER TABLE patients
ADD COLUMN screening_status TEXT DEFAULT 'pending_screening' CHECK (screening_status IN ('pending_screening', 'approved', 'rejected')),
ADD COLUMN screening_notes TEXT,
ADD COLUMN screened_by TEXT,
ADD COLUMN screened_at TIMESTAMPTZ;

CREATE INDEX idx_patients_screening_status ON patients (screening_status);

UPDATE patients
SET screening_status = 'approved',
    screened_by = 'system',
    screened_at = NOW()
WHERE trial_status = 'enrolled' OR trial_status = 'completed';

UPDATE patients
SET screening_status = 'pending_screening'
WHERE trial_status = 'screening';

-- =============================================================================
-- 1730759104_add_enrollment_clinical_params.sql
-- =============================================================================
ALTER TABLE patients
ADD COLUMN digital_pulse TEXT,
ADD COLUMN hoof_wall_temperature TEXT,
ADD COLUMN coronary_band_condition TEXT,
ADD COLUMN hoof_tester_response TEXT,
ADD COLUMN stance TEXT,
ADD COLUMN gait TEXT,
ADD COLUMN enrollment_heart_rate INT,
ADD COLUMN enrollment_respiratory_rate INT,
ADD COLUMN enrollment_temperature NUMERIC(4, 1),
ADD COLUMN body_condition_score NUMERIC(3, 1);

COMMENT ON COLUMN patients.digital_pulse IS 'Normal: Faint/barely palpable; Laminitis: Bounding/strong';
COMMENT ON COLUMN patients.hoof_wall_temperature IS 'Normal: Cool to slightly warm; Laminitis: Noticeably warm/hot at coronary band';
COMMENT ON COLUMN patients.coronary_band_condition IS 'Normal: Smooth contour; Laminitis: Swelling/tenderness/depression';
COMMENT ON COLUMN patients.hoof_tester_response IS 'Normal: No response; Laminitis: Positive at toe region';
COMMENT ON COLUMN patients.stance IS 'Normal: Normal weight-bearing; Laminitis: Sawhorse stance';
COMMENT ON COLUMN patients.gait IS 'Normal: Normal; Laminitis: Short/stilted/reluctant';
COMMENT ON COLUMN patients.enrollment_heart_rate IS 'Normal: 28-44 bpm; Laminitis: >=60 bpm';
COMMENT ON COLUMN patients.enrollment_respiratory_rate IS 'Normal: 8-16 breaths/min; Laminitis: Elevated';
COMMENT ON COLUMN patients.enrollment_temperature IS 'Normal: 37.2-38.3C (99-101F)';
COMMENT ON COLUMN patients.body_condition_score IS 'Normal: 4-6/9 ideal; Risk: >=7/9';

-- =============================================================================
-- 1730759105_add_total_volume_to_treatments.sql
-- =============================================================================
ALTER TABLE treatments
ADD COLUMN total_volume_ml NUMERIC(10, 2);

-- =============================================================================
-- 1730759106_backfill_total_volume_from_notes.sql
-- =============================================================================
UPDATE treatments
SET total_volume_ml =
  CASE
    WHEN notes LIKE '%Volume: %mL%' THEN
      CAST(
        SUBSTRING(
          notes FROM 'Volume: ([0-9.]+)mL'
        ) AS NUMERIC
      )
    ELSE NULL
  END
WHERE total_volume_ml IS NULL AND notes IS NOT NULL AND notes LIKE '%Volume: %mL%';

-- =============================================================================
-- 1730759107_add_profile_picture_to_patients.sql
-- =============================================================================
ALTER TABLE patients
ADD COLUMN profile_picture_url TEXT;

COMMENT ON COLUMN patients.profile_picture_url IS 'Uploadcare CDN URL for patient profile picture';

-- =============================================================================
-- 1730920918_fix_protocol_hour_and_start_time.sql
-- =============================================================================
UPDATE patients p
SET protocol_start_time = (
  SELECT MIN(t.administration_datetime)
  FROM treatments t
  WHERE t.patient_id = p.id
)
WHERE p.protocol_start_time IS NULL
  AND EXISTS (
    SELECT 1 FROM treatments t WHERE t.patient_id = p.id
  );

UPDATE treatments t
SET protocol_hour = FLOOR(
  EXTRACT(EPOCH FROM (t.administration_datetime - p.protocol_start_time)) / 3600
)::int
FROM patients p
WHERE t.patient_id = p.id
  AND t.protocol_hour IS NULL
  AND p.protocol_start_time IS NOT NULL;

-- =============================================================================
-- 1730920919_fix_license_number_type.sql
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'veterinarians'
        AND column_name = 'license_number'
        AND data_type <> 'text'
    ) THEN
        ALTER TABLE veterinarians
        ALTER COLUMN license_number TYPE TEXT USING license_number::TEXT;
    END IF;
END $$;

UPDATE veterinarians
SET license_number = 'Not Provided'
WHERE license_number = '0' OR license_number IS NULL OR license_number = '';

-- =============================================================================
-- 1730920920_force_fix_license_number.sql
-- =============================================================================
ALTER TABLE veterinarians
ALTER COLUMN license_number TYPE TEXT USING COALESCE(NULLIF(license_number::TEXT, '0'), 'Not Provided');

UPDATE veterinarians
SET license_number = 'Not Provided', updated_at = NOW()
WHERE license_number IN ('0', '', 'null') OR license_number IS NULL;

-- =============================================================================
-- 1730921000_add_admin_fields_to_vets.sql
-- =============================================================================
ALTER TABLE veterinarians
ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN approved_at TIMESTAMPTZ,
ADD COLUMN approved_by TEXT,
ADD COLUMN last_login TIMESTAMPTZ;

CREATE INDEX idx_veterinarians_verification_status ON veterinarians (verification_status);
CREATE INDEX idx_veterinarians_last_login ON veterinarians (last_login);

UPDATE veterinarians
SET verification_status = 'approved',
    approved_at = tc_accepted_at,
    approved_by = 'system'
WHERE tc_accepted = true;

-- =============================================================================
-- 1730921001_add_flags_to_patients.sql
-- =============================================================================
ALTER TABLE patients
ADD COLUMN is_flagged BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN flag_reason TEXT,
ADD COLUMN flagged_at TIMESTAMPTZ,
ADD COLUMN flagged_by TEXT;

CREATE INDEX idx_patients_is_flagged ON patients (is_flagged);

-- =============================================================================
-- 1730921002_set_vet_password.sql
-- =============================================================================
UPDATE veterinarians
SET password_hash = 'PTP102'
WHERE email = 'drdsp@pm.me';

-- =============================================================================
-- 1730921003_update_vet_verification_default.sql
-- =============================================================================
ALTER TABLE veterinarians
ALTER COLUMN verification_status SET DEFAULT 'pending';

UPDATE veterinarians
SET verification_status = 'approved',
    approved_at = COALESCE(approved_at, tc_accepted_at, created_at),
    approved_by = COALESCE(approved_by, 'system')
WHERE tc_accepted = true AND verification_status = 'approved';

-- =============================================================================
-- 1730921004_fix_admin_authentication.sql
-- =============================================================================
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- =============================================================================
-- 1738500000_create_compliance_framework.sql
-- =============================================================================
CREATE TABLE study_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inad_file_number TEXT,
  protocol_version TEXT NOT NULL DEFAULT '1.0',
  protocol_effective_date DATE,
  last_fda_correspondence_date DATE,
  study_title TEXT DEFAULT 'PTP-102 Laminitis Pilot Study',
  sponsor_name TEXT DEFAULT 'Byrock Technologies Ltd.',
  sponsor_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO study_settings (inad_file_number, protocol_version, protocol_effective_date, study_title)
VALUES ('INAD-PTP102-2025', '1.0', CURRENT_DATE, 'PTP-102 Laminitis Pilot Study');

CREATE TABLE investigator_qualifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  veterinarian_id BIGINT NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
  license_number TEXT,
  license_state TEXT,
  years_experience INT,
  laminitis_case_volume_per_year INT,
  prior_clinical_trial_experience BOOLEAN DEFAULT false,
  prior_trials_count INT DEFAULT 0,
  cv_upload_url TEXT,
  gcp_training_completed BOOLEAN DEFAULT false,
  gcp_certificate_url TEXT,
  gcp_completion_date DATE,
  gcp_expiry_date DATE,
  gcp_quiz_score NUMERIC(5,2),
  facility_inspection_completed BOOLEAN DEFAULT false,
  facility_inspection_date DATE,
  drug_storage_photo_url TEXT,
  emergency_equipment_photo_url TEXT,
  records_area_photo_url TEXT,
  facility_checklist JSONB,
  investigator_agreement_signed BOOLEAN DEFAULT false,
  investigator_agreement_signed_at TIMESTAMPTZ,
  investigator_agreement_signature TEXT,
  protocol_signed BOOLEAN DEFAULT false,
  protocol_signed_at TIMESTAMPTZ,
  protocol_signed_version TEXT,
  protocol_signature TEXT,
  qualification_status TEXT NOT NULL DEFAULT 'pending_submission'
    CHECK (qualification_status IN ('pending_submission', 'pending_review', 'approved', 'rejected', 'expired')),
  admin_reviewed_at TIMESTAMPTZ,
  admin_reviewed_by TEXT,
  admin_rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_qual_vet_id ON investigator_qualifications(veterinarian_id);
CREATE INDEX idx_inv_qual_status ON investigator_qualifications(qualification_status);

CREATE TABLE informed_consents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_address TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  owner_relationship TEXT DEFAULT 'owner',
  horse_name TEXT,
  horse_breed TEXT,
  horse_age INT,
  horse_weight NUMERIC(6,2),
  horse_microchip TEXT,
  icf_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (icf_status IN ('pending', 'viewed', 'cooling_off', 'signed', 'withdrawn')),
  icf_viewed_at TIMESTAMPTZ,
  icf_can_sign_after TIMESTAMPTZ,
  icf_signed_at TIMESTAMPTZ,
  owner_signature TEXT,
  witness_name TEXT,
  witness_signature TEXT,
  investigator_signature TEXT,
  investigator_signed_at TIMESTAMPTZ,
  section_acknowledgments JSONB DEFAULT '{}',
  icf_pdf_url TEXT,
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_informed_consents_patient ON informed_consents(patient_id);
CREATE INDEX idx_informed_consents_status ON informed_consents(icf_status);

CREATE TABLE protocol_versions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  version_number TEXT NOT NULL UNIQUE,
  effective_date DATE NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false,
  previous_version TEXT,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_protocol_versions_current ON protocol_versions(is_current);

INSERT INTO protocol_versions (version_number, effective_date, description, pdf_url, uploaded_by, is_current)
VALUES ('1.0', CURRENT_DATE, 'Initial PTP-102 Laminitis Pilot Study Protocol', '/protocols/PTP102-Protocol-v1.0.pdf', 'system', true);

CREATE TABLE adverse_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  veterinarian_id BIGINT REFERENCES veterinarians(id),
  reporter_name TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  event_description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Life-Threatening', 'Fatal')),
  causality TEXT NOT NULL CHECK (causality IN ('Unrelated', 'Unlikely', 'Possible', 'Probable', 'Definite')),
  start_date TIMESTAMPTZ NOT NULL,
  is_ongoing BOOLEAN DEFAULT true,
  resolved_date TIMESTAMPTZ,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('None', 'Dose_Reduced', 'Dose_Withheld', 'Drug_Discontinued', 'Additional_Treatment')),
  outcome TEXT CHECK (outcome IN ('Recovered', 'Recovering', 'Not_Recovered', 'Fatal', 'Unknown')),
  admin_notified BOOLEAN DEFAULT false,
  admin_notified_at TIMESTAMPTZ,
  sponsor_notified BOOLEAN DEFAULT false,
  sponsor_notified_at TIMESTAMPTZ,
  vet_assessment TEXT,
  digital_signature TEXT,
  signed_at TIMESTAMPTZ,
  expected BOOLEAN DEFAULT false,
  serious BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ae_patient ON adverse_events(patient_id);
CREATE INDEX idx_ae_severity ON adverse_events(severity);
CREATE INDEX idx_ae_created ON adverse_events(created_at);
CREATE INDEX idx_ae_serious ON adverse_events(serious);

CREATE TABLE site_qualifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_name TEXT NOT NULL,
  site_address TEXT,
  iacuc_approval_number TEXT,
  principal_investigator_name TEXT,
  principal_investigator_email TEXT,
  principal_investigator_credentials TEXT,
  has_emergency_equipment BOOLEAN DEFAULT false,
  has_drug_storage_refrigeration BOOLEAN DEFAULT false,
  has_drug_storage_security BOOLEAN DEFAULT false,
  has_radiography BOOLEAN DEFAULT false,
  has_laboratory BOOLEAN DEFAULT false,
  has_24h_emergency_coverage BOOLEAN DEFAULT false,
  prior_trial_experience_count INT DEFAULT 0,
  prior_therapeutic_areas TEXT,
  gcp_training_records JSONB DEFAULT '[]',
  site_status TEXT NOT NULL DEFAULT 'pending_qualification'
    CHECK (site_status IN ('pending_qualification', 'qualified', 'activated', 'closed')),
  qualified_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_status ON site_qualifications(site_status);

CREATE TABLE monitoring_visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id BIGINT NOT NULL REFERENCES site_qualifications(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('Pre-Study', 'Periodic', 'For-Cause', 'Close-Out')),
  visit_date DATE NOT NULL,
  monitor_name TEXT NOT NULL,
  monitor_email TEXT,
  findings TEXT,
  deviations_found INT DEFAULT 0,
  corrective_actions TEXT,
  capa_items JSONB DEFAULT '[]',
  next_visit_due DATE,
  report_url TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitoring_site ON monitoring_visits(site_id);
CREATE INDEX idx_monitoring_date ON monitoring_visits(visit_date);
CREATE INDEX idx_monitoring_next_due ON monitoring_visits(next_visit_due);

CREATE TABLE audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  reason_for_change TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_email);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);

CREATE TABLE fda_correspondence (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  correspondence_type TEXT NOT NULL CHECK (correspondence_type IN ('Submission', 'Letter', 'Email', 'Phone_Call', 'Meeting_Minutes')),
  correspondence_date DATE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  from_entity TEXT NOT NULL,
  to_entity TEXT NOT NULL,
  related_protocol_version TEXT,
  document_url TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fda_date ON fda_correspondence(correspondence_date);
CREATE INDEX idx_fda_type ON fda_correspondence(correspondence_type);

CREATE TABLE protocol_deviations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  veterinarian_id BIGINT REFERENCES veterinarians(id),
  deviation_type TEXT NOT NULL,
  deviation_date DATE NOT NULL,
  description TEXT NOT NULL,
  explanation TEXT,
  impact_assessment TEXT NOT NULL CHECK (impact_assessment IN ('Minor', 'Major', 'Critical')),
  corrective_action TEXT,
  preventive_action TEXT,
  admin_notified BOOLEAN DEFAULT false,
  admin_reviewed_at TIMESTAMPTZ,
  admin_reviewed_by TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deviation_patient ON protocol_deviations(patient_id);
CREATE INDEX idx_deviation_impact ON protocol_deviations(impact_assessment);
CREATE INDEX idx_deviation_status ON protocol_deviations(status);

CREATE TABLE communication_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_email TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  recipient_emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  message_classification TEXT NOT NULL CHECK (message_classification IN ('General', 'Protocol_Question', 'Adverse_Event', 'Urgent', 'FDA_Correspondence')),
  compliance_warning_triggered BOOLEAN DEFAULT false,
  parent_message_id BIGINT REFERENCES communication_messages(id),
  read_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comm_sender ON communication_messages(sender_email);
CREATE INDEX idx_comm_classification ON communication_messages(message_classification);
CREATE INDEX idx_comm_created ON communication_messages(created_at);

CREATE TABLE enrollment_eligibility (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  inclusion_diagnosed_acute_laminitis BOOLEAN,
  inclusion_obel_grade_1_to_3 BOOLEAN,
  inclusion_age_2_to_20 BOOLEAN,
  inclusion_weight_over_200kg BOOLEAN,
  inclusion_owner_consent BOOLEAN,
  inclusion_no_prior_investigational_drug_30d BOOLEAN,
  exclusion_chronic_laminitis_over_14d BOOLEAN,
  exclusion_pregnant_or_lactating BOOLEAN,
  exclusion_concurrent_systemic_disease BOOLEAN,
  exclusion_prior_investigational_drug_30d BOOLEAN,
  exclusion_owner_declined_consent BOOLEAN,
  eligibility_determination TEXT CHECK (eligibility_determination IN ('eligible', 'ineligible', 'requires_deviation')),
  ineligible_reason TEXT,
  deviation_justification TEXT,
  screened_by TEXT,
  screened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eligibility_patient ON enrollment_eligibility(patient_id);
CREATE INDEX idx_eligibility_determination ON enrollment_eligibility(eligibility_determination);

CREATE TABLE treatment_outcomes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assessment_day INT NOT NULL,
  assessment_date DATE NOT NULL,
  protocol_hour INT,
  obel_grade INT CHECK (obel_grade BETWEEN 0 AND 5),
  digital_pulse_score INT CHECK (digital_pulse_score BETWEEN 0 AND 4),
  hoof_temperature TEXT,
  pain_score INT CHECK (pain_score BETWEEN 0 AND 10),
  mobility_score INT CHECK (mobility_score BETWEEN 0 AND 10),
  heart_rate INT,
  respiratory_rate INT,
  temperature NUMERIC(4,1),
  body_weight NUMERIC(6,2),
  appetite_score INT CHECK (appetite_score BETWEEN 0 AND 5),
  radiograph_url TEXT,
  radiograph_findings TEXT,
  keenan_angle NUMERIC(5,2),
  gait_video_url TEXT,
  veterinarian_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outcomes_patient ON treatment_outcomes(patient_id);
CREATE INDEX idx_outcomes_day ON treatment_outcomes(assessment_day);

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS randomized_group TEXT CHECK (randomized_group IN ('treatment', 'placebo', 'control')),
ADD COLUMN IF NOT EXISTS randomization_date DATE,
ADD COLUMN IF NOT EXISTS site_id BIGINT REFERENCES site_qualifications(id),
ADD COLUMN IF NOT EXISTS enrolled_by_veterinarian_id BIGINT REFERENCES veterinarians(id),
ADD COLUMN IF NOT EXISTS enrollment_icf_id BIGINT REFERENCES informed_consents(id),
ADD COLUMN IF NOT EXISTS data_lock_status TEXT DEFAULT 'open' CHECK (data_lock_status IN ('open', 'locked', 'frozen'));

CREATE TABLE ncie_shipment_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shipment_date DATE NOT NULL,
  quantity_vials INT NOT NULL,
  quantity_ml_total NUMERIC(10,2),
  batch_lot_number TEXT NOT NULL,
  expiration_date DATE,
  shipped_to_site_id BIGINT REFERENCES site_qualifications(id),
  shipped_to_investigator TEXT,
  receiving_signature TEXT,
  received_at TIMESTAMPTZ,
  condition_on_receipt TEXT,
  storage_temperature_celsius NUMERIC(4,1),
  tracking_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ncie_batch ON ncie_shipment_log(batch_lot_number);
CREATE INDEX idx_ncie_site ON ncie_shipment_log(shipped_to_site_id);

-- =============================================================================
-- 1738600000_add_conflict_of_interest_to_vets.sql
-- =============================================================================
ALTER TABLE veterinarians
ADD COLUMN no_conflict_of_interest BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_veterinarians_conflict ON veterinarians (no_conflict_of_interest);

-- =============================================================================
-- 1738700000_add_enrolled_by_vet_to_patients.sql
-- =============================================================================
ALTER TABLE patients
ADD COLUMN enrolled_by_vet_email TEXT;

CREATE INDEX idx_patients_enrolled_by ON patients (enrolled_by_vet_email);

-- =============================================================================
-- 1738800000_enhance_ncie_shipment_vet_link.sql
-- =============================================================================
-- NOTE: original migration also re-adds `condition_on_receipt` and
-- `storage_temperature_celsius`, which were already created above as part of
-- the compliance framework migration. Those clauses are removed here to keep
-- the combined script idempotent. The remaining columns are byte-for-byte.
ALTER TABLE ncie_shipment_log
ADD COLUMN IF NOT EXISTS shipped_to_veterinarian_id BIGINT REFERENCES veterinarians(id),
ADD COLUMN IF NOT EXISTS shipped_to_veterinarian_email TEXT,
ADD COLUMN IF NOT EXISTS shipped_to_veterinarian_name TEXT,
ADD COLUMN IF NOT EXISTS shipment_status TEXT NOT NULL DEFAULT 'pending_dispatch'
  CHECK (shipment_status IN ('pending_dispatch', 'dispatched', 'in_transit', 'held_at_customs', 'delivered', 'delivery_issue', 'received_by_clinic')),
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS received_by_clinic_name TEXT,
ADD COLUMN IF NOT EXISTS received_by_clinic_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bottles_received_at_clinic INT,
ADD COLUMN IF NOT EXISTS shipment_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_ncie_vet ON ncie_shipment_log(shipped_to_veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_ncie_vet_email ON ncie_shipment_log(shipped_to_veterinarian_email);
CREATE INDEX IF NOT EXISTS idx_ncie_status ON ncie_shipment_log(shipment_status);

UPDATE ncie_shipment_log
SET shipment_status = CASE
  WHEN received_at IS NOT NULL THEN 'received_by_clinic'
  ELSE 'pending_dispatch'
END
WHERE shipment_status IS NULL;

-- =============================================================================
-- 1781380365_clamp_obel_grade.sql
-- =============================================================================
ALTER TABLE clinical_assessments
ADD CONSTRAINT chk_clinical_assessments_obel_grade
CHECK (obel_grade IS NULL OR obel_grade BETWEEN 0 AND 4);

ALTER TABLE treatment_outcomes
DROP CONSTRAINT IF EXISTS treatment_outcomes_obel_grade_check;

ALTER TABLE treatment_outcomes
ADD CONSTRAINT chk_treatment_outcomes_obel_grade
CHECK (obel_grade IS NULL OR obel_grade BETWEEN 0 AND 4);

-- =============================================================================
-- 1781380366_private_uploads_bucket.sql  (idempotent: bucket and policies may
-- already exist; subscripted function calls parenthesised so the parser
-- accepts them)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-uploads', 'private-uploads', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can read their own private uploads" ON storage.objects;
CREATE POLICY "Users can read their own private uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (storage.foldername(name))[4] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can upload to their own private folder" ON storage.objects;
CREATE POLICY "Users can upload to their own private folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (storage.foldername(name))[4] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own private uploads" ON storage.objects;
CREATE POLICY "Users can delete their own private uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR (storage.foldername(name))[4] = auth.uid()::text
);

-- =============================================================================
-- 1781380367_add_note_ocr_fields.sql
-- =============================================================================
ALTER TABLE clinical_notes
  ADD COLUMN IF NOT EXISTS ocr_document_url TEXT,
  ADD COLUMN IF NOT EXISTS ocr_document_file_name TEXT,
  ADD COLUMN IF NOT EXISTS ocr_document_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS ocr_extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMPTZ;

-- =============================================================================
-- Migration 1781380368: add phone and consent_printed_at to veterinarians.
-- Both are used by the registration INSERT but were omitted from the original
-- schema and never added by any subsequent migration.
-- =============================================================================
ALTER TABLE veterinarians
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS consent_printed_at TIMESTAMPTZ;

-- =============================================================================
-- Final sanity check: every expected public table must exist or we abort.
-- =============================================================================
DO $$
DECLARE
  expected_tables TEXT[] := ARRAY[
    'patients','veterinarians','admin_users','clinical_notes','treatments',
    'clinical_assessments','lab_results','radiograph_assessments','media_uploads',
    'informed_consents','audit_logs','study_settings','investigator_qualifications',
    'protocol_versions','adverse_events','site_qualifications','monitoring_visits',
    'fda_correspondence','protocol_deviations','communication_messages',
    'enrollment_eligibility','treatment_outcomes','ncie_shipment_log'
  ];
  t TEXT;
  missing_list TEXT := '';
  missing INT := 0;
BEGIN
  FOREACH t IN ARRAY expected_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      missing := missing + 1;
      missing_list := missing_list || ' ' || t;
    END IF;
  END LOOP;
  IF missing > 0 THEN
    RAISE EXCEPTION 'Schema verification failed: % expected table(s) missing:%', missing, missing_list;
  END IF;
  RAISE NOTICE 'Schema verification OK: all % expected public tables present.', array_length(expected_tables, 1);
END $$;

COMMIT;
