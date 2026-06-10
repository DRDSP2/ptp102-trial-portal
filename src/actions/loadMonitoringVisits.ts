import { action } from '@uibakery/data';

function loadMonitoringVisits() {
  return action('loadMonitoringVisits', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT mv.*, sq.site_name
      FROM monitoring_visits mv
      JOIN site_qualifications sq ON mv.site_id = sq.id
      ORDER BY mv.visit_date DESC;
    `,
  });
}

export default loadMonitoringVisits;
