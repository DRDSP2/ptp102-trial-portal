import { action } from '@uibakery/data';

function createInformedConsent() {
  return action('createInformedConsent', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO informed_consents (
        patient_id, owner_name, owner_address, owner_phone, owner_email,
        owner_relationship, horse_name, horse_breed, horse_age, horse_weight, horse_microchip,
        icf_status, icf_viewed_at, icf_can_sign_after, section_acknowledgments
      )
      VALUES (
        {{params.patientId}}::int, {{params.ownerName}}, {{params.ownerAddress}},
        {{params.ownerPhone}}, {{params.ownerEmail}}, {{params.ownerRelationship}},
        {{params.horseName}}, {{params.horseBreed}}, {{params.horseAge}}::int,
        {{params.horseWeight}}::numeric, {{params.horseMicrochip}},
        'viewed', NOW(), NOW() + INTERVAL '12 hours', {{params.sectionAcknowledgments}}::jsonb
      )
      RETURNING *;
    `,
  });
}

export default createInformedConsent;
