-- Sources: 7_NDA.md, 8_IP_Assignment.md, 9_Trademark.md, 13_ToS.md, 14_Privacy.md, 15_Compliance.md

CREATE TABLE ndas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_version text NOT NULL DEFAULT 'v1.0',
  company_name text,
  signed_at timestamptz,
  expires_at timestamptz,
  signature_provider text DEFAULT 'docusign',
  signature_envelope_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','signed','expired','revoked')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ip_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('patent','trademark','biomarker','trade_secret')),
  jurisdiction text,
  status text,
  filing_date date,
  assignee text,
  application_number text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE compliance_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL,
  details text,
  legal_reference text,
  owner text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','complete','overdue')),
  evidence_url text,
  review_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ndas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own NDA" ON ndas FOR SELECT
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Users insert own NDA" ON ndas FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated deal users view IP" ON ip_portfolio FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('evaluation','diligence','exclusive')));

CREATE POLICY "Admin manage compliance" ON compliance_register FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
