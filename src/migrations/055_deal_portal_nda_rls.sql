-- 055: Enforce approved NDA as a prerequisite for deal-room data access (HIGH 1 & 2)
--
-- F1: 053 content tables (pitch deck, company profile, regulatory modules,
--   manufacturing dossier, governance docs) were readable by ANY user with a
--   deal_profiles row, incl. tier 'none' users without an approved NDA.
-- F2: NDA/ToS acceptance was never enforced server-side; access relied solely
--   on the admin-assigned `tier`. This adds has_approved_nda() and requires an
--   approved NDA for every confidential deal-room SELECT policy.
-- Admins (app_metadata.role='admin') continue to bypass, matching prior intent.

CREATE OR REPLACE FUNCTION has_approved_nda()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM ndas
    WHERE user_id = auth.uid()
      AND status = 'signed'
      AND approval_status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 036: cap table / ESOP
DROP POLICY IF EXISTS "Investors and admins view cap table" ON cap_table_entries;
CREATE POLICY "Investors and admins view cap table" ON cap_table_entries FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.role = 'investor') AND has_approved_nda()));

DROP POLICY IF EXISTS "Diligence users view anonymised summary" ON cap_table_entries;
CREATE POLICY "Diligence users view anonymised summary" ON cap_table_entries FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')) AND has_approved_nda()));

DROP POLICY IF EXISTS "Investors and admins view ESOP" ON esop_grants;
CREATE POLICY "Investors and admins view ESOP" ON esop_grants FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.role = 'investor') AND has_approved_nda()));

-- 037: IP portfolio
DROP POLICY IF EXISTS "Authenticated deal users view IP" ON ip_portfolio;
CREATE POLICY "Authenticated deal users view IP" ON ip_portfolio FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('evaluation','diligence','exclusive')) AND has_approved_nda()));

-- 038: financials / term sheets / licences / marketplace
DROP POLICY IF EXISTS "Diligence+ view financials" ON financial_projections;
CREATE POLICY "Diligence+ view financials" ON financial_projections FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')) AND has_approved_nda()));

DROP POLICY IF EXISTS "Investors and admins view financials" ON financial_projections;
CREATE POLICY "Investors and admins view financials" ON financial_projections FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.role = 'investor') AND has_approved_nda()));

DROP POLICY IF EXISTS "Prospect view own term sheets" ON term_sheets;
CREATE POLICY "Prospect view own term sheets" ON term_sheets FOR SELECT
  USING (is_admin() OR (prospect_user_id = auth.uid() AND has_approved_nda()));

DROP POLICY IF EXISTS "View versions of accessible term sheets" ON term_sheet_versions;
CREATE POLICY "View versions of accessible term sheets" ON term_sheet_versions FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM term_sheets ts WHERE ts.id = term_sheet_versions.term_sheet_id AND ts.prospect_user_id = auth.uid()) AND has_approved_nda()));

DROP POLICY IF EXISTS "Licensee view own licences" ON licences;
CREATE POLICY "Licensee view own licences" ON licences FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM term_sheets ts WHERE ts.id = licences.term_sheet_id AND ts.prospect_user_id = auth.uid()) AND has_approved_nda()));

DROP POLICY IF EXISTS "All deal users view marketplace" ON region_marketplace;
CREATE POLICY "All deal users view marketplace" ON region_marketplace FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('evaluation','diligence','exclusive')) AND has_approved_nda()));

-- 039: CMC
DROP POLICY IF EXISTS "Diligence+ view CMC milestones" ON cmc_milestones;
CREATE POLICY "Diligence+ view CMC milestones" ON cmc_milestones FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')) AND has_approved_nda()));

DROP POLICY IF EXISTS "Diligence+ view CMC docs" ON cmc_documents;
CREATE POLICY "Diligence+ view CMC docs" ON cmc_documents FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')) AND has_approved_nda()));

-- 040: investor updates
DROP POLICY IF EXISTS "Investors and admins view updates" ON investor_updates;
CREATE POLICY "Investors and admins view updates" ON investor_updates FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.role = 'investor') AND has_approved_nda()));

-- 051: trial events (anonymised)
DROP POLICY IF EXISTS "Diligence+ view anonymised trial events" ON trial_events;
CREATE POLICY "Diligence+ view anonymised trial events" ON trial_events FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive')) AND data->>'vet_name' IS NULL AND data->>'owner_name' IS NULL AND has_approved_nda()));

-- 053: content tables (the directly-reported leak)
DROP POLICY IF EXISTS "deal_users_select_pitch_deck" ON pitch_deck_slides;
CREATE POLICY "deal_users_select_pitch_deck" ON pitch_deck_slides FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()) AND has_approved_nda()));

DROP POLICY IF EXISTS "deal_users_select_company_profile" ON company_profile;
CREATE POLICY "deal_users_select_company_profile" ON company_profile FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()) AND has_approved_nda()));

DROP POLICY IF EXISTS "deal_users_select_regulatory_modules" ON regulatory_modules;
CREATE POLICY "deal_users_select_regulatory_modules" ON regulatory_modules FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()) AND has_approved_nda()));

DROP POLICY IF EXISTS "deal_users_select_manufacturing_dossier" ON manufacturing_dossier_sections;
CREATE POLICY "deal_users_select_manufacturing_dossier" ON manufacturing_dossier_sections FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()) AND has_approved_nda()));

DROP POLICY IF EXISTS "deal_users_select_governance" ON governance_documents;
CREATE POLICY "deal_users_select_governance" ON governance_documents FOR SELECT
  USING (is_admin() OR (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid()) AND has_approved_nda()));
