import { action } from '@uibakery/data';

function loadRegulatoryTrialsData() {
  return action('loadRegulatoryTrialsData', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        p.id,
        p.unique_id,
        p.horse_name,
        p.age,
        p.breed,
        p.sex,
        p.weight,
        p.trial_status,
        p.enrollment_date,
        p.consent_date,
        p.laminitis_grade,
        p.affected_limbs,
        p.digital_pulse,
        p.hoof_wall_temperature,
        p.coronary_band_condition,
        p.enrollment_heart_rate,
        p.enrollment_respiratory_rate,
        p.enrollment_temperature,
        p.protocol_start_time,
        p.eligibility_verified,
        p.screening_status,
        p.owner_name,
        p.owner_contact,
        v.full_name as veterinarian_name,
        v.email as veterinarian_email,
        v.hospital_affiliation,
        v.license_number,
        (
          SELECT json_agg(
            json_build_object(
              'administration_datetime', t.administration_datetime,
              'dosage_mg', t.dosage_mg,
              'total_volume_ml', t.total_volume_ml,
              'route', t.route,
              'protocol_hour', t.protocol_hour,
              'veterinarian_name', t.veterinarian_name
            ) ORDER BY t.administration_datetime
          )
          FROM treatments t
          WHERE t.patient_id = p.id
        ) as treatments,
        (
          SELECT json_agg(
            json_build_object(
              'assessment_datetime', ca.assessment_datetime,
              'obel_grade', ca.obel_grade,
              'pain_score', ca.pain_score,
              'mobility_score', ca.mobility_score,
              'digital_pulse_score', ca.digital_pulse_score,
              'hoof_temperature', ca.hoof_temperature,
              'heart_rate', ca.heart_rate,
              'respiratory_rate', ca.respiratory_rate,
              'temperature', ca.temperature,
              'protocol_hour', ca.protocol_hour,
              'clinical_notes', ca.clinical_notes
            ) ORDER BY ca.assessment_datetime
          )
          FROM clinical_assessments ca
          WHERE ca.patient_id = p.id
        ) as assessments,
        (
          SELECT json_agg(
            json_build_object(
              'test_datetime', lr.test_datetime,
              'protocol_hour', lr.protocol_hour,
              'wbc', lr.wbc,
              'rbc', lr.rbc,
              'hemoglobin', lr.hemoglobin,
              'hematocrit', lr.hematocrit,
              'platelets', lr.platelets,
              'glucose', lr.glucose,
              'creatinine', lr.creatinine,
              'bun', lr.bun,
              'alt', lr.alt,
              'ast', lr.ast,
              'serum_amyloid_a', lr.serum_amyloid_a,
              'fibrinogen', lr.fibrinogen,
              'lactate', lr.lactate
            ) ORDER BY lr.test_datetime
          )
          FROM lab_results lr
          WHERE lr.patient_id = p.id
        ) as lab_results
      FROM patients p
      LEFT JOIN veterinarians v ON p.veterinarian_id = v.id
      WHERE 
        ({{params.vetEmail}} IS NULL OR v.email = {{params.vetEmail}})
        AND ({{params.isFlagged}} IS NULL OR p.is_flagged = {{params.isFlagged}}::boolean)
        AND ({{params.startDate}} IS NULL OR p.enrollment_date >= {{params.startDate}}::date)
        AND ({{params.endDate}} IS NULL OR p.enrollment_date <= {{params.endDate}}::date)
      ORDER BY p.enrollment_date DESC;
    `,
  });
}

export default loadRegulatoryTrialsData;
