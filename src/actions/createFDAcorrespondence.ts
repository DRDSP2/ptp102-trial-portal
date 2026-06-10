import { action } from '@uibakery/data';

function createFDAcorrespondence() {
  return action('createFDAcorrespondence', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO fda_correspondence (
        correspondence_type, correspondence_date, subject, description,
        from_entity, to_entity, related_protocol_version, document_url, uploaded_by
      )
      VALUES (
        {{params.correspondenceType}}, {{params.correspondenceDate}}::date,
        {{params.subject}}, {{params.description}}, {{params.fromEntity}},
        {{params.toEntity}}, {{params.relatedProtocolVersion}},
        {{params.documentUrl}}, {{params.uploadedBy}}
      )
      RETURNING *;
    `,
  });
}

export default createFDAcorrespondence;
