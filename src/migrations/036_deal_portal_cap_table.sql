-- Sources: 5_Cap_Table.md, 6_ESOP_Incentive_Agreement.md

CREATE TABLE cap_table_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shareholder_name text NOT NULL,
  share_class text NOT NULL CHECK (share_class IN ('ordinary','preferred','licence_unit','option')),
  shares numeric NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  vesting_schedule jsonb,
  is_employee_pool boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE esop_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES auth.users(id),
  units numeric NOT NULL,
  exercise_price numeric,
  vesting_schedule jsonb,
  grant_date date,
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cap_table_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE esop_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors and admins view cap table" ON cap_table_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.role = 'investor')
         OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Diligence users view anonymised summary" ON cap_table_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')));

CREATE POLICY "Investors and admins view ESOP" ON esop_grants FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.role = 'investor')
         OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
