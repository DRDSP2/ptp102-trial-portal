import { action } from '@uibakery/data';

function loadHoofXrays() {
  return action('loadHoofXrays', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        hx.id,
        hx.patient_id,
        hx.hoof_side,
        hx.file_path,
        hx.original_file_name,
        hx.image_url,
        hx.taken_date,
        hx.pixel_spacing_x,
        hx.pixel_spacing_y,
        hx.analysis_status,
        hx.overall_severity,
        hx.score,
        hx.created_at,
        p.horse_name,
        p.enrolled_by_vet_email
      FROM hoof_xrays hx
      LEFT JOIN patients p ON hx.patient_id = p.id
      WHERE
        ({{params.patientId}}::int IS NULL OR hx.patient_id = {{params.patientId}}::int)
        AND (
          {{params.isAdmin}}::boolean = true
          OR p.enrolled_by_vet_email = {{params.userEmail}}
        )
      ORDER BY hx.taken_date DESC, hx.created_at DESC;
    `,
  });
}

export default loadHoofXrays;
