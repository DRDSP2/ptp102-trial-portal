-- 20260717000000: Fix Mark Hughes consultant login — add missing auth.identities row.
--
-- GoTrue v2.193.0 eagerly loads auth.identities during FindUserByEmailAndAudience.
-- Mark's user was inserted directly into auth.users by the seed migration
-- (20260715000001) without a corresponding auth.identities row, causing a
-- "Database error querying schema" on login.
--
-- This is idempotent: safe to re-run.

DO $$
DECLARE
  v_mark_id uuid := 'f9c0e8a2-7b3d-4c1e-9a6f-2b5e8d1c4a7b';
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_mark_id
      AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_mark_id,
      v_mark_id,
      v_mark_id::text,
      jsonb_build_object('sub', v_mark_id, 'email', 'mark@hughesvet.com'),
      'email',
      NULL,
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
