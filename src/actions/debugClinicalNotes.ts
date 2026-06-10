import { action } from '@uibakery/data';

function debugClinicalNotes() {
  return action('debugClinicalNotes', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        id,
        patient_id,
        note_type,
        note_content,
        LENGTH(video_url) as video_url_length,
        SUBSTRING(video_url, 1, 100) as video_url_sample,
        video_file_name,
        video_uploaded_at,
        created_at
      FROM clinical_notes
      WHERE patient_id = {{params.patientId}}::int
      ORDER BY created_at DESC
      LIMIT 10;
    `,
  });
}

export default debugClinicalNotes;
