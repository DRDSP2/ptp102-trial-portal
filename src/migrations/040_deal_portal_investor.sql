-- Source: internal_business_plan_draft.md

CREATE TABLE investor_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  update_type text CHECK (update_type IN ('monthly_kpi','board_minutes','financial_report','deal_pipeline')),
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE investor_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors and admins view updates" ON investor_updates FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.role = 'investor') OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admin manage updates" ON investor_updates FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
