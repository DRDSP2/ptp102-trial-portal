-- Migration to seed realistic trial data based on PTP-102 publication
-- Study enrolled horses with acute laminitis (Obel grades 1-4) treated with 72-hour protocol

-- First, clear existing sample data to replace with publication-based data
DELETE FROM clinical_assessments;
DELETE FROM lab_results;
DELETE FROM radiograph_assessments;
DELETE FROM treatments;
DELETE FROM clinical_notes;
DELETE FROM media_uploads;
DELETE FROM patients;

-- Insert 12 horses based on publication parameters and capture IDs
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

-- Insert treatment records using unique_id to find patient_id
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

-- Insert clinical assessments
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

-- Insert lab results
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

-- Insert clinical notes
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

-- Insert radiograph assessments
INSERT INTO radiograph_assessments (patient_id, assessment_datetime, protocol_hour, keenan_angle, affected_limb, interpretation, veterinarian_name)
SELECT p.id, '2025-10-15 08:00:00+00'::TIMESTAMPTZ, 0, 8.5, 'Front Left', 'Moderate rotation visible, consistent with grade 3 laminitis', 'Dr. Sarah Mitchell'
FROM patients p WHERE p.unique_id = 'LAM-00001'
UNION ALL
SELECT p.id, '2025-09-01 09:00:00+00'::TIMESTAMPTZ, 0, 6.2, 'Front Right', 'Mild rotation, baseline assessment', 'Dr. Emily Roberts'
FROM patients p WHERE p.unique_id = 'LAM-00006'
UNION ALL
SELECT p.id, '2025-09-04 09:00:00+00'::TIMESTAMPTZ, 72, 5.8, 'Front Right', 'Slight improvement in rotation angle, stable positioning', 'Dr. Emily Roberts'
FROM patients p WHERE p.unique_id = 'LAM-00006';
