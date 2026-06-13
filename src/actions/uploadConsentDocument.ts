import { action } from '@uibakery/data';

function uploadConsentDocument() {
  return action('uploadConsentDocument', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO consent_documents (
        consent_id, patient_id, case_id, study_id, protocol_version,
        document_type, file_url, file_name, file_size, uploaded_by, version, previous_version_id
      )
      VALUES (
        {{params.consentId}}::int,
        {{params.patientId}}::int,
        {{params.caseId}},
        {{params.studyId}},
        {{params.protocolVersion}},
        {{params.documentType}},
        {{params.fileUrl}},
        {{params.fileName}},
        {{params.fileSize}}::int,
        {{params.uploadedBy}},
        {{params.version}}::int,
        {{params.previousVersionId}}::int
      )
      RETURNING *;
    `,
  });
}

export default uploadConsentDocument;
