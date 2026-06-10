-- Migration to ensure license_number is TEXT and fix existing data
-- First, check if column is wrong type and fix it
DO $$ 
BEGIN
    -- Check if license_number is not TEXT type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'veterinarians' 
        AND column_name = 'license_number' 
        AND data_type != 'text'
    ) THEN
        -- Convert column to TEXT
        ALTER TABLE veterinarians 
        ALTER COLUMN license_number TYPE TEXT USING license_number::TEXT;
    END IF;
END $$;

-- Update any license_number values that are '0' to empty string or handle them
-- This assumes '0' was a default/null value placeholder
UPDATE veterinarians 
SET license_number = 'Not Provided'
WHERE license_number = '0' OR license_number IS NULL OR license_number = '';
