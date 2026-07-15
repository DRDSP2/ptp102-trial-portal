-- Offer submission + admin review lifecycle (deal portal)
-- Investors / licensees select a region + offer type and submit an offer for
-- admin review. Mirrors the licence_requests approval pattern (RLS + is_admin()).

CREATE TABLE IF NOT EXISTS offer_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  applicant_id uuid NOT NULL REFERENCES auth.users(id),
  applicant_email text NOT NULL,
  applicant_role text,
  region text NOT NULL,
  offer_type text NOT NULL CHECK (offer_type IN ('licence', 'distribution', 'investment')),
  amount numeric,
  currency text DEFAULT 'USD',
  message text,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),
  reviewer_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offer_requests_applicant ON offer_requests (applicant_id);
CREATE INDEX IF NOT EXISTS idx_offer_requests_status ON offer_requests (status);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_offer_requests_updated_at ON offer_requests;
CREATE TRIGGER trg_offer_requests_updated_at
  BEFORE UPDATE ON offer_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE offer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicant or admin view offers" ON offer_requests;
CREATE POLICY "Applicant or admin view offers" ON offer_requests FOR SELECT
  USING (applicant_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Applicant create own offers" ON offer_requests;
CREATE POLICY "Applicant create own offers" ON offer_requests FOR INSERT
  WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Admin review offers" ON offer_requests;
CREATE POLICY "Admin review offers" ON offer_requests FOR UPDATE
  USING (is_admin());
