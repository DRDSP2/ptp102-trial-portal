import { action } from '@uibakery/data';

function createXrayMeasurement() {
  return action('createXrayMeasurement', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO xray_measurements (
        xray_id, metric, value, unit, severity, deviation_z
      )
      VALUES (
        {{params.xrayId}}::int, {{params.metric}}, {{params.value}}::numeric,
        {{params.unit}}, {{params.severity}}, {{params.deviationZ}}::numeric
      )
      RETURNING *;
    `,
  });
}

export default createXrayMeasurement;
