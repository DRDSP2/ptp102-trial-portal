-- 052: Deal Team Members & Pipeline tables
-- Backs the TeamDirectory and DealPipeline components

CREATE TABLE IF NOT EXISTS deal_team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  role        text NOT NULL,
  initials    text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE deal_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_team_members_select_any"
  ON deal_team_members FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS deal_pipeline_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region      text NOT NULL,
  licensee    text,
  status      text NOT NULL DEFAULT 'available',
  stage       text NOT NULL DEFAULT 'Evaluation',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE deal_pipeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_pipeline_entries_select_any"
  ON deal_pipeline_entries FOR SELECT
  USING (true);
