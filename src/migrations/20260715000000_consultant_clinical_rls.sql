-- 20260715000000: Consultant role — RLS grants for clinical tables that exist
-- on this environment.
--
-- A "consultant" (FDA consultant) gets full admin-level READ + EDIT access to
-- the clinical/compliance data, but MUST NOT reach any Deal Room table.
--
-- Deal-room tables (offer_requests, deal_profiles, deal_access_logs,
-- cmc_documents, pitch_deck_slides, company_profile, regulatory_modules,
-- manufacturing_dossier_sections, governance_documents, financial_projections,
-- term_sheets, term_sheet_versions, licences, region_marketplace,
-- cap_table_entries, esop_grants, ip_portfolio, ndas, compliance_register,
-- licence_requests, certificates, and the deal-room-documents /
-- licence-certificates storage buckets) are gated exclusively by is_admin()
-- or by a deal_profiles row. A consultant is neither admin nor has a
-- deal_profiles row, so those policies already deny read/write. No deal policy
-- is changed here — the denial is by construction.
--
-- NOTE: On this environment the clinical data that lives in Postgres is the
-- vet-scoped set (patients + child tables), veterinarians, and hoof_xrays.
-- The broader compliance/study/supply/audit surfaces are served by the
-- localStorage data layer (@uibakery/data), so no Supabase RLS exists for them
-- here; access to those UI areas is granted by app gating (isStaff). The
-- policies below are therefore scoped to the tables that actually have RLS.

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_consultant()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'consultant';
$$;

CREATE OR REPLACE FUNCTION is_clinical_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'consultant');
$$;

-- ---------------------------------------------------------------------------
-- Vet-scoped clinical tables: open SELECT/INSERT/UPDATE to consultant as full
-- admin; DELETE stays admin-only (handled by the existing admin-only policies,
-- which are left unchanged). Each ALTER is wrapped so a missing policy on a
-- given environment does not abort the whole script.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_exists boolean;
BEGIN
  -- patients
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='patients' AND policyname='patients_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY patients_select ON public.patients USING (is_clinical_admin() OR (is_verified_vet() AND enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))';
    EXECUTE 'ALTER POLICY patients_insert ON public.patients WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))';
    EXECUTE 'ALTER POLICY patients_update ON public.patients USING (is_clinical_admin() OR (is_verified_vet() AND enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))) WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))';
  END IF;

  -- treatments
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='treatments' AND policyname='treatments_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY treatments_select ON public.treatments USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = treatments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY treatments_insert ON public.treatments WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = treatments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY treatments_update ON public.treatments USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = treatments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))) WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = treatments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
  END IF;

  -- clinical_assessments
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clinical_assessments' AND policyname='clinical_assessments_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY clinical_assessments_select ON public.clinical_assessments USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = clinical_assessments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY clinical_assessments_insert ON public.clinical_assessments WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = clinical_assessments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY clinical_assessments_update ON public.clinical_assessments USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = clinical_assessments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))) WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = clinical_assessments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
  END IF;

  -- clinical_notes
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clinical_notes' AND policyname='clinical_notes_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY clinical_notes_select ON public.clinical_notes USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = clinical_notes.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY clinical_notes_insert ON public.clinical_notes WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = clinical_notes.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY clinical_notes_update ON public.clinical_notes USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = clinical_notes.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))) WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = clinical_notes.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
  END IF;

  -- lab_results
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lab_results' AND policyname='lab_results_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY lab_results_select ON public.lab_results USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = lab_results.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY lab_results_insert ON public.lab_results WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = lab_results.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY lab_results_update ON public.lab_results USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = lab_results.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))) WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = lab_results.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
  END IF;

  -- radiograph_assessments
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='radiograph_assessments' AND policyname='radiograph_assessments_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY radiograph_assessments_select ON public.radiograph_assessments USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = radiograph_assessments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY radiograph_assessments_insert ON public.radiograph_assessments WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = radiograph_assessments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY radiograph_assessments_update ON public.radiograph_assessments USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = radiograph_assessments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))) WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = radiograph_assessments.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
  END IF;

  -- media_uploads
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='media_uploads' AND policyname='media_uploads_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY media_uploads_select ON public.media_uploads USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = media_uploads.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY media_uploads_insert ON public.media_uploads WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = media_uploads.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
    EXECUTE 'ALTER POLICY media_uploads_update ON public.media_uploads USING (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = media_uploads.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))) WITH CHECK (is_clinical_admin() OR (is_verified_vet() AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = media_uploads.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))))';
  END IF;

  -- hoof_xrays (originally hard-gated on role='admin')
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hoof_xrays' AND policyname='hoof_xrays_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY hoof_xrays_select ON public.hoof_xrays USING (is_clinical_admin() OR EXISTS (SELECT 1 FROM public.patients p WHERE p.id = hoof_xrays.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))';
    EXECUTE 'ALTER POLICY hoof_xrays_insert ON public.hoof_xrays WITH CHECK (is_clinical_admin() OR EXISTS (SELECT 1 FROM public.patients p WHERE p.id = hoof_xrays.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))';
    EXECUTE 'ALTER POLICY hoof_xrays_update ON public.hoof_xrays USING (is_clinical_admin() OR EXISTS (SELECT 1 FROM public.patients p WHERE p.id = hoof_xrays.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email''))) WITH CHECK (is_clinical_admin() OR EXISTS (SELECT 1 FROM public.patients p WHERE p.id = hoof_xrays.patient_id AND p.enrolled_by_vet_email = lower(auth.jwt() ->> ''email'')))';
  END IF;

  -- veterinarians (full admin read/update for consultant; INSERT/DELETE stay admin-only)
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='veterinarians' AND policyname='veterinarians_select') INTO v_exists;
  IF v_exists THEN
    EXECUTE 'ALTER POLICY veterinarians_select ON public.veterinarians USING (is_clinical_admin() OR email = lower(auth.jwt() ->> ''email''))';
    EXECUTE 'ALTER POLICY veterinarians_update ON public.veterinarians USING (is_clinical_admin() OR email = lower(auth.jwt() ->> ''email'')) WITH CHECK (is_clinical_admin() OR email = lower(auth.jwt() ->> ''email''))';
  END IF;
END $$;
