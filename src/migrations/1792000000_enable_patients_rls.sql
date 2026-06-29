-- Enable RLS on public.patients and add baseline access policies.
--
-- Context (verified against project mzrmstscqlnfgsrsfjgh on 2026-06-22):
--   - patients.relrowsecurity = false  (RLS disabled)
--   - zero policies on public.patients
--   - 22 of 28 public tables in the same state; this migration only addresses
--     `patients` per the in-flight migration scope. Companion tables
--     (treatments, clinical_assessments, clinical_notes, lab_results, etc.)
--     remain unprotected and are explicitly out of scope here.
--
-- Identity model assumed by these policies:
--   - Vets sign in via supabase.auth.signInWithPassword. The JWT carries an
--     `email` claim. Application code (src/context/AuthContext.tsx) normalises
--     the email to lowercase before sign-in; we coerce again here with lower()
--     to harden against any caller that forgets.
--   - Admin role is carried in `app_metadata.role = 'admin'`, mirroring
--     roleFromUser() in src/context/AuthContext.tsx and src/lib/upload/access.ts.
--   - Edge Functions use the service-role key and bypass RLS unchanged.
--
-- After applying, verify:
--   1. select relrowsecurity from pg_class where relname = 'patients';   -- true
--   2. select policyname from pg_policies where tablename = 'patients';  -- 4 rows
--   3. Anonymous SELECT still returns [] (it already did because anon has no
--      matching policy — anon is not granted the `authenticated` role).
--   4. A vet JWT with email = X can only SELECT rows where
--      enrolled_by_vet_email = X. Admin JWT sees all rows.

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- SELECT ---------------------------------------------------------------------
DROP POLICY IF EXISTS "patients_select" ON public.patients;
CREATE POLICY "patients_select"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
  );

-- INSERT ---------------------------------------------------------------------
DROP POLICY IF EXISTS "patients_insert" ON public.patients;
CREATE POLICY "patients_insert"
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
  );

-- UPDATE ---------------------------------------------------------------------
DROP POLICY IF EXISTS "patients_update" ON public.patients;
CREATE POLICY "patients_update"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
  );

-- DELETE ---------------------------------------------------------------------
DROP POLICY IF EXISTS "patients_delete" ON public.patients;
CREATE POLICY "patients_delete"
  ON public.patients
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
