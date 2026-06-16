/**
 * Deterministic XML export builders for the PTP-102 trial.
 */

import { type AuditLogEntry, STUDY_TITLE } from '@/lib/auditTypes';

export type StudyMetadata = {
  studyId: string;
  studyTitle: string;
  sponsorName: string;
  protocolVersion: string;
  exportedAt: string;
  exportedBy: string;
};

export type XmlExportPatient = {
  id: number;
  unique_id: string;
  horse_name: string;
  age: number;
  breed: string;
  sex: string;
  weight: number;
  owner_name: string;
  enrollment_date: string | null;
  consent_date: string | null;
  trial_status: string;
  screening_status: string | null;
  eligibility_verified: boolean;
  veterinarian_name?: string | null;
  veterinarian_email?: string | null;
  laminitis_grade?: number | null;
  treatment_count?: number;
  assessment_count?: number;
  lab_count?: number;
  note_count?: number;
  treatments?: any[];
  assessments?: any[];
  lab_results?: any[];
  clinical_notes?: any[];
};

export type ProtocolDeviation = {
  id: number;
  patient_id: number;
  deviation_type: string;
  deviation_date: string;
  description: string | null;
  explanation: string | null;
  impact_assessment: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  created_at?: string;
};

export type VariableMeta = {
  name: string; // max 32 chars
  label: string;
  type: 'char' | 'num' | 'date';
  length?: number;
  unit?: string;
  source?: string;
  codeList?: { value: string; label: string }[];
};

export type DatasetMeta = {
  name: string;
  label: string;
  variables: VariableMeta[];
};

function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toSnakeCase(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

export function sanitizeXmlTag(name: string): string {
  let sanitized = toSnakeCase(name)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  return sanitized;
}

function inferFieldType(value: unknown): string {
  if (typeof value === 'number') return 'num';
  if (typeof value === 'boolean') return 'char';
  if (value === null || value === undefined) return 'char';
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(str)) return 'date';
  return 'char';
}

function xmlTag(name: string, value: unknown, attrs: Record<string, string> = {}): string {
  const tag = sanitizeXmlTag(name);
  const attrString = Object.entries(attrs)
    .map(([k, v]) => `${sanitizeXmlTag(k)}="${escapeXml(v)}"`)
    .join(' ');
  const open = attrString ? `<${tag} ${attrString}>` : `<${tag}>`;
  return `${open}${escapeXml(value)}</${tag}>`;
}

function buildStudyHeader(meta: StudyMetadata): string {
  return [
    xmlTag('study_id', meta.studyId),
    xmlTag('study_title', meta.studyTitle),
    xmlTag('sponsor_name', meta.sponsorName),
    xmlTag('protocol_version', meta.protocolVersion),
    xmlTag('exported_at', meta.exportedAt),
    xmlTag('exported_by', meta.exportedBy),
  ].join('\n      ');
}

function serializeFlatDataset(name: string, records: Record<string, unknown>[]): string {
  const datasetName = sanitizeXmlTag(name);
  if (records.length === 0) {
    return `  <dataset name="${datasetName}" records="0" />`;
  }

  const recordNodes = records
    .map((record) => {
      const fieldNodes = Object.entries(record)
        .map(([key, value]) => {
          const fieldName = sanitizeXmlTag(key);
          const fieldType = inferFieldType(value);
          return `      <field name="${escapeXml(fieldName)}" type="${fieldType}">${escapeXml(value)}</field>`;
        })
        .join('\n');
      return `    <record>\n${fieldNodes}\n    </record>`;
    })
    .join('\n');

  return `  <dataset name="${datasetName}" records="${records.length}">\n${recordNodes}\n  </dataset>`;
}

function buildSubjectRecord(p: XmlExportPatient): Record<string, unknown> {
  return {
    subject_id: p.unique_id,
    horse_name: p.horse_name,
    age_years: p.age,
    breed: p.breed,
    sex: p.sex,
    weight_kg: p.weight,
    owner_name: p.owner_name,
    enrollment_date: p.enrollment_date,
    consent_date: p.consent_date,
    trial_status: p.trial_status,
    screening_status: p.screening_status,
    eligibility_verified: p.eligibility_verified,
    veterinarian_name: p.veterinarian_name,
    veterinarian_email: p.veterinarian_email,
    latest_laminitis_grade: p.laminitis_grade,
    treatment_count: p.treatment_count ?? 0,
    assessment_count: p.assessment_count ?? 0,
    lab_count: p.lab_count ?? 0,
    note_count: p.note_count ?? 0,
  };
}

function buildAuditRecord(log: AuditLogEntry): Record<string, unknown> {
  return {
    id: log.id,
    sequence_number: log.sequenceNumber,
    timestamp: log.timestamp,
    user_id: log.userId,
    user_email: log.userEmail,
    user_role: log.userRole,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    patient_id: log.patientId,
    study_id: log.studyId,
    field_name: log.fieldName,
    old_value: log.oldValue,
    new_value: log.newValue,
    reason_for_change: log.reasonForChange,
    client_hash: log.clientHash,
    previous_hash: log.previousHash,
  };
}

function buildProtocolDeviationRecords(
  deviations: ProtocolDeviation[],
  patientUniqueIdById: Map<number, string>
): Record<string, unknown>[] {
  return deviations.map((d) => ({
    subject_id: patientUniqueIdById.get(d.patient_id) ?? String(d.patient_id),
    ...d,
  }));
}

export function buildStatisticalXml(
  meta: StudyMetadata,
  patients: XmlExportPatient[],
  protocolDeviations: ProtocolDeviation[] = []
): string {
  const patientUniqueIdById = new Map(patients.map((p) => [p.id, p.unique_id]));
  const subjectRecords = patients.map(buildSubjectRecord);
  const treatmentRecords = patients.flatMap((p) =>
    (p.treatments || []).map((t) => ({ subject_id: p.unique_id, ...t }))
  );
  const assessmentRecords = patients.flatMap((p) =>
    (p.assessments || []).map((a) => ({ subject_id: p.unique_id, ...a }))
  );
  const labRecords = patients.flatMap((p) =>
    (p.lab_results || []).map((l) => ({ subject_id: p.unique_id, ...l }))
  );
  const noteRecords = patients.flatMap((p) =>
    (p.clinical_notes || []).map((n) => ({ subject_id: p.unique_id, ...n }))
  );
  const deviationRecords = buildProtocolDeviationRecords(protocolDeviations, patientUniqueIdById);

  const datasets = [
    serializeFlatDataset('subjects', subjectRecords),
    serializeFlatDataset('treatments', treatmentRecords),
    serializeFlatDataset('assessments', assessmentRecords),
    serializeFlatDataset('lab_results', labRecords),
    serializeFlatDataset('clinical_notes', noteRecords),
    serializeFlatDataset('protocol_deviations', deviationRecords),
  ].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ptp102:clinicalStudy xmlns:ptp102="https://byrock.com/ptp102/schema/v1"
                      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                      xsi:schemaLocation="https://byrock.com/ptp102/schema/v1 ptp102-statistical.xsd">
  <studyHeader>
    ${buildStudyHeader(meta)}
  </studyHeader>
  <datasets>
${datasets}
  </datasets>
</ptp102:clinicalStudy>`;
}

export function buildFullXml(
  meta: StudyMetadata,
  patients: XmlExportPatient[],
  auditLogs: AuditLogEntry[],
  protocolDeviations: ProtocolDeviation[] = []
): string {
  const patientUniqueIdById = new Map(patients.map((p) => [p.id, p.unique_id]));
  const subjectRecords = patients.map(buildSubjectRecord);
  const treatmentRecords = patients.flatMap((p) =>
    (p.treatments || []).map((t) => ({ subject_id: p.unique_id, ...t }))
  );
  const assessmentRecords = patients.flatMap((p) =>
    (p.assessments || []).map((a) => ({ subject_id: p.unique_id, ...a }))
  );
  const labRecords = patients.flatMap((p) =>
    (p.lab_results || []).map((l) => ({ subject_id: p.unique_id, ...l }))
  );
  const noteRecords = patients.flatMap((p) =>
    (p.clinical_notes || []).map((n) => ({ subject_id: p.unique_id, ...n }))
  );
  const auditRecords = auditLogs.map(buildAuditRecord);
  const deviationRecords = buildProtocolDeviationRecords(protocolDeviations, patientUniqueIdById);

  const datasets = [
    serializeFlatDataset('subjects', subjectRecords),
    serializeFlatDataset('treatments', treatmentRecords),
    serializeFlatDataset('assessments', assessmentRecords),
    serializeFlatDataset('lab_results', labRecords),
    serializeFlatDataset('clinical_notes', noteRecords),
    serializeFlatDataset('protocol_deviations', deviationRecords),
    serializeFlatDataset('audit_trail', auditRecords),
  ].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ptp102:clinicalStudy xmlns:ptp102="https://byrock.com/ptp102/schema/v1"
                      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                      xsi:schemaLocation="https://byrock.com/ptp102/schema/v1 ptp102-full.xsd">
  <studyHeader>
    ${buildStudyHeader(meta)}
  </studyHeader>
  <datasets>
${datasets}
  </datasets>
</ptp102:clinicalStudy>`;
}

// ---------------------------------------------------------------------------
// CDISC-like define.xml (README / data definition file)
// ---------------------------------------------------------------------------

const COMMON_CODE_LISTS: Record<string, { value: string; label: string }[]> = {
  sex: [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'Gelding', label: 'Gelding' },
    { value: 'Mare', label: 'Mare' },
    { value: 'Stallion', label: 'Stallion' },
  ],
  trial_status: [
    { value: 'screening', label: 'Screening' },
    { value: 'enrolled', label: 'Enrolled' },
    { value: 'completed', label: 'Completed' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ],
  screening_status: [
    { value: 'pending_screening', label: 'Pending Screening' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'awaiting_details', label: 'Awaiting Details' },
  ],
  obel_grade: [
    { value: '0', label: 'None' },
    { value: '1', label: 'Mild' },
    { value: '2', label: 'Moderate' },
    { value: '3', label: 'Severe' },
    { value: '4', label: 'Non-ambulatory' },
  ],
  pain_score: [
    { value: '0', label: 'No pain' },
    { value: '1', label: 'Mild' },
    { value: '2', label: 'Mild' },
    { value: '3', label: 'Moderate' },
    { value: '4', label: 'Moderate' },
    { value: '5', label: 'Moderate' },
    { value: '6', label: 'Severe' },
    { value: '7', label: 'Severe' },
    { value: '8', label: 'Severe' },
    { value: '9', label: 'Severe' },
    { value: '10', label: 'Worst possible pain' },
  ],
  digital_pulse_score: [
    { value: '0', label: 'None' },
    { value: '1', label: 'Weak' },
    { value: '2', label: 'Moderate' },
    { value: '3', label: 'Moderate-strong' },
    { value: '4', label: 'Bounding' },
  ],
  note_type: [
    { value: 'observation', label: 'Observation' },
    { value: 'video', label: 'Video Note' },
  ],
  user_role: [
    { value: 'admin', label: 'Administrator' },
    { value: 'vet', label: 'Veterinarian' },
    { value: 'unknown', label: 'Unknown' },
  ],
  impact_assessment: [
    { value: 'Minor', label: 'Minor' },
    { value: 'Major', label: 'Major' },
    { value: 'Critical', label: 'Critical' },
  ],
  audit_action: [
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'VIEW', label: 'View' },
    { value: 'EXPORT', label: 'Export' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'LOCK', label: 'Lock' },
    { value: 'UNLOCK', label: 'Unlock' },
    { value: 'FREEZE', label: 'Freeze' },
    { value: 'APPROVE', label: 'Approve' },
    { value: 'REJECT', label: 'Reject' },
    { value: 'REGISTER', label: 'Register' },
    { value: 'SUBMIT', label: 'Submit' },
    { value: 'SYSTEM', label: 'System' },
  ],
};

const DATASET_SCHEMA: DatasetMeta[] = [
  {
    name: 'subjects',
    label: 'Subject Demographics and Enrollment',
    variables: [
      { name: 'id', label: 'Subject internal identifier', type: 'num', source: 'EDC auto-number' },
      { name: 'unique_id', label: 'Study subject identifier', type: 'char', length: 16, source: 'EDC system' },
      { name: 'horse_name', label: 'Horse name', type: 'char', length: 100, source: 'CRF Page 1' },
      { name: 'age', label: 'Age in years', type: 'num', unit: 'years', source: 'CRF Page 1' },
      { name: 'breed', label: 'Breed', type: 'char', length: 50, source: 'CRF Page 1' },
      { name: 'sex', label: 'Sex', type: 'char', length: 10, source: 'CRF Page 1', codeList: COMMON_CODE_LISTS.sex },
      { name: 'weight', label: 'Body weight', type: 'num', unit: 'kg', source: 'CRF Page 1' },
      { name: 'owner_name', label: 'Owner or authorized agent name', type: 'char', length: 100, source: 'CRF Page 1' },
      { name: 'enrollment_date', label: 'Enrollment date', type: 'date', source: 'EDC system' },
      { name: 'consent_date', label: 'Informed consent date', type: 'date', source: 'Informed consent workflow' },
      { name: 'trial_status', label: 'Trial status', type: 'char', length: 20, source: 'EDC system', codeList: COMMON_CODE_LISTS.trial_status },
      { name: 'screening_status', label: 'Screening status', type: 'char', length: 25, source: 'Admin screening panel', codeList: COMMON_CODE_LISTS.screening_status },
      { name: 'eligibility_verified', label: 'Eligibility verified', type: 'char', length: 5, source: 'Admin screening panel' },
      { name: 'veterinarian_email', label: 'Enrolling veterinarian email', type: 'char', length: 100, source: 'EDC system' },
      { name: 'laminitis_grade', label: 'Latest Obel laminitis grade', type: 'num', source: 'Clinical assessment', codeList: COMMON_CODE_LISTS.obel_grade },
    ],
  },
  {
    name: 'treatments',
    label: 'PTP-102 Treatment Administration',
    variables: [
      { name: 'id', label: 'Treatment record identifier', type: 'num', source: 'EDC auto-number' },
      { name: 'patient_id', label: 'Subject internal identifier', type: 'num', source: 'EDC system' },
      { name: 'administration_datetime', label: 'Date and time of administration', type: 'date', source: 'CRF Page 2' },
      { name: 'dosage_mg', label: 'Total dose administered', type: 'num', unit: 'mg', source: 'CRF Page 2' },
      { name: 'route', label: 'Route of administration', type: 'char', length: 50, source: 'CRF Page 2' },
      { name: 'protocol_hour', label: 'Protocol hour', type: 'num', unit: 'hours', source: 'EDC system' },
      { name: 'total_volume_ml', label: 'Total infusion volume', type: 'num', unit: 'mL', source: 'CRF Page 2' },
      { name: 'veterinarian_name', label: 'Administering veterinarian', type: 'char', length: 100, source: 'EDC system' },
      { name: 'batch_number', label: 'Product batch/lot number', type: 'char', length: 50, source: 'CRF Page 2' },
      { name: 'immediate_reactions', label: 'Immediate adverse reactions', type: 'char', length: 500, source: 'CRF Page 2' },
      { name: 'notes', label: 'Treatment notes', type: 'char', length: 2000, source: 'CRF Page 2' },
    ],
  },
  {
    name: 'assessments',
    label: 'Clinical Assessments',
    variables: [
      { name: 'id', label: 'Assessment record identifier', type: 'num', source: 'EDC auto-number' },
      { name: 'patient_id', label: 'Subject internal identifier', type: 'num', source: 'EDC system' },
      { name: 'assessment_datetime', label: 'Assessment date and time', type: 'date', source: 'CRF Page 3' },
      { name: 'protocol_hour', label: 'Protocol hour', type: 'num', unit: 'hours', source: 'EDC system' },
      { name: 'obel_grade', label: 'Obel laminitis grade', type: 'num', source: 'CRF Page 3', codeList: COMMON_CODE_LISTS.obel_grade },
      { name: 'pain_score', label: 'Pain score', type: 'num', source: 'CRF Page 3', codeList: COMMON_CODE_LISTS.pain_score },
      { name: 'mobility_score', label: 'Mobility score', type: 'num', source: 'CRF Page 3' },
      { name: 'digital_pulse_score', label: 'Digital pulse score', type: 'num', source: 'CRF Page 3', codeList: COMMON_CODE_LISTS.digital_pulse_score },
      { name: 'hoof_temperature', label: 'Hoof temperature', type: 'char', length: 50, source: 'CRF Page 3' },
      { name: 'heart_rate', label: 'Heart rate', type: 'num', unit: 'bpm', source: 'CRF Page 3' },
      { name: 'respiratory_rate', label: 'Respiratory rate', type: 'num', unit: 'breaths/min', source: 'CRF Page 3' },
      { name: 'temperature', label: 'Rectal temperature', type: 'num', unit: 'Fahrenheit', source: 'CRF Page 3' },
      { name: 'clinical_notes', label: 'Clinical notes', type: 'char', length: 2000, source: 'CRF Page 3' },
      { name: 'veterinarian_name', label: 'Assessing veterinarian', type: 'char', length: 100, source: 'EDC system' },
    ],
  },
  {
    name: 'lab_results',
    label: 'Laboratory Results',
    variables: [
      { name: 'id', label: 'Lab result identifier', type: 'num', source: 'EDC auto-number' },
      { name: 'patient_id', label: 'Subject internal identifier', type: 'num', source: 'EDC system' },
      { name: 'test_datetime', label: 'Sample collection date and time', type: 'date', source: 'CRF Page 4' },
      { name: 'protocol_hour', label: 'Protocol hour', type: 'num', unit: 'hours', source: 'EDC system' },
      { name: 'wbc', label: 'White blood cell count', type: 'num', unit: '10^9/L', source: 'Lab report' },
      { name: 'rbc', label: 'Red blood cell count', type: 'num', unit: '10^12/L', source: 'Lab report' },
      { name: 'hemoglobin', label: 'Hemoglobin', type: 'num', unit: 'g/L', source: 'Lab report' },
      { name: 'hematocrit', label: 'Hematocrit', type: 'num', unit: '%', source: 'Lab report' },
      { name: 'platelets', label: 'Platelet count', type: 'num', unit: '10^9/L', source: 'Lab report' },
      { name: 'glucose', label: 'Glucose', type: 'num', unit: 'mg/dL', source: 'Lab report' },
      { name: 'creatinine', label: 'Creatinine', type: 'num', unit: 'mg/dL', source: 'Lab report' },
      { name: 'bun', label: 'Blood urea nitrogen', type: 'num', unit: 'mg/dL', source: 'Lab report' },
      { name: 'alt', label: 'Alanine aminotransferase', type: 'num', unit: 'U/L', source: 'Lab report' },
      { name: 'ast', label: 'Aspartate aminotransferase', type: 'num', unit: 'U/L', source: 'Lab report' },
      { name: 'alkaline_phosphatase', label: 'Alkaline phosphatase', type: 'num', unit: 'U/L', source: 'Lab report' },
      { name: 'total_protein', label: 'Total protein', type: 'num', unit: 'g/L', source: 'Lab report' },
      { name: 'albumin', label: 'Albumin', type: 'num', unit: 'g/L', source: 'Lab report' },
      { name: 'serum_amyloid_a', label: 'Serum amyloid A', type: 'num', unit: 'mg/L', source: 'Lab report' },
      { name: 'fibrinogen', label: 'Fibrinogen', type: 'num', unit: 'g/L', source: 'Lab report' },
      { name: 'lactate', label: 'Lactate', type: 'num', unit: 'mmol/L', source: 'Lab report' },
      { name: 'additional_notes', label: 'Additional lab notes', type: 'char', length: 2000, source: 'Lab report' },
    ],
  },
  {
    name: 'clinical_notes',
    label: 'Clinical Notes and Video Annotations',
    variables: [
      { name: 'id', label: 'Note identifier', type: 'num', source: 'EDC auto-number' },
      { name: 'patient_id', label: 'Subject internal identifier', type: 'num', source: 'EDC system' },
      { name: 'note_type', label: 'Note type', type: 'char', length: 20, source: 'EDC system', codeList: COMMON_CODE_LISTS.note_type },
      { name: 'note_content', label: 'Note content', type: 'char', length: 4000, source: 'CRF free text' },
      { name: 'protocol_hour', label: 'Protocol hour', type: 'num', unit: 'hours', source: 'EDC system' },
      { name: 'video_url', label: 'Video file URL', type: 'char', length: 500, source: 'Video upload manager' },
      { name: 'video_file_name', label: 'Video file name', type: 'char', length: 200, source: 'Video upload manager' },
      { name: 'video_uploaded_at', label: 'Video upload timestamp', type: 'date', source: 'Video upload manager' },
      { name: 'created_at', label: 'Record creation timestamp', type: 'date', source: 'EDC system' },
    ],
  },
  {
    name: 'protocol_deviations',
    label: 'Protocol Deviations',
    variables: [
      { name: 'id', label: 'Protocol deviation record identifier', type: 'num', source: 'EDC auto-number' },
      { name: 'subject_id', label: 'Study subject identifier', type: 'char', length: 16, source: 'EDC system' },
      { name: 'patient_id', label: 'Subject internal identifier', type: 'num', source: 'EDC system' },
      { name: 'deviation_type', label: 'Deviation type', type: 'char', length: 100, source: 'Eligibility workflow' },
      { name: 'deviation_date', label: 'Deviation date', type: 'date', source: 'Eligibility workflow' },
      { name: 'description', label: 'Deviation description', type: 'char', length: 500, source: 'Eligibility workflow' },
      { name: 'explanation', label: 'Deviation explanation / justification', type: 'char', length: 4000, source: 'Eligibility workflow' },
      { name: 'impact_assessment', label: 'Impact assessment', type: 'char', length: 20, source: 'Eligibility workflow', codeList: COMMON_CODE_LISTS.impact_assessment },
      { name: 'corrective_action', label: 'Corrective action', type: 'char', length: 2000, source: 'Eligibility workflow' },
      { name: 'preventive_action', label: 'Preventive action', type: 'char', length: 2000, source: 'Eligibility workflow' },
      { name: 'created_at', label: 'Record creation timestamp', type: 'date', source: 'EDC system' },
    ],
  },
  {
    name: 'audit_trail',
    label: 'Audit Trail',
    variables: [
      { name: 'id', label: 'Audit entry identifier', type: 'num', source: 'Audit subsystem' },
      { name: 'sequenceNumber', label: 'Sequence number', type: 'num', source: 'Audit subsystem' },
      { name: 'timestamp', label: 'Event timestamp', type: 'date', source: 'Audit subsystem' },
      { name: 'userId', label: 'User identifier', type: 'char', length: 100, source: 'Audit subsystem' },
      { name: 'userEmail', label: 'User email', type: 'char', length: 100, source: 'Audit subsystem' },
      { name: 'user_role', label: 'User role', type: 'char', length: 20, source: 'Audit subsystem', codeList: COMMON_CODE_LISTS.user_role },
      { name: 'audit_action', label: 'Action performed', type: 'char', length: 20, source: 'Audit subsystem', codeList: COMMON_CODE_LISTS.audit_action },
      { name: 'entityType', label: 'Entity type', type: 'char', length: 50, source: 'Audit subsystem' },
      { name: 'entityId', label: 'Entity identifier', type: 'num', source: 'Audit subsystem' },
      { name: 'patientId', label: 'Subject identifier', type: 'num', source: 'Audit subsystem' },
      { name: 'studyId', label: 'Study identifier', type: 'char', length: 32, source: 'Audit subsystem' },
      { name: 'fieldName', label: 'Field changed', type: 'char', length: 50, source: 'Audit subsystem' },
      { name: 'oldValue', label: 'Previous value', type: 'char', length: 4000, source: 'Audit subsystem' },
      { name: 'newValue', label: 'New value', type: 'char', length: 4000, source: 'Audit subsystem' },
      { name: 'reasonForChange', label: 'Reason for change', type: 'char', length: 2000, source: 'Audit subsystem' },
      { name: 'clientHash', label: 'Entry SHA-256 hash', type: 'char', length: 64, source: 'Audit subsystem' },
      { name: 'previousHash', label: 'Previous entry hash', type: 'char', length: 64, source: 'Audit subsystem' },
    ],
  },
];

function buildCodeListXml(name: string, items: { value: string; label: string }[]): string {
  const itemNodes = items
    .map(
      (item) => `      <CodeListItem CodedValue="${escapeXml(item.value)}">
        <Decode>
          <TranslatedText xml:lang="en">${escapeXml(item.label)}</TranslatedText>
        </Decode>
      </CodeListItem>`
    )
    .join('\n');
  return `    <CodeList OID="CL.${name}" Name="${name}" DataType="text">
${itemNodes}
    </CodeList>`;
}

function buildItemDefXml(variable: VariableMeta, _order: number): string {
  const attrs: Record<string, string> = {
    OID: `IT.${variable.name}`,
    Name: variable.name,
    DataType: variable.type,
  };
  if (variable.length) {
    attrs.Length = String(variable.length);
  }
  const attrString = Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeXml(v)}"`)
    .join(' ');
  const codeListRef = variable.codeList
    ? `\n      <CodeListRef CodeListOID="CL.${variable.name}"/>`
    : '';
  return `    <ItemDef ${attrString}>
      <Description>
        <TranslatedText xml:lang="en">${escapeXml(variable.label)}</TranslatedText>
      </Description>
      ${variable.unit ? `<MeasurementUnitRef MeasurementUnitOID="MU.${variable.name}"/>` : ''}${codeListRef}
      <Comment>
        <Description>
          <TranslatedText xml:lang="en">Source: ${escapeXml(variable.source ?? 'Not specified')}</TranslatedText>
        </Description>
      </Comment>
    </ItemDef>`;
}

function buildItemGroupXml(dataset: DatasetMeta): string {
  const itemRefs = dataset.variables
    .map(
      (v, i) => `      <ItemRef ItemOID="IT.${v.name}" OrderNumber="${i + 1}" Mandatory="No"/>`
    )
    .join('\n');
  return `    <ItemGroupDef OID="IG.${dataset.name}" Name="${dataset.name}" Repeating="Yes" ItemGroupOID="IG.${dataset.name}">
      <Description>
        <TranslatedText xml:lang="en">${escapeXml(dataset.label)}</TranslatedText>
      </Description>
${itemRefs}
    </ItemGroupDef>`;
}

export function generateDefineXml(studyId: string, exportedAt?: string, exportedBy?: string): string {
  const itemGroupNodes = DATASET_SCHEMA.map(buildItemGroupXml).join('\n');
  const itemDefNodes = DATASET_SCHEMA
    .flatMap((ds) => ds.variables.map((v, i) => buildItemDefXml(v, i + 1)))
    .join('\n');
  const codeListNodes = DATASET_SCHEMA
    .flatMap((ds) => ds.variables.filter((v) => v.codeList).map((v) => buildCodeListXml(v.name, v.codeList!)))
    .join('\n');
  const measurementUnitNodes = DATASET_SCHEMA
    .flatMap((ds) => ds.variables.filter((v) => v.unit))
    .map(
      (v) => `    <MeasurementUnit OID="MU.${v.name}" Name="${escapeXml(v.unit)}">
      <Symbol>
        <TranslatedText xml:lang="en">${escapeXml(v.unit)}</TranslatedText>
      </Symbol>
    </MeasurementUnit>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ODM xmlns="http://www.cdisc.org/ns/odm/v1.3"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     FileType="Snapshot"
     FileOID="PTP102.DEFINE.${studyId}.${Date.now()}"
     CreationDateTime="${exportedAt ?? new Date().toISOString()}"
     ODMVersion="1.3.2">
  <Study OID="${escapeXml(studyId)}">
    <GlobalVariables>
      <StudyName>${escapeXml(STUDY_TITLE)}</StudyName>
      <StudyDescription>Data definition file (define.xml) for the PTP-102 laminitis trial. Auto-generated for regulatory submission readiness.</StudyDescription>
      <ProtocolName>${escapeXml(studyId)}</ProtocolName>
    </GlobalVariables>
    <BasicDefinitions>
${measurementUnitNodes}
    </BasicDefinitions>
    <MetaDataVersion OID="MV.1.0" Name="PTP-102 Data Definitions" Description="Variable-level metadata for all datasets and audit trail">
      <Protocol>
        <StudyEventRef StudyEventOID="SE.PTP102" OrderNumber="1" Mandatory="Yes"/>
      </Protocol>
      <StudyEventDef OID="SE.PTP102" Name="PTP-102 Trial" Repeating="No">
        <FormRef FormOID="FM.PTP102" OrderNumber="1" Mandatory="Yes"/>
      </StudyEventDef>
      <FormDef OID="FM.PTP102" Name="PTP-102 CRF" Repeating="No">
        ${DATASET_SCHEMA.map((ds) => `<ItemGroupRef ItemGroupOID="IG.${ds.name}" Mandatory="No"/>`).join('\n        ')}
      </FormDef>
${itemGroupNodes}
${itemDefNodes}
${codeListNodes}
    </MetaDataVersion>
  </Study>
  <Annotation>
    <Comment>
      <TranslatedText xml:lang="en">Auto-generated by PTP-102 Trial Portal${exportedBy ? `; exported by ${escapeXml(exportedBy)}` : ''}.</TranslatedText>
    </Comment>
  </Annotation>
</ODM>`;
}

export function downloadXml(xmlString: string, filename: string) {
  const blob = new Blob([xmlString], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
