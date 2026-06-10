-- Add admin approval workflow and activity tracking fields to veterinarians
ALTER TABLE veterinarians
ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN approved_at TIMESTAMPTZ,
ADD COLUMN approved_by TEXT,
ADD COLUMN last_login TIMESTAMPTZ;

-- Create index for verification status filtering
CREATE INDEX idx_veterinarians_verification_status ON veterinarians (verification_status);
CREATE INDEX idx_veterinarians_last_login ON veterinarians (last_login);

-- Update existing records to set approved status
UPDATE veterinarians 
SET verification_status = 'approved',
    approved_at = tc_accepted_at,
    approved_by = 'system'
WHERE tc_accepted = true;
