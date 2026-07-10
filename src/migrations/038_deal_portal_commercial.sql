-- Sources: 17_Financial_Model.md, 18_Term_Sheet.md, MASTER_Financial_Parameters.md, Draft Term Sheet for.txt

CREATE TABLE financial_projections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  revenue numeric,
  cogs numeric,
  gross_profit numeric,
  operating_expenses numeric,
  ebit numeric,
  operating_cash_flow numeric,
  sam_cases numeric,
  tam_cases numeric,
  price_per_treatment numeric DEFAULT 1000,
  cost_per_treatment numeric DEFAULT 35.12,
  gross_margin_percent numeric DEFAULT 96.5,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE term_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL DEFAULT 'ts-ptp102-v1',
  template_name text DEFAULT 'PTP-102 Global Region Licence',
  status text DEFAULT 'draft' CHECK (status IN ('draft','proposed','negotiated','signed','executed')),
  prospect_company text,
  prospect_user_id uuid REFERENCES auth.users(id),
  region text CHECK (region IN ('north_america','eu','uk','uae','apac','global')),
  upfront_fee numeric,
  milestone_schedule jsonb DEFAULT '[]',
  royalty_rate numeric DEFAULT 0.05,
  minimum_annual_royalty numeric,
  exclusivity_months integer DEFAULT 6,
  sublicensing_allowed boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  current_version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE term_sheet_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_sheet_id uuid REFERENCES term_sheets(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content jsonb NOT NULL,
  proposed_by text CHECK (proposed_by IN ('prospect','byrock')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE licences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_sheet_id uuid REFERENCES term_sheets(id),
  region text NOT NULL,
  fee_paid boolean DEFAULT false,
  fee_amount numeric,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','active','expired','terminated')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE region_marketplace (
  region text PRIMARY KEY,
  status text DEFAULT 'available' CHECK (status IN ('available','under_evaluation','under_negotiation','licensed','reserved')),
  base_licence_fee numeric,
  royalty_rate numeric DEFAULT 0.05,
  licensee_company text,
  licensee_user_id uuid REFERENCES auth.users(id),
  exclusivity_expires_at timestamptz,
  notes text
);

INSERT INTO region_marketplace (region, status, royalty_rate) VALUES
  ('north_america', 'available', 0.05),
  ('eu', 'available', 0.05),
  ('uk', 'available', 0.05),
  ('uae', 'available', 0.05),
  ('apac', 'available', 0.05),
  ('global', 'available', 0.05);

ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_sheet_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE licences ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diligence+ view financials" ON financial_projections FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')));

CREATE POLICY "Prospect view own term sheets" ON term_sheets FOR SELECT
  USING (prospect_user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Prospect create term sheets" ON term_sheets FOR INSERT
  WITH CHECK (prospect_user_id = auth.uid());
CREATE POLICY "Prospect update own drafts" ON term_sheets FOR UPDATE
  USING (prospect_user_id = auth.uid() AND status = 'draft');

CREATE POLICY "View versions of accessible term sheets" ON term_sheet_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM term_sheets ts WHERE ts.id = term_sheet_versions.term_sheet_id AND (ts.prospect_user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')));

CREATE POLICY "Licensee view own licences" ON licences FOR SELECT
  USING (EXISTS (SELECT 1 FROM term_sheets ts WHERE ts.id = licences.term_sheet_id AND ts.prospect_user_id = auth.uid()) OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "All deal users view marketplace" ON region_marketplace FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('evaluation','diligence','exclusive')));
CREATE POLICY "Admin update marketplace" ON region_marketplace FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
