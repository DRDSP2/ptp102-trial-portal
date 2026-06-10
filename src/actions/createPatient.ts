import { action } from '@uibakery/data';

function createPatient() {
  return action('createPatient', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO patients (
        horse_name, age, breed, weight, sex, 
        owner_name, owner_contact, enrollment_date, 
        trial_status, eligibility_verified, consent_date,
        digital_pulse, hoof_wall_temperature, coronary_band_condition,
        hoof_tester_response, stance, gait,
        enrollment_heart_rate, enrollment_respiratory_rate, enrollment_temperature,
        body_condition_score, profile_picture_url, enrolled_by_vet_email
      )
      VALUES (
        {{params.horseName}},
        {{params.age}}::int,
        {{params.breed}},
        {{params.weight}}::numeric,
        {{params.sex}},
        {{params.ownerName}},
        {{params.ownerContact}},
        {{params.enrollmentDate}}::date,
        {{params.trialStatus}},
        {{params.eligibilityVerified}}::boolean,
        {{params.consentDate}}::date,
        {{params.digitalPulse}},
        {{params.hoofWallTemperature}},
        {{params.coronaryBandCondition}},
        {{params.hoofTesterResponse}},
        {{params.stance}},
        {{params.gait}},
        {{params.enrollmentHeartRate}}::int,
        {{params.enrollmentRespiratoryRate}}::int,
        {{params.enrollmentTemperature}}::numeric,
        {{params.bodyConditionScore}}::numeric,
        {{params.profilePictureUrl}},
        {{params.enrolledByVetEmail}}
      )
      RETURNING *;
    `,
  });
}

export default createPatient;

