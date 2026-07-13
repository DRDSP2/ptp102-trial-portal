-- 054: Allow investors to view financial_projections (matching cap_table_entries pattern)
CREATE POLICY IF NOT EXISTS "Investors and admins view financials" ON financial_projections FOR SELECT
  USING ((EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.role = 'investor'))
         OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'));
