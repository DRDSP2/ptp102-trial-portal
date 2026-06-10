import { action } from '@uibakery/data';

function loadProtocolDeviations() {
  return action('loadProtocolDeviations', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT pd.*, p.horse_name, p.unique_id
      FROM protocol_deviations pd
      JOIN patients p ON pd.patient_id = p.id
      ORDER BY pd.created_at DESC;
    `,
  });
}

export default loadProtocolDeviations;
