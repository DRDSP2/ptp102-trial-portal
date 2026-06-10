import { action } from '@uibakery/data';

function createGoogleOAuthVet() {
  return action('createGoogleOAuthVet', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO veterinarians (
        full_name,
        email,
        license_number,
        hospital_affiliation,
        tc_accepted,
        tc_accepted_at,
        signature_text,
        password_hash,
        last_login
      ) VALUES (
        {{params.fullName}},
        {{params.email}},
        'PENDING',
        'Google OAuth',
        false,
        NULL,
        NULL,
        'GOOGLE_OAUTH',
        NOW()
      )
      RETURNING id, email, full_name, tc_accepted;
    `,
  });
}

export default createGoogleOAuthVet;
