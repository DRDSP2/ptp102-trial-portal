import { action } from '@uibakery/data';

function loadPatientCaseData() {
  return action('loadPatientCaseData', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT 
        p.*,
        p.screening_status,
        p.screening_notes,
        p.screened_by,
        p.screened_at,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', t.id,
              'administration_datetime', t.administration_datetime,
              'dosage_mg', t.dosage_mg,
              'route', t.route,
              'protocol_hour', t.protocol_hour,
              'veterinarian_name', t.veterinarian_name,
              'total_volume_ml', t.total_volume_ml
            ) ORDER BY t.administration_datetime
          ), '[]')
          FROM treatments t
          WHERE t.patient_id = p.id
        ) as treatments,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', cn.id,
              'note_content', cn.note_content,
              'note_type', cn.note_type,
              'protocol_hour', cn.protocol_hour,
              'video_url', cn.video_url,
              'video_file_name', cn.video_file_name,
              'ocr_document_url', cn.ocr_document_url,
              'ocr_document_file_name', cn.ocr_document_file_name,
              'ocr_document_mime_type', cn.ocr_document_mime_type,
              'ocr_extracted_text', cn.ocr_extracted_text,
              'ocr_processed_at', cn.ocr_processed_at,
              'veterinarian_name', cn.veterinarian_name,
              'created_at', cn.created_at
            ) ORDER BY cn.created_at DESC
          ), '[]')
          FROM clinical_notes cn
          WHERE cn.patient_id = p.id
        ) as clinical_notes,
        (
          SELECT COALESCE(json_agg(
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
              'protocol_hour', ca.protocol_hour
            ) ORDER BY ca.assessment_datetime ASC
          ), '[]')
          FROM clinical_assessments ca
          WHERE ca.patient_id = p.id
        ) as assessments,
        (
          SELECT COALESCE(json_agg(
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
              'additional_notes', lr.additional_notes
            ) ORDER BY lr.test_datetime DESC
          ), '[]')
          FROM lab_results lr
          WHERE lr.patient_id = p.id
        ) as lab_results
      FROM patients p
      WHERE p.id = {{params.patientId}}::int;
    `,
  });
}

export default loadPatientCaseData;
