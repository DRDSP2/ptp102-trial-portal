-- Force fix license_number column to be TEXT type
-- Drop and recreate with correct type if needed
ALTER TABLE veterinarians 
ALTER COLUMN license_number TYPE TEXT USING COALESCE(NULLIF(license_number::TEXT, '0'), 'Not Provided');

-- Ensure all existing 0 or empty values are replaced
UPDATE veterinarians 
SET license_number = 'Not Provided', updated_at = NOW()
WHERE license_number IN ('0', '', 'null') OR license_number IS NULL;
