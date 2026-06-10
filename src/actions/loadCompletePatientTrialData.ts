import { action } from '@uibakery/data';

function loadCompletePatientTrialData() {
  return action('loadCompletePatientTrialData', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        p.*,
        (
          SELECT json_agg(
            json_build_object(
              'id', t.id,
              'administration_datetime', t.administration_datetime,
              'dosage_mg', t.dosage_mg,
              'total_volume_ml', t.total_volume_ml,
              'route', t.route,
              'protocol_hour', t.protocol_hour,
              'veterinarian_name', t.veterinarian_name,
              'batch_number', t.batch_number,
              'immediate_reactions', t.immediate_reactions,
              'notes', t.notes,
              'created_at', t.created_at
            ) ORDER BY t.administration_datetime
          )
          FROM treatments t
          WHERE t.patient_id = p.id
        ) as treatments,
        (
          SELECT json_agg(
            json_build_object(
              'id', ca.id,
              'assessment_datetime', ca.assessment_datetime,
              'obel_grade', ca.obel_grade,
              'pain_score', ca.pain_score,
              'mobility_score', ca.mobility_score,
              'digital_pulse_score', ca.digital_pulse_score,
              'hoof_temperature', ca.hoof_temperature,
              'heart_rate', ca.heart_rate,
              'respiratory_rate', ca.respiratory_rate,
              'temperature', ca.temperature,
              'clinical_notes', ca.clinical_notes,
              'veterinarian_name', ca.veterinarian_name,
              'protocol_hour', ca.protocol_hour,
              'created_at', ca.created_at
            ) ORDER BY ca.assessment_datetime
          )
          FROM clinical_assessments ca
          WHERE ca.patient_id = p.id
        ) as assessments,
        (
          SELECT json_agg(
            json_build_object(
              'id', lr.id,
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
              'alkaline_phosphatase', lr.alkaline_phosphatase,
              'total_protein', lr.total_protein,
              'albumin', lr.albumin,
              'serum_amyloid_a', lr.serum_amyloid_a,
              'fibrinogen', lr.fibrinogen,
              'lactate', lr.lactate,
              'additional_notes', lr.additional_notes,
              'created_at', lr.created_at
            ) ORDER BY lr.test_datetime
          )
          FROM lab_results lr
          WHERE lr.patient_id = p.id
        ) as lab_results,
        (
          SELECT json_agg(
            json_build_object(
              'id', cn.id,
              'note_content', cn.note_content,
              'note_type', cn.note_type,
              'protocol_hour', cn.protocol_hour,
              'video_url', cn.video_url,
              'video_file_name', cn.video_file_name,
              'veterinarian_name', cn.veterinarian_name,
              'created_at', cn.created_at
            ) ORDER BY cn.created_at
          )
          FROM clinical_notes cn
          WHERE cn.patient_id = p.id
        ) as clinical_notes
      FROM patients p
      WHERE p.id = {{params.patientId}}::int;
    `,
  });
}

export default loadCompletePatientTrialData;
