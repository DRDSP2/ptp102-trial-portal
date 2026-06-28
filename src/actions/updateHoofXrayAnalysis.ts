import { action } from '@uibakery/data';

function updateHoofXrayAnalysis() {
  return action('updateHoofXrayAnalysis', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE hoof_xrays
      SET
        analysis_status = {{params.analysisStatus}},
        overall_severity = {{params.overallSeverity}},
        score = {{params.score}}::numeric,
        updated_at = NOW()
      WHERE id = {{params.xrayId}}::int
      RETURNING *;
    `,
  });
}

export default updateHoofXrayAnalysis;
