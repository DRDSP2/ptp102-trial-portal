-- Migration to add profile_picture_url column to patients table
ALTER TABLE patients
ADD COLUMN profile_picture_url TEXT;

COMMENT ON COLUMN patients.profile_picture_url IS 'Uploadcare CDN URL for patient profile picture';
