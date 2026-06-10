-- Migration to fix protocol_hour for existing treatments and set protocol_start_time

-- For each patient, set protocol_start_time to the earliest treatment datetime if not already set
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

-- Update protocol_hour for treatments based on the difference from protocol_start_time
UPDATE treatments t
SET protocol_hour = FLOOR(
  EXTRACT(EPOCH FROM (t.administration_datetime - p.protocol_start_time)) / 3600
)::int
FROM patients p
WHERE t.patient_id = p.id
  AND t.protocol_hour IS NULL
  AND p.protocol_start_time IS NOT NULL;
