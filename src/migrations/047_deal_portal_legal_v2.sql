-- NDA v2.0 — Byrock-aligned Mutual NDA schema upgrade (Irish law)
-- Adds entity fields, 19 legal acknowledgements, 6-year expiry, and fixed governing-law defaults.

-- Ensure the table exists (idempotent guard). If a fresh DB, rely on 037_deal_portal_legal.sql first.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ndas') THEN
    CREATE TABLE ndas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      template_version text NOT NULL DEFAULT 'v2.0-byrock',
      company_name text NOT NULL DEFAULT '',
      signed_at timestamptz,
      expires_at timestamptz,
      signature_provider text DEFAULT 'docusign',
      signature_envelope_id text,
      status text DEFAULT 'pending' CHECK (status IN ('pending','signed','expired','revoked')),
      created_at timestamptz DEFAULT now()
    );
  END IF;
END
$$;

-- Template version
ALTER TABLE ndas
  ALTER COLUMN template_version SET DEFAULT 'v2.0-byrock',
  ALTER COLUMN template_version SET NOT NULL;

-- Company name now required (backfill existing empty rows)
ALTER TABLE ndas
  ALTER COLUMN company_name SET NOT NULL,
  ALTER COLUMN company_name SET DEFAULT '';
UPDATE ndas SET company_name = 'Unknown Counterparty' WHERE company_name IS NULL OR company_name = '';

-- Counterparty entity details
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS counterparty_entity_type text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS counterparty_jurisdiction text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS counterparty_address text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS counterparty_contact_email text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS counterparty_contact_name text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS counterparty_contact_title text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS has_affiliates boolean DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS affiliate_names text;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS representative_count text DEFAULT '1-5';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS project_purpose text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS project_regions text[] DEFAULT ARRAY[]::text[];

-- Signer / execution details
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS signer_name text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS signer_title text NOT NULL DEFAULT '';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS signature_date date;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS electronic_signature text NOT NULL DEFAULT '';

-- Governing law / notice defaults (Byrock NDA — Irish law)
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS governing_law text NOT NULL DEFAULT 'Ireland';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS venue text NOT NULL DEFAULT 'Dublin, Ireland';
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS company_notice_email text NOT NULL DEFAULT 'info@byrocktechnologies.com';

-- 19 legal acknowledgements (all required, default false)
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_mutual_nda boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_affiliates boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_representatives boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_trade_secrets boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_no_competitor boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_return_destruction boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_equitable_relief boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_irish_law boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_no_warranty boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_third_party_beneficiaries boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_one_year_exchange boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_five_year_protection boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_perpetuity_trade_secrets boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_backup_retention boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_notices boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_counterparts boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_entire_agreement boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_attorneys_fees boolean NOT NULL DEFAULT false;
ALTER TABLE ndas ADD COLUMN IF NOT EXISTS ack_inconvenient_forum boolean NOT NULL DEFAULT false;

-- Function + trigger: auto-set expires_at to signed_at + 6 years on insert/update
CREATE OR REPLACE FUNCTION set_nda_6_year_expiry()
RETURNS trigger AS $$
BEGIN
  IF NEW.signed_at IS NOT NULL THEN
    NEW.expires_at := NEW.signed_at + INTERVAL '6 years';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS nda_6_year_expiry_trigger ON ndas;
CREATE TRIGGER nda_6_year_expiry_trigger
  BEFORE INSERT OR UPDATE ON ndas
  FOR EACH ROW
  EXECUTE FUNCTION set_nda_6_year_expiry();

-- Function + trigger: enforce fixed Byrock legal defaults
CREATE OR REPLACE FUNCTION set_nda_legal_defaults()
RETURNS trigger AS $$
BEGIN
  NEW.governing_law := COALESCE(NULLIF(NEW.governing_law, ''), 'Ireland');
  NEW.venue := COALESCE(NULLIF(NEW.venue, ''), 'Dublin, Ireland');
  NEW.company_notice_email := COALESCE(NULLIF(NEW.company_notice_email, ''), 'info@byrocktechnologies.com');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS nda_legal_defaults_trigger ON ndas;
CREATE TRIGGER nda_legal_defaults_trigger
  BEFORE INSERT OR UPDATE ON ndas
  FOR EACH ROW
  EXECUTE FUNCTION set_nda_legal_defaults();

-- Ensure RLS (idempotent)
ALTER TABLE ndas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own NDA" ON ndas;
CREATE POLICY "Users view own NDA" ON ndas FOR SELECT
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Users insert own NDA" ON ndas;
CREATE POLICY "Users insert own NDA" ON ndas FOR INSERT
  WITH CHECK (user_id = auth.uid());
