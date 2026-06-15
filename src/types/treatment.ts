export type Treatment = {
  id: number;
  patient_id: number;
  administration_datetime: string;
  dosage_mg: number;
  route: string;
  veterinarian_name: string;
  batch_number: string | null;
  immediate_reactions: string | null;
  notes: string | null;
  protocol_hour: number | null;
  created_at: string;
  updated_at: string;
};

export type ClinicalNote = {
  id: number;
  patient_id: number;
  veterinarian_name: string;
  note_type: string;
  note_content: string;
  protocol_hour: number | null;
  video_url?: string | null;
  video_file_name?: string | null;
  video_uploaded_at?: string | null;
  ocr_document_url?: string | null;
  ocr_document_file_name?: string | null;
  ocr_document_mime_type?: string | null;
  ocr_extracted_text?: string | null;
  ocr_processed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type LabResult = {
  id: number;
  patient_id: number;
  test_datetime: string;
  protocol_hour: number | null;
  wbc: number | null;
  rbc: number | null;
  hemoglobin: number | null;
  hematocrit: number | null;
  platelets: number | null;
  glucose: number | null;
  creatinine: number | null;
  bun: number | null;
  alt: number | null;
  ast: number | null;
  alkaline_phosphatase: number | null;
  total_protein: number | null;
  albumin: number | null;
  serum_amyloid_a: number | null;
  fibrinogen: number | null;
  lactate: number | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicalAssessment = {
  id: number;
  patient_id: number;
  assessment_datetime: string;
  protocol_hour: number | null;
  obel_grade: number | null;
  pain_score: number | null;
  mobility_score: number | null;
  digital_pulse_score: number | null;
  hoof_temperature: string | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  clinical_notes: string | null;
  veterinarian_name: string;
  created_at: string;
  updated_at: string;
};
