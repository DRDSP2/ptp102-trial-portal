import { action } from '@uibakery/data';

function recordSecureUpload() {
  return action('recordSecureUpload', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO file_records (
        owner_id,
        entity_type,
        entity_id,
        category,
        storage_path,
        file_name,
        file_size,
        mime_type,
        created_at
      ) VALUES (
        {{params.ownerId}},
        {{params.entityType}},
        {{params.entityId}},
        {{params.category}},
        {{params.storagePath}},
        {{params.fileName}},
        {{params.fileSize}},
        {{params.mimeType}},
        NOW()
      )
      RETURNING *;
    `,
  });
}

export default recordSecureUpload;
