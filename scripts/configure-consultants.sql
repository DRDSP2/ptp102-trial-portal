-- Configure existing Supabase-managed users as PTP-102 consultants.
--
-- Run manually in the Supabase SQL Editor only after both users have been
-- created and email-confirmed through Authentication > Users. This script
-- never inserts into auth.users/auth.identities and never stores or changes a
-- password. If either account is missing, the transaction is rolled back.

BEGIN;

DO $$
BEGIN
  UPDATE auth.users
  SET
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'consultant'),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'first_name', 'Mark',
        'last_name', 'Hughes',
        'full_name', 'Mark Hughes, DVM, MS',
        'organization', 'Hughes Veterinary Consulting',
        'address', '16957 Quail Crossing, Ramona, CA 92065, USA',
        'mobile', '+1 760-315-1130',
        'email', 'mark@hughesvet.com',
        'must_reset_password', false
      ),
    updated_at = now()
  WHERE lower(email) = lower('mark@hughesvet.com');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Create and confirm the Mark consultant user through Supabase Authentication before running this script';
  END IF;

  UPDATE auth.users
  SET
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'consultant'),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'first_name', 'Daniel',
        'last_name', 'Shanahan-Prendergast',
        'full_name', 'Daniel Shanahan-Prendergast',
        'organization', 'Byrock Technologies Ltd.',
        'email', 'drdsp@protonmail.ch',
        'must_reset_password', false
      ),
    updated_at = now()
  WHERE lower(email) = lower('drdsp@protonmail.ch');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Create and confirm the Daniel consultant user through Supabase Authentication before running this script';
  END IF;
END $$;

COMMIT;

-- Both rows should report consultant / false / true / true.
SELECT
  email,
  raw_app_meta_data ->> 'role' AS app_role,
  COALESCE((raw_user_meta_data ->> 'must_reset_password')::boolean, false)
    AS must_reset_password,
  email_confirmed_at IS NOT NULL AS confirmed,
  EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE auth.identities.user_id = auth.users.id
      AND auth.identities.provider = 'email'
  ) AS has_email_identity
FROM auth.users
WHERE lower(email) IN ('mark@hughesvet.com', 'drdsp@protonmail.ch')
ORDER BY email;
