-- 20260715000002: Public-read lockdown for the 14 tables that still had RLS
-- disabled on the live database (and were therefore readable/writable by the
-- anon key under Supabase defaults), plus the two deal-portal tables that had
-- SELECT policies `TO public USING (true)` (anonymous read of deal-room data).
--
-- This migration extends the scope of the earlier 1796000001 draft (which was
-- never applied) so that it PRESERVES authenticated access for the three
-- privileged roles the app uses:
--   - is_admin()           -> study staff admin
--   - is_verified_vet()     -> enrolled investigator veterinarian
--   - is_clinical_admin()   -> admin OR consultant (FDA consultant role)
--
-- With RLS disabled these tables were reachable by ANY authenticated caller
-- (including the consultant), so enabling RLS with a gate of
-- `is_admin() OR is_verified_vet() OR is_clinical_admin()` keeps the exact
-- authenticated access the app relied on while removing anon/public access.
-- DELETE stays admin-only as a destructive-operation safety default.
--
-- The deal_team_members / deal_pipeline_entries fix re-issues the `USING (true)`
-- policy as `TO authenticated` gated by `is_admin() OR has_approved_nda()`,
-- matching the deal-portal RLS model (055). This stops anonymous read of
-- deal-room data while keeping it available to staff/ND accutees.
--
-- Edge Functions use the service-role key and bypass RLS unchanged.
-- Idempotent (DROP POLICY IF EXISTS + ENABLE ROW LEVEL SECURITY is repeatable)
-- and revertible via `git revert`.

-- ============================================================================
-- 13 compliance / study tables
-- ============================================================================
ALTER TABLE public.study_settings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigator_qualifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informed_consents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_versions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adverse_events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_qualifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_visits               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fda_correspondence              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_deviations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_eligibility          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_outcomes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncie_shipment_log               ENABLE ROW LEVEL SECURITY;

-- study_settings
DROP POLICY IF EXISTS "study_settings_select" ON public.study_settings;
CREATE POLICY "study_settings_select" ON public.study_settings FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "study_settings_insert" ON public.study_settings;
CREATE POLICY "study_settings_insert" ON public.study_settings FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "study_settings_update" ON public.study_settings;
CREATE POLICY "study_settings_update" ON public.study_settings FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "study_settings_delete" ON public.study_settings;
CREATE POLICY "study_settings_delete" ON public.study_settings FOR DELETE TO authenticated
  USING (is_admin());

-- investigator_qualifications
DROP POLICY IF EXISTS "investigator_qualifications_select" ON public.investigator_qualifications;
CREATE POLICY "investigator_qualifications_select" ON public.investigator_qualifications FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "investigator_qualifications_insert" ON public.investigator_qualifications;
CREATE POLICY "investigator_qualifications_insert" ON public.investigator_qualifications FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "investigator_qualifications_update" ON public.investigator_qualifications;
CREATE POLICY "investigator_qualifications_update" ON public.investigator_qualifications FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "investigator_qualifications_delete" ON public.investigator_qualifications;
CREATE POLICY "investigator_qualifications_delete" ON public.investigator_qualifications FOR DELETE TO authenticated
  USING (is_admin());

-- informed_consents
DROP POLICY IF EXISTS "informed_consents_select" ON public.informed_consents;
CREATE POLICY "informed_consents_select" ON public.informed_consents FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "informed_consents_insert" ON public.informed_consents;
CREATE POLICY "informed_consents_insert" ON public.informed_consents FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "informed_consents_update" ON public.informed_consents;
CREATE POLICY "informed_consents_update" ON public.informed_consents FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "informed_consents_delete" ON public.informed_consents;
CREATE POLICY "informed_consents_delete" ON public.informed_consents FOR DELETE TO authenticated
  USING (is_admin());

-- protocol_versions
DROP POLICY IF EXISTS "protocol_versions_select" ON public.protocol_versions;
CREATE POLICY "protocol_versions_select" ON public.protocol_versions FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "protocol_versions_insert" ON public.protocol_versions;
CREATE POLICY "protocol_versions_insert" ON public.protocol_versions FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "protocol_versions_update" ON public.protocol_versions;
CREATE POLICY "protocol_versions_update" ON public.protocol_versions FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "protocol_versions_delete" ON public.protocol_versions;
CREATE POLICY "protocol_versions_delete" ON public.protocol_versions FOR DELETE TO authenticated
  USING (is_admin());

-- adverse_events
DROP POLICY IF EXISTS "adverse_events_select" ON public.adverse_events;
CREATE POLICY "adverse_events_select" ON public.adverse_events FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "adverse_events_insert" ON public.adverse_events;
CREATE POLICY "adverse_events_insert" ON public.adverse_events FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "adverse_events_update" ON public.adverse_events;
CREATE POLICY "adverse_events_update" ON public.adverse_events FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "adverse_events_delete" ON public.adverse_events;
CREATE POLICY "adverse_events_delete" ON public.adverse_events FOR DELETE TO authenticated
  USING (is_admin());

-- site_qualifications
DROP POLICY IF EXISTS "site_qualifications_select" ON public.site_qualifications;
CREATE POLICY "site_qualifications_select" ON public.site_qualifications FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "site_qualifications_insert" ON public.site_qualifications;
CREATE POLICY "site_qualifications_insert" ON public.site_qualifications FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "site_qualifications_update" ON public.site_qualifications;
CREATE POLICY "site_qualifications_update" ON public.site_qualifications FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "site_qualifications_delete" ON public.site_qualifications;
CREATE POLICY "site_qualifications_delete" ON public.site_qualifications FOR DELETE TO authenticated
  USING (is_admin());

-- monitoring_visits
DROP POLICY IF EXISTS "monitoring_visits_select" ON public.monitoring_visits;
CREATE POLICY "monitoring_visits_select" ON public.monitoring_visits FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "monitoring_visits_insert" ON public.monitoring_visits;
CREATE POLICY "monitoring_visits_insert" ON public.monitoring_visits FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "monitoring_visits_update" ON public.monitoring_visits;
CREATE POLICY "monitoring_visits_update" ON public.monitoring_visits FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "monitoring_visits_delete" ON public.monitoring_visits;
CREATE POLICY "monitoring_visits_delete" ON public.monitoring_visits FOR DELETE TO authenticated
  USING (is_admin());

-- fda_correspondence
DROP POLICY IF EXISTS "fda_correspondence_select" ON public.fda_correspondence;
CREATE POLICY "fda_correspondence_select" ON public.fda_correspondence FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "fda_correspondence_insert" ON public.fda_correspondence;
CREATE POLICY "fda_correspondence_insert" ON public.fda_correspondence FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "fda_correspondence_update" ON public.fda_correspondence;
CREATE POLICY "fda_correspondence_update" ON public.fda_correspondence FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "fda_correspondence_delete" ON public.fda_correspondence;
CREATE POLICY "fda_correspondence_delete" ON public.fda_correspondence FOR DELETE TO authenticated
  USING (is_admin());

-- protocol_deviations
DROP POLICY IF EXISTS "protocol_deviations_select" ON public.protocol_deviations;
CREATE POLICY "protocol_deviations_select" ON public.protocol_deviations FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "protocol_deviations_insert" ON public.protocol_deviations;
CREATE POLICY "protocol_deviations_insert" ON public.protocol_deviations FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "protocol_deviations_update" ON public.protocol_deviations;
CREATE POLICY "protocol_deviations_update" ON public.protocol_deviations FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "protocol_deviations_delete" ON public.protocol_deviations;
CREATE POLICY "protocol_deviations_delete" ON public.protocol_deviations FOR DELETE TO authenticated
  USING (is_admin());

-- communication_messages
DROP POLICY IF EXISTS "communication_messages_select" ON public.communication_messages;
CREATE POLICY "communication_messages_select" ON public.communication_messages FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "communication_messages_insert" ON public.communication_messages;
CREATE POLICY "communication_messages_insert" ON public.communication_messages FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "communication_messages_update" ON public.communication_messages;
CREATE POLICY "communication_messages_update" ON public.communication_messages FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "communication_messages_delete" ON public.communication_messages;
CREATE POLICY "communication_messages_delete" ON public.communication_messages FOR DELETE TO authenticated
  USING (is_admin());

-- enrollment_eligibility
DROP POLICY IF EXISTS "enrollment_eligibility_select" ON public.enrollment_eligibility;
CREATE POLICY "enrollment_eligibility_select" ON public.enrollment_eligibility FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "enrollment_eligibility_insert" ON public.enrollment_eligibility;
CREATE POLICY "enrollment_eligibility_insert" ON public.enrollment_eligibility FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "enrollment_eligibility_update" ON public.enrollment_eligibility;
CREATE POLICY "enrollment_eligibility_update" ON public.enrollment_eligibility FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "enrollment_eligibility_delete" ON public.enrollment_eligibility;
CREATE POLICY "enrollment_eligibility_delete" ON public.enrollment_eligibility FOR DELETE TO authenticated
  USING (is_admin());

-- treatment_outcomes
DROP POLICY IF EXISTS "treatment_outcomes_select" ON public.treatment_outcomes;
CREATE POLICY "treatment_outcomes_select" ON public.treatment_outcomes FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "treatment_outcomes_insert" ON public.treatment_outcomes;
CREATE POLICY "treatment_outcomes_insert" ON public.treatment_outcomes FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "treatment_outcomes_update" ON public.treatment_outcomes;
CREATE POLICY "treatment_outcomes_update" ON public.treatment_outcomes FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "treatment_outcomes_delete" ON public.treatment_outcomes;
CREATE POLICY "treatment_outcomes_delete" ON public.treatment_outcomes FOR DELETE TO authenticated
  USING (is_admin());

-- ncie_shipment_log
DROP POLICY IF EXISTS "ncie_shipment_log_select" ON public.ncie_shipment_log;
CREATE POLICY "ncie_shipment_log_select" ON public.ncie_shipment_log FOR SELECT TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "ncie_shipment_log_insert" ON public.ncie_shipment_log;
CREATE POLICY "ncie_shipment_log_insert" ON public.ncie_shipment_log FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "ncie_shipment_log_update" ON public.ncie_shipment_log;
CREATE POLICY "ncie_shipment_log_update" ON public.ncie_shipment_log FOR UPDATE TO authenticated
  USING (is_admin() OR is_verified_vet() OR is_clinical_admin()) WITH CHECK (is_admin() OR is_verified_vet() OR is_clinical_admin());
DROP POLICY IF EXISTS "ncie_shipment_log_delete" ON public.ncie_shipment_log;
CREATE POLICY "ncie_shipment_log_delete" ON public.ncie_shipment_log FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- admin_users (credential table — admin only)
-- ============================================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
CREATE POLICY "admin_users_select" ON public.admin_users FOR SELECT TO authenticated
  USING (is_admin());
DROP POLICY IF EXISTS "admin_users_insert" ON public.admin_users;
CREATE POLICY "admin_users_insert" ON public.admin_users FOR INSERT TO authenticated
  WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_users_update" ON public.admin_users;
CREATE POLICY "admin_users_update" ON public.admin_users FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin_users_delete" ON public.admin_users;
CREATE POLICY "admin_users_delete" ON public.admin_users FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- Deal-portal tables that defaulted to `USING (true)` TO PUBLIC (anon read).
-- Re-issue with TO authenticated and the approved-NDA gate (admin bypass
-- preserved), consistent with the deal-portal RLS model (055).
-- ============================================================================
DROP POLICY IF EXISTS "deal_team_members_select_any" ON deal_team_members;
CREATE POLICY "deal_team_members_select" ON deal_team_members FOR SELECT TO authenticated
  USING (is_admin() OR has_approved_nda());

DROP POLICY IF EXISTS "deal_pipeline_entries_select_any" ON deal_pipeline_entries;
CREATE POLICY "deal_pipeline_entries_select" ON deal_pipeline_entries FOR SELECT TO authenticated
  USING (is_admin() OR has_approved_nda());
