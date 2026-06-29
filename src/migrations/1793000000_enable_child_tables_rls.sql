-- Enable RLS and add baseline access policies on the four child tables that
-- belong-to public.patients: treatments, clinical_assessments, clinical_notes,
-- lab_results.
--
-- Pre-conditions (verified on project mzrmstscqlnfgsrsfjgh):
--   - public.patients already has RLS enabled with patients_select policy
--     (migration 1792000000_enable_patients_rls.sql).
--   - All four child tables have relrowsecurity = false and zero policies.
--   - Each child table carries a `patient_id` FK to public.patients(id).
--
-- Access model (matches patients):
--   - Vet sees a child row iff EXISTS (patient with id = patient_id and
--     enrolled_by_vet_email matching lowered JWT email).
--   - Admin (`app_metadata.role = 'admin'`) sees / writes all.
--   - DELETE is admin-only (mock layer cascades from deletePatient; the
--     real DELETE will be handled by either an admin path or the
--     service-role Edge Function once deletePatient itself is migrated).
--   - Anon role is not in the `TO authenticated` clause, so it is denied
--     by default (same posture as patients).
--
-- Out of scope for this migration:
--   - audit_logs, veterinarians, informed_consents, enrollment_eligibility,
--     adverse_events, protocol_versions, protocol_deviations, study_settings,
--     investigator_qualifications, site_qualifications, monitoring_visits,
--     fda_correspondence, communication_messages, treatment_outcomes,
--     ncie_shipment_log, media_uploads, radiograph_assessments, admin_users.
--   These remain RLS-off until their migration round.
--
-- Verification after applying:
--   select relname, relrowsecurity from pg_class
--   where relname in ('treatments','clinical_assessments','clinical_notes','lab_results')
--     and relnamespace = 'public'::regnamespace;
--   -- expect: all four with relrowsecurity = true
--
--   select tablename, count(*) from pg_policies
--   where schemaname = 'public'
--     and tablename in ('treatments','clinical_assessments','clinical_notes','lab_results')
--   group by tablename order by tablename;
--   -- expect: 4 policies per table (16 total)

-- Helper note: the predicate is duplicated across tables rather than wrapped
-- in a SECURITY DEFINER function. A function would centralise the logic but
-- introduces a second object to audit and risks privilege confusion; inline
-- predicates keep the policy semantics legible directly from pg_policies.

-- ============================================================================
-- treatments
-- ============================================================================
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatments_select" ON public.treatments;
CREATE POLICY "treatments_select"
  ON public.treatments
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "treatments_insert" ON public.treatments;
CREATE POLICY "treatments_insert"
  ON public.treatments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "treatments_update" ON public.treatments;
CREATE POLICY "treatments_update"
  ON public.treatments
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "treatments_delete" ON public.treatments;
CREATE POLICY "treatments_delete"
  ON public.treatments
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================================
-- clinical_assessments
-- ============================================================================
ALTER TABLE public.clinical_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_assessments_select" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_select"
  ON public.clinical_assessments
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "clinical_assessments_insert" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_insert"
  ON public.clinical_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "clinical_assessments_update" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_update"
  ON public.clinical_assessments
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "clinical_assessments_delete" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_delete"
  ON public.clinical_assessments
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================================
-- clinical_notes
-- ============================================================================
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_notes_select" ON public.clinical_notes;
CREATE POLICY "clinical_notes_select"
  ON public.clinical_notes
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_notes.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "clinical_notes_insert" ON public.clinical_notes;
CREATE POLICY "clinical_notes_insert"
  ON public.clinical_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_notes.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "clinical_notes_update" ON public.clinical_notes;
CREATE POLICY "clinical_notes_update"
  ON public.clinical_notes
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_notes.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_notes.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "clinical_notes_delete" ON public.clinical_notes;
CREATE POLICY "clinical_notes_delete"
  ON public.clinical_notes
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================================
-- lab_results
-- ============================================================================
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_results_select" ON public.lab_results;
CREATE POLICY "lab_results_select"
  ON public.lab_results
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = lab_results.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "lab_results_insert" ON public.lab_results;
CREATE POLICY "lab_results_insert"
  ON public.lab_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = lab_results.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "lab_results_update" ON public.lab_results;
CREATE POLICY "lab_results_update"
  ON public.lab_results
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = lab_results.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = lab_results.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "lab_results_delete" ON public.lab_results;
CREATE POLICY "lab_results_delete"
  ON public.lab_results
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
