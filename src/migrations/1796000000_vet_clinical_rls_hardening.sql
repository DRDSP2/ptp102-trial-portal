-- 1796000000: Vet clinical-data RLS hardening (MEDIUM M3, M4, M5, M6)
--
-- Context (verified against project mzrmstscqlnfgsrsfjgh):
--   - patients + child tables (treatments, clinical_assessments, clinical_notes,
--     lab_results) already had RLS enabled (1792000000 / 1793000000), but the
--     vet predicate was a bare email match: any authenticated caller whose JWT
--     `email` merely equalled `enrolled_by_vet_email` could read/write clinical
--     data — including vets whose verification_status is 'pending' or otherwise
--     not 'approved'. (M3)
--   - radiograph_assessments + media_uploads were created (1730757943) but never
--     had RLS enabled → readable/writable by any anon/authenticated key. (M4)
--   - veterinarians was RLS-OFF → vet PII (name, license, hospital, phone)
--     readable by any authenticated key. (M5)
--   - recovery_tokens was RLS-OFF → token hashes exposed to any authenticated
--     key. (M6)
--
-- Identity model (consistent with 1792000000 / 1793000000 / 055):
--   - Vet email carried in JWT `email` claim, lowercased by app code.
--   - Admin = app_metadata.role = 'admin' (reuse is_admin()).
--   - Edge Functions use the service-role key and bypass RLS.
--
-- This migration is idempotent (DROP POLICY IF EXISTS / CREATE OR REPLACE
-- FUNCTION) so it is safely re-runnable and revertible.
--
-- Behaviour change: pending/unverified vets lose clinical-data access until
-- their verification_status = 'approved'. Existing seeded vets are 'approved'.

-- ============================================================================
-- Helper: verified vet
-- ============================================================================
CREATE OR REPLACE FUNCTION is_verified_vet()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.veterinarians v
    WHERE v.email = lower(auth.jwt() ->> 'email')
      AND v.verification_status = 'approved'
  );
$$;

-- ============================================================================
-- M3: gate patients + child tables on verified vet
-- ============================================================================

-- patients -------------------------------------------------------------------
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_select" ON public.patients;
CREATE POLICY "patients_select"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND enrolled_by_vet_email = lower(auth.jwt() ->> 'email'))
  );

DROP POLICY IF EXISTS "patients_insert" ON public.patients;
CREATE POLICY "patients_insert"
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND enrolled_by_vet_email = lower(auth.jwt() ->> 'email'))
  );

DROP POLICY IF EXISTS "patients_update" ON public.patients;
CREATE POLICY "patients_update"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND enrolled_by_vet_email = lower(auth.jwt() ->> 'email'))
  )
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND enrolled_by_vet_email = lower(auth.jwt() ->> 'email'))
  );

DROP POLICY IF EXISTS "patients_delete" ON public.patients;
CREATE POLICY "patients_delete"
  ON public.patients
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- treatments -----------------------------------------------------------------
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatments_select" ON public.treatments;
CREATE POLICY "treatments_select"
  ON public.treatments
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "treatments_insert" ON public.treatments;
CREATE POLICY "treatments_insert"
  ON public.treatments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "treatments_update" ON public.treatments;
CREATE POLICY "treatments_update"
  ON public.treatments
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  )
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "treatments_delete" ON public.treatments;
CREATE POLICY "treatments_delete"
  ON public.treatments
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- clinical_assessments -------------------------------------------------------
ALTER TABLE public.clinical_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_assessments_select" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_select"
  ON public.clinical_assessments
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "clinical_assessments_insert" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_insert"
  ON public.clinical_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "clinical_assessments_update" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_update"
  ON public.clinical_assessments
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  )
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "clinical_assessments_delete" ON public.clinical_assessments;
CREATE POLICY "clinical_assessments_delete"
  ON public.clinical_assessments
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- clinical_notes -------------------------------------------------------------
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_notes_select" ON public.clinical_notes;
CREATE POLICY "clinical_notes_select"
  ON public.clinical_notes
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_notes.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "clinical_notes_insert" ON public.clinical_notes;
CREATE POLICY "clinical_notes_insert"
  ON public.clinical_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_notes.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "clinical_notes_update" ON public.clinical_notes;
CREATE POLICY "clinical_notes_update"
  ON public.clinical_notes
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_notes.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  )
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = clinical_notes.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "clinical_notes_delete" ON public.clinical_notes;
CREATE POLICY "clinical_notes_delete"
  ON public.clinical_notes
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- lab_results ----------------------------------------------------------------
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_results_select" ON public.lab_results;
CREATE POLICY "lab_results_select"
  ON public.lab_results
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = lab_results.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "lab_results_insert" ON public.lab_results;
CREATE POLICY "lab_results_insert"
  ON public.lab_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = lab_results.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "lab_results_update" ON public.lab_results;
CREATE POLICY "lab_results_update"
  ON public.lab_results
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = lab_results.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  )
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = lab_results.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "lab_results_delete" ON public.lab_results;
CREATE POLICY "lab_results_delete"
  ON public.lab_results
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- M4: enable RLS on radiograph_assessments + media_uploads (were RLS-OFF)
-- ============================================================================

-- radiograph_assessments -----------------------------------------------------
ALTER TABLE public.radiograph_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "radiograph_assessments_select" ON public.radiograph_assessments;
CREATE POLICY "radiograph_assessments_select"
  ON public.radiograph_assessments
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = radiograph_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "radiograph_assessments_insert" ON public.radiograph_assessments;
CREATE POLICY "radiograph_assessments_insert"
  ON public.radiograph_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = radiograph_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "radiograph_assessments_update" ON public.radiograph_assessments;
CREATE POLICY "radiograph_assessments_update"
  ON public.radiograph_assessments
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = radiograph_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  )
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = radiograph_assessments.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "radiograph_assessments_delete" ON public.radiograph_assessments;
CREATE POLICY "radiograph_assessments_delete"
  ON public.radiograph_assessments
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- media_uploads --------------------------------------------------------------
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_uploads_select" ON public.media_uploads;
CREATE POLICY "media_uploads_select"
  ON public.media_uploads
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = media_uploads.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "media_uploads_insert" ON public.media_uploads;
CREATE POLICY "media_uploads_insert"
  ON public.media_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = media_uploads.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "media_uploads_update" ON public.media_uploads;
CREATE POLICY "media_uploads_update"
  ON public.media_uploads
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = media_uploads.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  )
  WITH CHECK (
    is_admin()
    OR (is_verified_vet() AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = media_uploads.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    ))
  );

DROP POLICY IF EXISTS "media_uploads_delete" ON public.media_uploads;
CREATE POLICY "media_uploads_delete"
  ON public.media_uploads
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- M5: enable RLS on veterinarians (was RLS-OFF; protects vet PII)
--   A vet may read/update their own row (no verification gate, so an
--   unverified vet can still view their own profile to reach 'approved').
--   INSERT/DELETE are admin-only.
-- ============================================================================
ALTER TABLE public.veterinarians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "veterinarians_select" ON public.veterinarians;
CREATE POLICY "veterinarians_select"
  ON public.veterinarians
  FOR SELECT
  TO authenticated
  USING (is_admin() OR email = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "veterinarians_insert" ON public.veterinarians;
CREATE POLICY "veterinarians_insert"
  ON public.veterinarians
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "veterinarians_update" ON public.veterinarians;
CREATE POLICY "veterinarians_update"
  ON public.veterinarians
  FOR UPDATE
  TO authenticated
  USING (is_admin() OR email = lower(auth.jwt() ->> 'email'))
  WITH CHECK (is_admin() OR email = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "veterinarians_delete" ON public.veterinarians;
CREATE POLICY "veterinarians_delete"
  ON public.veterinarians
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- M6: enable RLS on recovery_tokens (was RLS-OFF; token hashes exposed)
--   Table is unused by client code; consumed server-side by service-role Edge
--   Functions (which bypass RLS). No anon/authenticated client access.
-- ============================================================================
ALTER TABLE public.recovery_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recovery_tokens_admin" ON public.recovery_tokens;
CREATE POLICY "recovery_tokens_admin"
  ON public.recovery_tokens
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
