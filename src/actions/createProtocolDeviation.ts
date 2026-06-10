import { action } from '@uibakery/data';

function createProtocolDeviation() {
  return action('createProtocolDeviation', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO protocol_deviations (
        patient_id, veterinarian_id, deviation_type, deviation_date,
        description, explanation, impact_assessment, corrective_action, preventive_action
      )
      VALUES (
        {{params.patientId}}::int, {{params.veterinarianId}}::int,
        {{params.deviationType}}, {{params.deviationDate}}::date,
        {{params.description}}, {{params.explanation}}, {{params.impactAssessment}},
        {{params.correctiveAction}}, {{params.preventiveAction}}
      )
      RETURNING *;
    `,
  });
}

export default createProtocolDeviation;
