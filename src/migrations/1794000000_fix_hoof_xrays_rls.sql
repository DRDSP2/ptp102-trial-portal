-- Fix hoof_xrays RLS policies so anon requests are denied by RLS instead of
-- erroring on direct auth.users access, and authenticated vets/admins follow
-- the same JWT-based access model as patients and child tables.

ALTER TABLE public.hoof_xrays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vets can view their own patients x-rays" ON public.hoof_xrays;
DROP POLICY IF EXISTS "Vets can insert x-rays for their own patients" ON public.hoof_xrays;
DROP POLICY IF EXISTS "Vets can update their own x-rays" ON public.hoof_xrays;
DROP POLICY IF EXISTS "Vets can delete their own x-rays" ON public.hoof_xrays;

DROP POLICY IF EXISTS "hoof_xrays_select" ON public.hoof_xrays;
CREATE POLICY "hoof_xrays_select"
  ON public.hoof_xrays
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = hoof_xrays.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "hoof_xrays_insert" ON public.hoof_xrays;
CREATE POLICY "hoof_xrays_insert"
  ON public.hoof_xrays
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = hoof_xrays.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "hoof_xrays_update" ON public.hoof_xrays;
CREATE POLICY "hoof_xrays_update"
  ON public.hoof_xrays
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = hoof_xrays.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = hoof_xrays.patient_id
        AND p.enrolled_by_vet_email = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "hoof_xrays_delete" ON public.hoof_xrays;
CREATE POLICY "hoof_xrays_delete"
  ON public.hoof_xrays
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
