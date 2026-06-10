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
        verification_status,
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
        'pending',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        license_number = EXCLUDED.license_number,
        hospital_affiliation = EXCLUDED.hospital_affiliation,
        tc_accepted = true,
        tc_accepted_at = NOW(),
        signature_text = EXCLUDED.signature_text,
        verification_status = 'pending',
        updated_at = NOW()
      RETURNING *;
    `,
  });
}

export default simpleRegisterVet;
