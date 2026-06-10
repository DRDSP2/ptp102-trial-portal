-- Update veterinarians verification_status default to pending for new registrations
ALTER TABLE veterinarians 
ALTER COLUMN verification_status SET DEFAULT 'pending';

-- Keep existing vets as approved
UPDATE veterinarians 
SET verification_status = 'approved',
    approved_at = COALESCE(approved_at, tc_accepted_at, created_at),
    approved_by = COALESCE(approved_by, 'system')
WHERE tc_accepted = true AND verification_status = 'approved';
