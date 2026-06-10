import { action } from '@uibakery/data';

function addClinicalAssessment() {
  return action('addClinicalAssessment', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO clinical_assessments (
        patient_id, assessment_datetime, protocol_hour,
        obel_grade, pain_score, mobility_score, digital_pulse_score,
        hoof_temperature, heart_rate, respiratory_rate, temperature,
        clinical_notes, veterinarian_name
      )
      VALUES (
        {{params.patientId}}::int,
        {{params.assessmentDatetime}}::timestamptz,
        CASE WHEN {{params.protocolHour}} IS NULL THEN NULL ELSE {{params.protocolHour}}::int END,
        {{params.obelGrade}}::int,
        {{params.painScore}}::int,
        CASE WHEN {{params.mobilityScore}} IS NULL THEN NULL ELSE {{params.mobilityScore}}::int END,
        CASE WHEN {{params.digitalPulseScore}} IS NULL THEN NULL ELSE {{params.digitalPulseScore}}::int END,
        {{params.hoofTemperature}},
        CASE WHEN {{params.heartRate}} IS NULL THEN NULL ELSE {{params.heartRate}}::int END,
        CASE WHEN {{params.respiratoryRate}} IS NULL THEN NULL ELSE {{params.respiratoryRate}}::int END,
        CASE WHEN {{params.temperature}} IS NULL THEN NULL ELSE {{params.temperature}}::numeric END,
        {{params.clinicalNotes}},
        {{params.veterinarianName}}
      )
      RETURNING *;
    `,
  });
}

export default addClinicalAssessment;

