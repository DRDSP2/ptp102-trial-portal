import { action } from '@uibakery/data';

function loadAdminStatistics() {
  return action('loadAdminStatistics', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      WITH vet_stats AS (
        SELECT 
          COUNT(*) as total_vets,
          COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_approvals,
          COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7 days') as active_vets_week
        FROM veterinarians
      ),
      trial_stats AS (
        SELECT 
          COUNT(*) as trials_this_month
        FROM patients
        WHERE enrollment_date >= DATE_TRUNC('month', CURRENT_DATE)
      )
      SELECT 
        v.total_vets,
        v.pending_approvals,
        v.active_vets_week,
        t.trials_this_month
      FROM vet_stats v, trial_stats t;
    `,
  });
}

export default loadAdminStatistics;
