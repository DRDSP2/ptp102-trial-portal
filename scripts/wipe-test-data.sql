-- =============================================================================
-- WIPE TEST PATIENT + VET DATA  (PREPARED — DO NOT RUN WITHOUT EXPLICIT GO-AHEAD)
-- =============================================================================
--
-- Scope (per request):
--   * Wipe demo/test PATIENT clinical data and VET (veterinarian) accounts.
--   * DO NOT touch: admin_users, audit infra (audit_logs, deal_access_logs,
--     file_audit_log, xray_audit_log), schema/migrations, or the deal/investor
--     portal tables (ndas, term_sheets, licences, certificates, company_profile,
--     cap_table_entries, region_marketplace, etc.).
--
-- IMPORTANT — what lives where:
--   * The clinical-trial UI reads patients/notes/xrays/etc. from CLIENT-SIDE
--     localStorage (the @uibakery/data mock alias), NOT from Supabase. So the
--     Supabase `patients` table is currently EMPTY (0 rows) and this server
--     script will clear ~nothing of the in-browser demo data. To reset what a
--     vet actually SEES, clear that browser's localStorage (key namespace
--     `ptp102_mock_*`) or ship a "Reset demo data" action.
--   * The 4 rows in `veterinarians` ARE server-side (test accounts) and are the
--     real target of this script.
--   * `ptp102-trial-media` (patient x-rays) has 0 objects; `ptp102-trial-portal`
--     (19 objects) holds deal/portal documents and is intentionally left alone.
--
-- Live counts captured before writing (read-only):
--   patients=0, veterinarians=4 (ted@tesd.me, lisa@lisa.me, test123@me.com,
--   drsmith@me.com), all child clinical tables=0, ptp102-trial-media=0.
-- =============================================================================

BEGIN;

-- 1) Child clinical tables (all currently 0 rows, included for completeness) ----
DELETE FROM xray_measurements;
DELETE FROM xray_landmarks;
DELETE FROM radiograph_assessments;
DELETE FROM hoof_xrays;
DELETE FROM informed_consents;
DELETE FROM adverse_events;
DELETE FROM protocol_deviations;
DELETE FROM enrollment_eligibility;
DELETE FROM lab_results;
DELETE FROM treatment_outcomes;
DELETE FROM treatments;
DELETE FROM clinical_assessments;
DELETE FROM clinical_notes;
DELETE FROM monitoring_visits;
DELETE FROM media_uploads;
DELETE FROM file_registry;
DELETE FROM communication_messages;
DELETE FROM trial_events;

-- 2) Patients ------------------------------------------------------------------
DELETE FROM patients;

-- 3) Test veterinarian accounts (admin_users is NOT touched) -------------------
-- List the exact test emails so a real vet can never be caught by this.
DELETE FROM veterinarians
WHERE email IN (
  'ted@tesd.me',
  'lisa@lisa.me',
  'test123@me.com',
  'drsmith@me.com'
);

-- 4) Remove the matching auth users so the test vets can no longer log in.
DELETE FROM auth.users
WHERE email IN (
  'ted@tesd.me',
  'lisa@lisa.me',
  'test123@me.com',
  'drsmith@me.com'
);

COMMIT;
