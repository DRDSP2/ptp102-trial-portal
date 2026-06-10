import { action } from '@uibakery/data';

function updatePatient() {
  return action('updatePatient', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE patients
      SET
        horse_name = {{params.horseName}},
        age = {{params.age}}::int,
        breed = {{params.breed}},
        weight = {{params.weight}}::numeric,
        sex = {{params.sex}},
        owner_name = {{params.ownerName}},
        owner_contact = {{params.ownerContact}},
        trial_status = {{params.trialStatus}},
        eligibility_verified = {{params.eligibilityVerified}}::boolean,
        consent_date = {{params.consentDate}}::date,
        digital_pulse = COALESCE({{params.digitalPulse}}, digital_pulse),
        hoof_wall_temperature = COALESCE({{params.hoofWallTemperature}}, hoof_wall_temperature),
        coronary_band_condition = COALESCE({{params.coronaryBandCondition}}, coronary_band_condition),
        hoof_tester_response = COALESCE({{params.hoofTesterResponse}}, hoof_tester_response),
        stance = COALESCE({{params.stance}}, stance),
        gait = COALESCE({{params.gait}}, gait),
        enrollment_heart_rate = COALESCE({{params.enrollmentHeartRate}}::int, enrollment_heart_rate),
        enrollment_respiratory_rate = COALESCE({{params.enrollmentRespiratoryRate}}::int, enrollment_respiratory_rate),
        enrollment_temperature = COALESCE({{params.enrollmentTemperature}}::numeric, enrollment_temperature),
        body_condition_score = COALESCE({{params.bodyConditionScore}}::numeric, body_condition_score),
        profile_picture_url = {{params.profilePictureUrl}},
        updated_at = NOW()
      WHERE id = {{params.patientId}}::int
      RETURNING *;
    `,
  });
}

export default updatePatient;
