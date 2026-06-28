import { action } from '@uibakery/data';

function createHoofXray() {
  return action('createHoofXray', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO hoof_xrays (
        patient_id, hoof_side, file_path, original_file_name,
        image_url, taken_date, pixel_spacing_x, pixel_spacing_y,
        created_by_user_id, created_by_email
      )
      VALUES (
        {{params.patientId}}::int, {{params.hoofSide}}, {{params.filePath}},
        {{params.originalFileName}}, {{params.imageUrl}},
        COALESCE({{params.takenDate}}::date, CURRENT_DATE),
        {{params.pixelSpacingX}}::numeric, {{params.pixelSpacingY}}::numeric,
        {{params.userId}}, {{params.userEmail}}
      )
      RETURNING *;
    `,
  });
}

export default createHoofXray;
