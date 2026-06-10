import { action } from '@uibakery/data';

function createProtocolVersion() {
  return action('createProtocolVersion', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE protocol_versions SET is_current = false WHERE is_current = true;

      INSERT INTO protocol_versions (
        version_number, effective_date, description, pdf_url,
        uploaded_by, is_current, previous_version, change_summary
      )
      VALUES (
        {{params.versionNumber}}, {{params.effectiveDate}}::date,
        {{params.description}}, {{params.pdfUrl}},
        {{params.uploadedBy}}, true, {{params.previousVersion}}, {{params.changeSummary}}
      )
      RETURNING *;
    `,
  });
}

export default createProtocolVersion;
