-- Enable RLS on public.audit_logs and add the hash-chain / context columns
-- the application layer already writes (see src/lib/auditTypes.ts and
-- src/lib/uibakeryDataMock.ts recordAudit).
--
-- Context (verified against project mzrmstscqlnfgsrsfjgh on 2026-06-22):
--   - audit_logs.relrowsecurity = false  (RLS disabled)
--   - zero policies on public.audit_logs
--   - The table was created by 1738500000_create_compliance_framework.sql
--     with: id, user_id, user_email, user_role, action, entity_type,
--     entity_id, field_name, old_value, new_value, reason_for_change,
--     ip_address, user_agent, session_id, timestamp.
--   - The application's AuditLogEntry type (and the mock layer) also carry
--     sequence_number, patient_id, study_id, client_hash, previous_hash.
--     loadAuditLogs.sql already ORDER BY sequence_number, so the column
--     MUST exist on the real table. This migration adds the missing
--     columns so the live table matches the contract the code assumes.
--
-- Access model:
--   - Any authenticated user may INSERT a row describing their own action
--     (WITH CHECK auth.uid() IS NOT NULL). The application fills
--     user_id/user_email/user_role from the JWT; we don't enforce email
--     equality here to keep the policy cheap and because service-role
--     Edge Functions (recovery-request, recovery-complete) also write
--     audit rows without a user JWT.
--   - SELECT is admin-only (app_metadata.role = 'admin'). Vets cannot
--     read the audit trail; the AuditLogPage is admin-guarded in the UI
--     already (ProtectedRoute + role check).
--   - UPDATE and DELETE are denied to everyone (append-only, 21 CFR
--     Part 11 posture). The service-role key bypasses RLS for any
--     operational cleanup that is ever required.
--   - Anon role is not in the TO authenticated clause, so it is denied
--     by default.
--
-- After applying, verify:
--   1. select relrowsecurity from pg_class where relname = 'audit_logs';  -- true
--   2. select policyname from pg_policies where tablename = 'audit_logs'; -- 3 rows
--   3. \d audit_logs  -- shows sequence_number, patient_id, study_id,
--      client_hash, previous_hash columns

-- ============================================================================
-- 1. Add missing columns (idempotent)
-- ============================================================================
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS sequence_number BIGINT;
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS patient_id BIGINT;
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS study_id TEXT;
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS client_hash TEXT;
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS previous_hash TEXT;

-- Backfill sequence_number for any pre-existing rows so ORDER BY is stable.
UPDATE public.audit_logs
  SET sequence_number = r.rn
  FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY timestamp ASC) AS rn FROM public.audit_logs) r
  WHERE public.audit_logs.id = r.id AND public.audit_logs.sequence_number IS NULL;

-- Index the chain columns for the AuditLogViewer ordering + chain verification.
CREATE INDEX IF NOT EXISTS idx_audit_sequence ON public.audit_logs(sequence_number);
CREATE INDEX IF NOT EXISTS idx_audit_patient ON public.audit_logs(patient_id);

-- ============================================================================
-- 2. Enable RLS
-- ============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT (admin-only) --------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- INSERT (any authenticated user records their own action) -------------------
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE / DELETE: intentionally no policy => denied for authenticated role.
-- Service-role key bypasses RLS for operational maintenance only.
