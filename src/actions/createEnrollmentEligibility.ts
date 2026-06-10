import { action } from '@uibakery/data';

function createEnrollmentEligibility() {
  return action('createEnrollmentEligibility', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO enrollment_eligibility (
        patient_id, inclusion_diagnosed_acute_laminitis, inclusion_obel_grade_1_to_3,
        inclusion_age_2_to_20, inclusion_weight_over_200kg, inclusion_owner_consent,
        inclusion_no_prior_investigational_drug_30d, exclusion_chronic_laminitis_over_14d,
        exclusion_pregnant_or_lactating, exclusion_concurrent_systemic_disease,
        exclusion_prior_investigational_drug_30d, exclusion_owner_declined_consent,
        eligibility_determination, ineligible_reason, deviation_justification,
        screened_by, screened_at
      )
      VALUES (
        {{params.patientId}}::int, {{params.inclusionDiagnosedAcuteLaminitis}}::boolean,
        {{params.inclusionObelGrade1To3}}::boolean, {{params.inclusionAge2To20}}::boolean,
        {{params.inclusionWeightOver200kg}}::boolean, {{params.inclusionOwnerConsent}}::boolean,
        {{params.inclusionNoPriorInvestigationalDrug30d}}::boolean,
        {{params.exclusionChronicLaminitisOver14d}}::boolean,
        {{params.exclusionPregnantOrLactating}}::boolean,
        {{params.exclusionConcurrentSystemicDisease}}::boolean,
        {{params.exclusionPriorInvestigationalDrug30d}}::boolean,
        {{params.exclusionOwnerDeclinedConsent}}::boolean,
        {{params.eligibilityDetermination}}, {{params.ineligibleReason}},
        {{params.deviationJustification}}, {{params.screenedBy}}, NOW()
      )
      ON CONFLICT (patient_id) DO UPDATE SET
        inclusion_diagnosed_acute_laminitis = EXCLUDED.inclusion_diagnosed_acute_laminitis,
        inclusion_obel_grade_1_to_3 = EXCLUDED.inclusion_obel_grade_1_to_3,
        inclusion_age_2_to_20 = EXCLUDED.inclusion_age_2_to_20,
        inclusion_weight_over_200kg = EXCLUDED.inclusion_weight_over_200kg,
        inclusion_owner_consent = EXCLUDED.inclusion_owner_consent,
        inclusion_no_prior_investigational_drug_30d = EXCLUDED.inclusion_no_prior_investigational_drug_30d,
        exclusion_chronic_laminitis_over_14d = EXCLUDED.exclusion_chronic_laminitis_over_14d,
        exclusion_pregnant_or_lactating = EXCLUDED.exclusion_pregnant_or_lactating,
        exclusion_concurrent_systemic_disease = EXCLUDED.exclusion_concurrent_systemic_disease,
        exclusion_prior_investigational_drug_30d = EXCLUDED.exclusion_prior_investigational_drug_30d,
        exclusion_owner_declined_consent = EXCLUDED.exclusion_owner_declined_consent,
        eligibility_determination = EXCLUDED.eligibility_determination,
        ineligible_reason = EXCLUDED.ineligible_reason,
        deviation_justification = EXCLUDED.deviation_justification,
        screened_by = EXCLUDED.screened_by,
        screened_at = NOW(),
        updated_at = NOW()
      RETURNING *;
    `,
  });
}

export default createEnrollmentEligibility;
