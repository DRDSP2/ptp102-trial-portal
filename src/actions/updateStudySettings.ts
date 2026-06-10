import { action } from '@uibakery/data';

function updateStudySettings() {
  return action('updateStudySettings', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE study_settings
      SET
        inad_file_number = COALESCE({{params.inadFileNumber}}, inad_file_number),
        protocol_version = COALESCE({{params.protocolVersion}}, protocol_version),
        protocol_effective_date = COALESCE({{params.protocolEffectiveDate}}::date, protocol_effective_date),
        last_fda_correspondence_date = COALESCE({{params.lastFdaCorrespondenceDate}}::date, last_fda_correspondence_date),
        study_title = COALESCE({{params.studyTitle}}, study_title),
        sponsor_name = COALESCE({{params.sponsorName}}, sponsor_name),
        sponsor_contact = COALESCE({{params.sponsorContact}}, sponsor_contact),
        updated_at = NOW()
      WHERE id = {{params.id}}::int
      RETURNING *;
    `,
  });
}

export default updateStudySettings;
