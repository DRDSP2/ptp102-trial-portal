import { action } from '@uibakery/data';

function createMonitoringVisit() {
  return action('createMonitoringVisit', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO monitoring_visits (
        site_id, visit_type, visit_date, monitor_name, monitor_email,
        findings, deviations_found, corrective_actions, capa_items, next_visit_due, report_url, completed
      )
      VALUES (
        {{params.siteId}}::int, {{params.visitType}}, {{params.visitDate}}::date,
        {{params.monitorName}}, {{params.monitorEmail}}, {{params.findings}},
        {{params.deviationsFound}}::int, {{params.correctiveActions}},
        {{params.capaItems}}::jsonb, {{params.nextVisitDue}}::date,
        {{params.reportUrl}}, {{params.completed}}::boolean
      )
      RETURNING *;
    `,
  });
}

export default createMonitoringVisit;
