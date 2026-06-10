import { action } from '@uibakery/data';

function loadAdminComplianceDashboard() {
  return action('loadAdminComplianceDashboard', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      WITH patient_stats AS (
        SELECT
          COUNT(*) as total_patients,
          COUNT(*) FILTER (WHERE trial_status = 'enrolled') as enrolled_patients,
          COUNT(*) FILTER (WHERE trial_status = 'completed') as completed_patients,
          COUNT(*) FILTER (WHERE trial_status = 'withdrawn') as withdrawn_patients,
          COUNT(*) FILTER (WHERE screening_status = 'pending_screening') as pending_screening
        FROM patients
      ),
      ae_stats AS (
        SELECT
          COUNT(*) as total_aes,
          COUNT(*) FILTER (WHERE severity IN ('Severe', 'Life-Threatening', 'Fatal')) as serious_aes,
          COUNT(*) FILTER (WHERE severity = 'Fatal') as fatal_aes,
          COUNT(*) FILTER (WHERE admin_notified = false AND severity IN ('Severe', 'Life-Threatening', 'Fatal')) as unnotified_serious_aes
        FROM adverse_events
      ),
      vet_stats AS (
        SELECT
          COUNT(*) as total_vets,
          COUNT(*) FILTER (WHERE verification_status = 'approved') as approved_vets,
          COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_vets
        FROM veterinarians
      ),
      inv_qual_stats AS (
        SELECT
          COUNT(*) as total_qualifications,
          COUNT(*) FILTER (WHERE qualification_status = 'pending_review') as pending_review,
          COUNT(*) FILTER (WHERE qualification_status = 'approved') as approved_investigators,
          COUNT(*) FILTER (WHERE qualification_status = 'rejected') as rejected_investigators
        FROM investigator_qualifications
      ),
      deviation_stats AS (
        SELECT
          COUNT(*) as total_deviations,
          COUNT(*) FILTER (WHERE status = 'open') as open_deviations,
          COUNT(*) FILTER (WHERE impact_assessment = 'Critical') as critical_deviations
        FROM protocol_deviations
      ),
      dose_stats AS (
        SELECT
          COUNT(*) as total_doses,
          COUNT(DISTINCT patient_id) as patients_with_doses
        FROM treatments
      ),
      icf_stats AS (
        SELECT
          COUNT(*) as total_icfs,
          COUNT(*) FILTER (WHERE icf_status = 'signed') as signed_icfs,
          COUNT(*) FILTER (WHERE icf_status = 'pending') as pending_icfs
        FROM informed_consents
      )
      SELECT
        (SELECT total_patients FROM patient_stats),
        (SELECT enrolled_patients FROM patient_stats),
        (SELECT completed_patients FROM patient_stats),
        (SELECT withdrawn_patients FROM patient_stats),
        (SELECT pending_screening FROM patient_stats),
        (SELECT total_aes FROM ae_stats),
        (SELECT serious_aes FROM ae_stats),
        (SELECT fatal_aes FROM ae_stats),
        (SELECT unnotified_serious_aes FROM ae_stats),
        (SELECT total_vets FROM vet_stats),
        (SELECT approved_vets FROM vet_stats),
        (SELECT pending_vets FROM vet_stats),
        (SELECT total_qualifications FROM inv_qual_stats),
        (SELECT pending_review FROM inv_qual_stats),
        (SELECT approved_investigators FROM inv_qual_stats),
        (SELECT rejected_investigators FROM inv_qual_stats),
        (SELECT total_deviations FROM deviation_stats),
        (SELECT open_deviations FROM deviation_stats),
        (SELECT critical_deviations FROM deviation_stats),
        (SELECT total_doses FROM dose_stats),
        (SELECT patients_with_doses FROM dose_stats),
        (SELECT total_icfs FROM icf_stats),
        (SELECT signed_icfs FROM icf_stats),
        (SELECT pending_icfs FROM icf_stats);
    `,
  });
}

export default loadAdminComplianceDashboard;
