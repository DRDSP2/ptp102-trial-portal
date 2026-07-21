-- Add a second FDA consultant account for trial-portal testing.
--
-- The account mirrors Mark Hughes's consultant role and first-login security
-- flow: consultant access is carried in app metadata, while the client-writable
-- must_reset_password flag forces a password change before the dashboard can
-- be used. Only a one-way bcrypt hash of the temporary password is stored here.

DO $$
DECLARE
  v_instance_id uuid;
  v_user_id uuid := '7a6b2f4e-3d91-4f62-8c5a-1b9e0d7f2643';
  v_email text := 'drdsp@protonmail.ch';
BEGIN
  SELECT instance_id
  INTO v_instance_id
  FROM auth.users
  LIMIT 1;

  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'Cannot create consultant account without an auth instance';
  END IF;

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    confirmation_token, confirmation_sent_at, recovery_token,
    raw_app_meta_data, raw_user_meta_data, aud, role,
    is_super_admin, is_anonymous, is_sso_user, deleted_at,
    created_at, updated_at, last_sign_in_at, invited_at
  ) VALUES (
    v_user_id, v_instance_id, v_email,
    '$2a$10$pzdm5pQ0qulJVVBHESwNjeyVkSfdqs90r4XgLf6T8SnY46u7Fh8oi', now(),
    '', null, '',
    '{"provider":"email","role":"consultant"}'::jsonb,
    jsonb_build_object(
      'first_name', 'Daniel',
      'last_name', 'Shanahan-Prendergast',
      'full_name', 'Daniel Shanahan-Prendergast',
      'organization', 'Byrock Technologies Ltd.',
      'email', v_email,
      'must_reset_password', true
    ),
    'authenticated', 'authenticated',
    false, false, false, null,
    now(), now(), null, null
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_user_id
      AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id, 'email', v_email),
      'email',
      null,
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
