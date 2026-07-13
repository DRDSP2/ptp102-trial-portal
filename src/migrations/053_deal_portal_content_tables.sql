-- 053: Content backing tables for PitchDeckViewer, CompanyProfileCard,
--       RegulatoryPackageViewer, ManufacturingDossier, InvestorGovernance

CREATE TABLE IF NOT EXISTS pitch_deck_slides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_number integer NOT NULL,
  title       text NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (slide_number)
);

CREATE TABLE IF NOT EXISTS company_profile (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name        text NOT NULL,
  entity_type       text NOT NULL,
  jurisdiction      text NOT NULL,
  registered_address text NOT NULL,
  verified          boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS regulatory_modules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number integer NOT NULL,
  title        text NOT NULL,
  items        jsonb NOT NULL DEFAULT '[]',
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (module_number)
);

CREATE TABLE IF NOT EXISTS manufacturing_dossier_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS governance_documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_name   text NOT NULL,
  title      text NOT NULL,
  content    text NOT NULL,
  icon_name  text DEFAULT 'FileText',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pitch_deck_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturing_dossier_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_users_select_pitch_deck" ON pitch_deck_slides FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()));

CREATE POLICY "deal_users_select_company_profile" ON company_profile FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()));

CREATE POLICY "deal_users_select_regulatory_modules" ON regulatory_modules FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()));

CREATE POLICY "deal_users_select_manufacturing_dossier" ON manufacturing_dossier_sections FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()));

CREATE POLICY "deal_users_select_governance" ON governance_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()));
