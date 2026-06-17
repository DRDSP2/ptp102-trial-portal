-- Migration to add phone and consent_printed_at to veterinarians.
-- Both columns are sent by the registration INSERT (original Vercel function,
-- dev server, and Edge Function) but were never added to the schema.

ALTER TABLE veterinarians
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS consent_printed_at TIMESTAMPTZ;
