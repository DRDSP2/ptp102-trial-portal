-- Add conflict of interest disclosure to veterinarians table
ALTER TABLE veterinarians
ADD COLUMN no_conflict_of_interest BOOLEAN NOT NULL DEFAULT false;

-- Create index for filtering
CREATE INDEX idx_veterinarians_conflict ON veterinarians (no_conflict_of_interest);
