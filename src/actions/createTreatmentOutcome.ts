import { action } from '@uibakery/data';

function createTreatmentOutcome() {
  return action('createTreatmentOutcome', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO treatment_outcomes (
        patient_id, assessment_day, assessment_date, protocol_hour,
        obel_grade, digital_pulse_score, hoof_temperature, pain_score,
        mobility_score, heart_rate, respiratory_rate, temperature,
        body_weight, appetite_score, radiograph_url, radiograph_findings,
        keenan_angle, gait_video_url, veterinarian_name, signed_at
      )
      VALUES (
        {{params.patientId}}::int, {{params.assessmentDay}}::int,
        {{params.assessmentDate}}::date, {{params.protocolHour}}::int,
        {{params.obelGrade}}::int, {{params.digitalPulseScore}}::int,
        {{params.hoofTemperature}}, {{params.painScore}}::int,
        {{params.mobilityScore}}::int, {{params.heartRate}}::int,
        {{params.respiratoryRate}}::int, {{params.temperature}}::numeric,
        {{params.bodyWeight}}::numeric, {{params.appetiteScore}}::int,
        {{params.radiographUrl}}, {{params.radiographFindings}},
        {{params.keenanAngle}}::numeric, {{params.gaitVideoUrl}},
        {{params.veterinarianName}}, NOW()
      )
      RETURNING *;
    `,
  });
}

export default createTreatmentOutcome;
