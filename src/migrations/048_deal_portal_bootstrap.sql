-- Idempotent bootstrap for deal-portal tables that may be missing in the live project.
-- Run via Supabase Dashboard -> SQL Editor.

-- ---------------------------------------------------------------------------
-- Helper functions used by deal-portal RLS policies
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_investor()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM deal_profiles WHERE user_id = auth.uid() AND role = 'investor');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_deal_access(minimum_tier text)
RETURNS boolean AS $$
DECLARE
  user_tier text;
BEGIN
  SELECT tier INTO user_tier FROM deal_profiles WHERE user_id = auth.uid();
  RETURN CASE minimum_tier
    WHEN 'evaluation' THEN user_tier IN ('evaluation','diligence','exclusive')
    WHEN 'diligence' THEN user_tier IN ('diligence','exclusive')
    WHEN 'exclusive' THEN user_tier = 'exclusive'
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Deal profiles: tracks company, role, tier and NDA status for deal users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company text,
  role text DEFAULT 'licensee_eval' CHECK (role IN ('investor','licensee_eval','licensee_diligence','licensee_exclusive')),
  tier text DEFAULT 'none' CHECK (tier IN ('none','evaluation','diligence','exclusive')),
  nda_signed_at timestamptz,
  nda_expires_at timestamptz,
  stripe_customer_id text,
  region_of_interest text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE deal_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own profile" ON deal_profiles;
CREATE POLICY "Users view own profile" ON deal_profiles FOR SELECT
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Users update own profile" ON deal_profiles;
CREATE POLICY "Users update own profile" ON deal_profiles FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin manage profiles" ON deal_profiles;
CREATE POLICY "Admin manage profiles" ON deal_profiles FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Users insert own profile" ON deal_profiles;
CREATE POLICY "Users insert own profile" ON deal_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Deal access audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  document_id uuid,
  document_type text,
  action text NOT NULL CHECK (action IN ('view','download','share','edit','propose_term_sheet')),
  ip_address inet,
  user_agent text,
  watermarked_snapshot_path text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deal_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own logs" ON deal_access_logs;
CREATE POLICY "Users view own logs" ON deal_access_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin view all logs" ON deal_access_logs;
CREATE POLICY "Admin view all logs" ON deal_access_logs FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Authenticated insert logs" ON deal_access_logs;
CREATE POLICY "Authenticated insert logs" ON deal_access_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- CMC / deal-room documents table (admin document manager)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cmc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('regulatory','cmc','manufacturing','development_plan')),
  title text NOT NULL,
  file_path text,
  version text,
  access_tier_min text DEFAULT 'diligence' CHECK (access_tier_min IN ('evaluation','diligence','exclusive')),
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cmc_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Diligence+ view CMC docs" ON cmc_documents;
CREATE POLICY "Diligence+ view CMC docs" ON cmc_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')));

DROP POLICY IF EXISTS "Admin manage CMC docs" ON cmc_documents;
CREATE POLICY "Admin manage CMC docs" ON cmc_documents FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- Storage bucket for deal room documents
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deal-room-documents',
  'deal-room-documents',
  false,
  52428800,
  ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/markdown','image/png','image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owner upload deal docs" ON storage.objects;
CREATE POLICY "Owner upload deal docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'deal-room-documents' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Owner or admin read deal docs" ON storage.objects;
CREATE POLICY "Owner or admin read deal docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'deal-room-documents' AND (auth.uid() = owner OR is_admin()));

DROP POLICY IF EXISTS "Owner or admin delete deal docs" ON storage.objects;
CREATE POLICY "Owner or admin delete deal docs" ON storage.objects FOR DELETE
  USING (bucket_id = 'deal-room-documents' AND (auth.uid() = owner OR is_admin()));
