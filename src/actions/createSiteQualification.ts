import { action } from '@uibakery/data';

function createSiteQualification() {
  return action('createSiteQualification', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO site_qualifications (
        site_name, site_address, iacuc_approval_number,
        principal_investigator_name, principal_investigator_email, principal_investigator_credentials,
        has_emergency_equipment, has_drug_storage_refrigeration, has_drug_storage_security,
        has_radiography, has_laboratory, has_24h_emergency_coverage,
        prior_trial_experience_count, prior_therapeutic_areas, gcp_training_records, site_status
      )
      VALUES (
        {{params.siteName}}, {{params.siteAddress}}, {{params.iacucApprovalNumber}},
        {{params.piName}}, {{params.piEmail}}, {{params.piCredentials}},
        {{params.hasEmergencyEquipment}}::boolean, {{params.hasDrugStorageRefrigeration}}::boolean,
        {{params.hasDrugStorageSecurity}}::boolean, {{params.hasRadiography}}::boolean,
        {{params.hasLaboratory}}::boolean, {{params.has24hEmergencyCoverage}}::boolean,
        {{params.priorTrialExperienceCount}}::int, {{params.priorTherapeuticAreas}},
        {{params.gcpTrainingRecords}}::jsonb, {{params.siteStatus}}
      )
      RETURNING *;
    `,
  });
}

export default createSiteQualification;
