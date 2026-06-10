import { action } from '@uibakery/data';

function acceptTermsAndConditions() {
  return action('acceptTermsAndConditions', 'SQL', {
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
        signature_text
      )
      VALUES (
        {{params.fullName}},
        {{params.email}},
        {{params.passwordHash}},
        {{params.licenseNumber}},
        {{params.hospitalAffiliation}},
        true,
        NOW(),
        {{params.signatureText}}
      )
      ON CONFLICT (email) 
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        license_number = EXCLUDED.license_number,
        hospital_affiliation = EXCLUDED.hospital_affiliation,
        tc_accepted = true,
        tc_accepted_at = NOW(),
        signature_text = EXCLUDED.signature_text,
        updated_at = NOW()
      RETURNING *;
    `,
  });
}

export default acceptTermsAndConditions;
