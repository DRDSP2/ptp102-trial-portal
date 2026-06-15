import { action } from '@uibakery/data';

function addClinicalNote() {
  return action('addClinicalNote', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO clinical_notes (
        patient_id, veterinarian_name, note_type, note_content, protocol_hour,
        video_url, video_file_name, video_uploaded_at,
        ocr_document_url, ocr_document_file_name, ocr_document_mime_type,
        ocr_extracted_text, ocr_processed_at
      )
      VALUES (
        {{params.patientId}}::int,
        {{params.veterinarianName}},
        {{params.noteType}},
        {{params.noteContent}},
        CASE WHEN {{params.protocolHour}} IS NULL THEN NULL ELSE {{params.protocolHour}}::int END,
        {{params.videoUrl}},
        {{params.videoFileName}},
        CASE WHEN {{params.videoUploadedAt}} IS NULL THEN NULL ELSE {{params.videoUploadedAt}}::timestamptz END,
        {{params.ocrDocumentUrl}},
        {{params.ocrDocumentFileName}},
        {{params.ocrDocumentMimeType}},
        {{params.ocrExtractedText}},
        CASE WHEN {{params.ocrProcessedAt}} IS NULL THEN NULL ELSE {{params.ocrProcessedAt}}::timestamptz END
      )
      RETURNING *;
    `,
  });
}

export default addClinicalNote;
