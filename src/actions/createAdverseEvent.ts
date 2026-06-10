import { action } from '@uibakery/data';

function createAdverseEvent() {
  return action('createAdverseEvent', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO adverse_events (
        patient_id, veterinarian_id, reporter_name, reporter_email,
        event_description, severity, causality, start_date, is_ongoing,
        resolved_date, action_taken, outcome, vet_assessment,
        digital_signature, signed_at, serious, expected
      )
      VALUES (
        {{params.patientId}}::int, {{params.veterinarianId}}::int,
        {{params.reporterName}}, {{params.reporterEmail}},
        {{params.eventDescription}}, {{params.severity}}, {{params.causality}},
        {{params.startDate}}::timestamptz, {{params.isOngoing}}::boolean,
        {{params.resolvedDate}}::timestamptz, {{params.actionTaken}}, {{params.outcome}},
        {{params.vetAssessment}}, {{params.digitalSignature}}, NOW(),
        {{params.serious}}::boolean, {{params.expected}}::boolean
      )
      RETURNING *;
    `,
  });
}

export default createAdverseEvent;
