-- NDA admin approval workflow columns

ALTER TABLE ndas
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','denied')),
ADD COLUMN IF NOT EXISTS admin_signed_at timestamptz,
ADD COLUMN IF NOT EXISTS admin_signature text,
ADD COLUMN IF NOT EXISTS signed_pdf_path text,
ADD COLUMN IF NOT EXISTS investor_email text;

-- Existing signed NDAs are grandfathered as approved so the gate keeps working.
UPDATE ndas SET approval_status = 'approved' WHERE status = 'signed' AND approval_status = 'pending';
