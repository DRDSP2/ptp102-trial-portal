-- verify-consultant-rls.sql
--
-- Manual verification of the consultant RLS grants (migration 20260715000000)
-- and the Supabase-managed consultant accounts.
--
-- Run this in the Supabase SQL Editor (or `supabase db query --linked --file`).
-- It impersonates a consultant via the JWT claims GUC under the `authenticated`
-- role (RLS applies to it) and checks what each table returns.
--
-- Expected results:
--   * Clinical tables the consultant is granted return rows (or 0 only because
--     those tables are empty in this environment — the policy still allows).
--   * Deal-room tables return 0 rows even when an admin can see data in them
--     (proving the denial is RLS, not an empty table). `cmc_documents` is the
--     canary: an admin sees its rows; a consultant must see 0.
--
-- Note: on this environment the broader compliance / study / supply / audit
-- surfaces are served by the localStorage data layer (@uibakery/data), so they
-- have no Supabase RLS and are not checked here. Their access is granted by
-- app gating (isStaff) in DashboardPage.

BEGIN;

SET ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"aud":"authenticated","role":"authenticated","app_metadata":{"role":"consultant"},"email":"mark@hughesvet.com"}',
  true
);

SELECT
  (SELECT count(*) FROM patients)        AS consultant_patients,
  (SELECT count(*) FROM hoof_xrays)      AS consultant_hoof_xrays,
  (SELECT count(*) FROM veterinarians)   AS consultant_veterinarians,
  (SELECT count(*) FROM cmc_documents)   AS consultant_cmc_documents,
  (SELECT count(*) FROM term_sheets)     AS consultant_term_sheets,
  (SELECT count(*) FROM offer_requests)  AS consultant_offer_requests;

RESET ROLE;

-- Control: an admin MUST see the deal-room data the consultant was denied.
SET ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"aud":"authenticated","role":"authenticated","app_metadata":{"role":"admin"},"email":"admin@byrock.eth.limo"}',
  true
);

SELECT
  (SELECT count(*) FROM cmc_documents)  AS admin_cmc_documents,
  (SELECT count(*) FROM offer_requests) AS admin_offer_requests;

RESET ROLE;

-- Confirm both Supabase-managed consultant accounts have the right shape.
SELECT email,
       raw_app_meta_data ->> 'role'            AS role,
       raw_user_meta_data ->> 'full_name'     AS full_name,
       raw_user_meta_data ->> 'must_reset_password' AS must_reset,
       (encrypted_password IS NOT NULL)        AS has_password,
       email_confirmed_at IS NOT NULL          AS email_confirmed
FROM auth.users
WHERE lower(email) IN ('mark@hughesvet.com', 'drdsp@protonmail.ch')
ORDER BY email;

COMMIT;
