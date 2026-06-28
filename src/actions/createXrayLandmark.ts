import { action } from '@uibakery/data';

function createXrayLandmark() {
  return action('createXrayLandmark', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO xray_landmarks (xray_id, name, x, y)
      VALUES ({{params.xrayId}}::int, {{params.name}}, {{params.x}}::numeric, {{params.y}}::numeric)
      RETURNING *;
    `,
  });
}

export default createXrayLandmark;
