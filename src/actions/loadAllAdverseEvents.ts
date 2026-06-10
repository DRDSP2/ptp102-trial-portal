import { action } from '@uibakery/data';

function loadAllAdverseEvents() {
  return action('loadAllAdverseEvents', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT ae.*, p.horse_name, p.unique_id, v.full_name as veterinarian_name
      FROM adverse_events ae
      JOIN patients p ON ae.patient_id = p.id
      LEFT JOIN veterinarians v ON ae.veterinarian_id = v.id
      ORDER BY ae.created_at DESC;
    `,
  });
}

export default loadAllAdverseEvents;
