-- Sources: CMC.md, CMC_Development_Plan.md

CREATE TABLE cmc_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase text NOT NULL CHECK (phase IN ('0','1','2','3','4','5','6')),
  milestone_id text NOT NULL,
  title text NOT NULL,
  target_month integer,
  acceptance_criteria text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','complete','blocked')),
  deliverables text[],
  budget_estimate_low numeric,
  budget_estimate_high numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cmc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('regulatory','cmc','manufacturing','development_plan')),
  title text NOT NULL,
  file_path text,
  version text,
  access_tier_min text DEFAULT 'diligence' CHECK (access_tier_min IN ('evaluation','diligence','exclusive')),
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cmc_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cmc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diligence+ view CMC milestones" ON cmc_milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')));

CREATE POLICY "Diligence+ view CMC docs" ON cmc_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')));
CREATE POLICY "Admin manage CMC docs" ON cmc_documents FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
