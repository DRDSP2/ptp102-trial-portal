import { action } from '@uibakery/data';

function loadAdverseEvents() {
  return action('loadAdverseEvents', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT ae.*, p.horse_name, p.unique_id
      FROM adverse_events ae
      JOIN patients p ON ae.patient_id = p.id
      WHERE
        COALESCE({{params.patientId}}, '') = '' OR ae.patient_id = {{params.patientId}}::int
      ORDER BY ae.created_at DESC;
    `,
  });
}

export default loadAdverseEvents;
