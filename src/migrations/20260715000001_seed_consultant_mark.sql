-- 1800000004: Seed the FDA consultant account — Mark Hughes.
--
-- Idempotent: removes the temporary password-policy verifier user and
-- (re)creates Mark's auth.users row. Profile fields live in
-- raw_user_meta_data only (no public.profiles / no veterinarians row — the
-- consultant is NOT a verified vet; access is granted by RLS via
-- is_clinical_admin() and by app gating).
--
-- IMPORTANT (password reset flow):
--   * role is stored in app_metadata (read by is_consultant()/is_clinical_admin()).
--   * must_reset_password lives in raw_user_meta_data (user_metadata) so the
--     client can CLEAR it itself via updateUser({ data: { must_reset_password: false } })
--     after the first login password change. app_metadata cannot be written from
--     the client, which is why the flag is in user_metadata.

-- 1) Remove the temporary verifier user created during the password-policy check.
DELETE FROM auth.users WHERE email = 'policy-check-verify@byrock.example';

-- 2) (Re)create Mark's account. Fixed UUID keeps the row stable across re-runs.
DELETE FROM auth.users WHERE email = 'mark@hughesvet.com';

DO $$
DECLARE
  v_instance uuid;
  v_mark_id  uuid := 'f9c0e8a2-7b3d-4c1e-9a6f-2b5e8d1c4a7b';
BEGIN
  SELECT instance_id INTO v_instance FROM auth.users LIMIT 1;

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    confirmation_token, confirmation_sent_at, recovery_token,
    raw_app_meta_data, raw_user_meta_data, aud, role,
    is_super_admin, is_anonymous, is_sso_user, deleted_at,
    created_at, updated_at, last_sign_in_at, invited_at
  ) VALUES (
    v_mark_id, v_instance, 'mark@hughesvet.com',
    crypt('Kv8qTx2mPz', gen_salt('bf')), now(),
    '', null, '',
    '{"provider":"email","role":"consultant"}'::jsonb,
    '{"first_name":"Mark","last_name":"Hughes","full_name":"Mark Hughes, DVM, MS","organization":"Hughes Veterinary Consulting","address":"16957 Quail Crossing, Ramona, CA 92065, USA","mobile":"+1 760-315-1130","email":"mark@hughesvet.com","must_reset_password":true}'::jsonb,
    'authenticated', 'authenticated',
    false, false, false, null,
    now(), now(), null, null
  );
END $$;
