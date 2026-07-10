-- Sources: Platform_Architecture.md, User_Flow_and_Playbook.md

CREATE TABLE deal_profiles (
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

CREATE POLICY "Users view own profile" ON deal_profiles FOR SELECT
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Users update own profile" ON deal_profiles FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Admin manage profiles" ON deal_profiles FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
