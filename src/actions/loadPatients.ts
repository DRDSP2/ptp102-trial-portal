import { action } from '@uibakery/data';

function loadPatients() {
  return action('loadPatients', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        *,
        screening_status,
        screening_notes,
        screened_by,
        screened_at,
        enrolled_by_vet_email
      FROM patients
      WHERE
        COALESCE({{params.status}}, '') = ''
        OR trial_status = {{params.status}}
      ORDER BY 
        CASE 
          WHEN screening_status = 'pending_screening' THEN 0
          ELSE 1
        END,
        enrollment_date DESC;
    `,
  });
}

export default loadPatients;
