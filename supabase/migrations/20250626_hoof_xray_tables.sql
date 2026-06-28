-- Supabase SQL migration: Hoof X-Ray tables with RLS
-- Run via Supabase SQL Editor or migrations

CREATE TABLE IF NOT EXISTS public.hoof_xrays (
  id              SERIAL PRIMARY KEY,
  patient_id      INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vet_email       TEXT NOT NULL,
  hoof            TEXT NOT NULL CHECK (hoof IN ('FL','FR','HL','HR')),
  scan_date       DATE NOT NULL,
  view            TEXT NOT NULL CHECK (view IN ('Lateral','DP')),
  modality        TEXT,
  description     TEXT,
  storage_path    TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.hoof_xrays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets can view their own patients x-rays"
  ON public.hoof_xrays FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = hoof_xrays.patient_id AND p.enrolled_by_vet_email = auth.email())
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Vets can insert x-rays for their own patients"
  ON public.hoof_xrays FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = hoof_xrays.patient_id AND p.enrolled_by_vet_email = auth.email())
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Vets can update their own x-rays"
  ON public.hoof_xrays FOR UPDATE USING (
    created_by = auth.uid() OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Vets can delete their own x-rays"
  ON public.hoof_xrays FOR DELETE USING (
    created_by = auth.uid() OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin')
  );

CREATE TABLE IF NOT EXISTS public.xray_landmarks (
  id              SERIAL PRIMARY KEY,
  xray_id         INTEGER NOT NULL REFERENCES public.hoof_xrays(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  x               NUMERIC(5,2) NOT NULL,
  y               NUMERIC(5,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.xray_landmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landmarks follow x-ray access"
  ON public.xray_landmarks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hoof_xrays xr JOIN public.patients p ON p.id = xr.patient_id WHERE xr.id = xray_landmarks.xray_id AND p.enrolled_by_vet_email = auth.email())
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin')
  );

CREATE TABLE IF NOT EXISTS public.xray_measurements (
  id              SERIAL PRIMARY KEY,
  xray_id         INTEGER NOT NULL REFERENCES public.hoof_xrays(id) ON DELETE CASCADE,
  metric          TEXT NOT NULL,
  value           NUMERIC(8,3) NOT NULL,
  unit            TEXT,
  severity        TEXT CHECK (severity IN ('normal','mild','moderate','severe')),
  deviation_z     NUMERIC(6,3),
  computed_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.xray_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Measurements follow x-ray access"
  ON public.xray_measurements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hoof_xrays xr JOIN public.patients p ON p.id = xr.patient_id WHERE xr.id = xray_measurements.xray_id AND p.enrolled_by_vet_email = auth.email())
    OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin')
  );

CREATE TABLE IF NOT EXISTS public.xray_audit_log (
  id              SERIAL PRIMARY KEY,
  xray_id         INTEGER REFERENCES public.hoof_xrays(id) ON DELETE SET NULL,
  patient_id      INTEGER REFERENCES public.patients(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email      TEXT,
  user_role       TEXT,
  action          TEXT NOT NULL CHECK (action IN ('UPLOAD','VIEW','ANALYZE','LANDMARK_ADD','DELETE')),
  entity_type     TEXT,
  entity_id       INTEGER,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.xray_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit entries"
  ON public.xray_audit_log FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Authenticated users can write audit entries"
  ON public.xray_audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_hoof_xrays_patient ON public.hoof_xrays(patient_id);
CREATE INDEX IF NOT EXISTS idx_hoof_xrays_vet ON public.hoof_xrays(vet_email);
CREATE INDEX IF NOT EXISTS idx_hoof_xrays_scan_date ON public.hoof_xrays(scan_date);
CREATE INDEX IF NOT EXISTS idx_xray_landmarks_xray ON public.xray_landmarks(xray_id);
CREATE INDEX IF NOT EXISTS idx_xray_measurements_xray ON public.xray_measurements(xray_id);
CREATE INDEX IF NOT EXISTS idx_xray_audit_log_user ON public.xray_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_xray_audit_log_xray ON public.xray_audit_log(xray_id);
CREATE INDEX IF NOT EXISTS idx_xray_audit_log_action ON public.xray_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_xray_audit_log_created ON public.xray_audit_log(created_at);
