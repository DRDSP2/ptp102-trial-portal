-- Migration to add clinical examination parameters to patients table for enrollment screening

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

-- Add comments for reference ranges
COMMENT ON COLUMN patients.digital_pulse IS 'Normal: Faint/barely palpable; Laminitis: Bounding/strong';
COMMENT ON COLUMN patients.hoof_wall_temperature IS 'Normal: Cool to slightly warm; Laminitis: Noticeably warm/hot at coronary band';
COMMENT ON COLUMN patients.coronary_band_condition IS 'Normal: Smooth contour; Laminitis: Swelling/tenderness/depression';
COMMENT ON COLUMN patients.hoof_tester_response IS 'Normal: No response; Laminitis: Positive at toe region';
COMMENT ON COLUMN patients.stance IS 'Normal: Normal weight-bearing; Laminitis: Sawhorse stance';
COMMENT ON COLUMN patients.gait IS 'Normal: Normal; Laminitis: Short/stilted/reluctant';
COMMENT ON COLUMN patients.enrollment_heart_rate IS 'Normal: 28-44 bpm; Laminitis: ≥60 bpm';
COMMENT ON COLUMN patients.enrollment_respiratory_rate IS 'Normal: 8-16 breaths/min; Laminitis: Elevated';
COMMENT ON COLUMN patients.enrollment_temperature IS 'Normal: 37.2-38.3°C (99-101°F)';
COMMENT ON COLUMN patients.body_condition_score IS 'Normal: 4-6/9 ideal; Risk: ≥7/9';
