import { action } from '@uibakery/data';

function simpleRegisterVet() {
  return action('simpleRegisterVet', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO veterinarians (
        full_name,
        email,
        password_hash,
        license_number,
        hospital_affiliation,
        tc_accepted,
        tc_accepted_at,
        signature_text,
        created_at,
        updated_at
      )
      VALUES (
        {{params.fullName}},
        LOWER({{params.email}}),
        {{params.passwordHash}},
        {{params.licenseNumber}},
        {{params.hospitalAffiliation}},
        true,
        NOW(),
        {{params.signatureText}},
        NOW(),
        NOW()
      )
      RETURNING id, email, full_name, tc_accepted, created_at;
    `,
  });
}

export default simpleRegisterVet;
