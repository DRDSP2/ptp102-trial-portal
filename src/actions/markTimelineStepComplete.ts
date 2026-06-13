import { action } from '@uibakery/data';

function markTimelineStepComplete() {
  return action('markTimelineStepComplete', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE patients
      SET completed_timeline_steps = array_append(
        COALESCE(completed_timeline_steps, ARRAY[]::text[]),
        {{params.stepId}}
      ),
      updated_at = NOW()
      WHERE id = {{params.patientId}}::int
      RETURNING *;
    `,
  });
}

export default markTimelineStepComplete;
