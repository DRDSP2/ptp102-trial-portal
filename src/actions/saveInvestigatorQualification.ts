import { action } from '@uibakery/data';

function saveInvestigatorQualification() {
  return action('saveInvestigatorQualification', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO investigator_qualifications (
        veterinarian_id, license_number, license_state, years_experience,
        laminitis_case_volume_per_year, prior_clinical_trial_experience, prior_trials_count,
        cv_upload_url, gcp_training_completed, gcp_certificate_url, gcp_completion_date,
        gcp_expiry_date, gcp_quiz_score, facility_inspection_completed, facility_inspection_date,
        drug_storage_photo_url, emergency_equipment_photo_url, records_area_photo_url,
        facility_checklist, investigator_agreement_signed, investigator_agreement_signed_at,
        investigator_agreement_signature, protocol_signed, protocol_signed_at, protocol_signed_version,
        protocol_signature, qualification_status, updated_at
      )
      VALUES (
        {{params.veterinarianId}}::int, {{params.licenseNumber}}, {{params.licenseState}},
        {{params.yearsExperience}}::int, {{params.laminitisCaseVolume}}::int,
        {{params.priorTrialExperience}}::boolean, {{params.priorTrialsCount}}::int,
        {{params.cvUploadUrl}}, {{params.gcpTrainingCompleted}}::boolean,
        {{params.gcpCertificateUrl}}, {{params.gcpCompletionDate}}::date,
        {{params.gcpExpiryDate}}::date, {{params.gcpQuizScore}}::numeric,
        {{params.facilityInspectionCompleted}}::boolean, {{params.facilityInspectionDate}}::date,
        {{params.drugStoragePhotoUrl}}, {{params.emergencyEquipmentPhotoUrl}},
        {{params.recordsAreaPhotoUrl}}, {{params.facilityChecklist}}::jsonb,
        {{params.investigatorAgreementSigned}}::boolean, {{params.investigatorAgreementSignedAt}}::timestamptz,
        {{params.investigatorAgreementSignature}}, {{params.protocolSigned}}::boolean,
        {{params.protocolSignedAt}}::timestamptz, {{params.protocolSignedVersion}},
        {{params.protocolSignature}}, {{params.qualificationStatus}}, NOW()
      )
      ON CONFLICT (veterinarian_id) DO UPDATE SET
        license_number = EXCLUDED.license_number,
        license_state = EXCLUDED.license_state,
        years_experience = EXCLUDED.years_experience,
        laminitis_case_volume_per_year = EXCLUDED.laminitis_case_volume_per_year,
        prior_clinical_trial_experience = EXCLUDED.prior_clinical_trial_experience,
        prior_trials_count = EXCLUDED.prior_trials_count,
        cv_upload_url = EXCLUDED.cv_upload_url,
        gcp_training_completed = EXCLUDED.gcp_training_completed,
        gcp_certificate_url = EXCLUDED.gcp_certificate_url,
        gcp_completion_date = EXCLUDED.gcp_completion_date,
        gcp_expiry_date = EXCLUDED.gcp_expiry_date,
        gcp_quiz_score = EXCLUDED.gcp_quiz_score,
        facility_inspection_completed = EXCLUDED.facility_inspection_completed,
        facility_inspection_date = EXCLUDED.facility_inspection_date,
        drug_storage_photo_url = EXCLUDED.drug_storage_photo_url,
        emergency_equipment_photo_url = EXCLUDED.emergency_equipment_photo_url,
        records_area_photo_url = EXCLUDED.records_area_photo_url,
        facility_checklist = EXCLUDED.facility_checklist,
        investigator_agreement_signed = EXCLUDED.investigator_agreement_signed,
        investigator_agreement_signed_at = EXCLUDED.investigator_agreement_signed_at,
        investigator_agreement_signature = EXCLUDED.investigator_agreement_signature,
        protocol_signed = EXCLUDED.protocol_signed,
        protocol_signed_at = EXCLUDED.protocol_signed_at,
        protocol_signed_version = EXCLUDED.protocol_signed_version,
        protocol_signature = EXCLUDED.protocol_signature,
        qualification_status = EXCLUDED.qualification_status,
        updated_at = NOW()
      RETURNING *;
    `,
  });
}

export default saveInvestigatorQualification;
