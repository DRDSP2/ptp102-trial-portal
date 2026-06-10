import { action } from '@uibakery/data';

function loadAllTrialsData() {
  return action('loadAllTrialsData', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        p.id,
        p.unique_id,
        p.horse_name,
        p.age,
        p.breed,
        p.weight,
        p.trial_status,
        p.enrollment_date,
        p.laminitis_grade,
        p.affected_limbs,
        p.is_flagged,
        p.flag_reason,
        v.full_name as veterinarian_name,
        v.email as veterinarian_email,
        v.hospital_affiliation,
        v.license_number,
        (SELECT COUNT(*) FROM treatments t WHERE t.patient_id = p.id) as treatment_count,
        (SELECT COUNT(*) FROM clinical_assessments ca WHERE ca.patient_id = p.id) as assessment_count
      FROM patients p
      LEFT JOIN veterinarians v ON v.email = {{params.vetEmail}}
      WHERE 
        ({{params.vetEmail}} IS NULL OR v.email = {{params.vetEmail}})
        AND ({{params.isFlagged}} IS NULL OR p.is_flagged = {{params.isFlagged}}::boolean)
      ORDER BY p.enrollment_date DESC;
    `,
  });
}

export default loadAllTrialsData;
