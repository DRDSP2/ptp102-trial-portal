-- Migration to create patients table for laminitis trial
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

-- Insert sample patient data
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
