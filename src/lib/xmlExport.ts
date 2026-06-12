/**
 * Deterministic XML export builders for the PTP-102 trial.
 */

import { type AuditLogEntry, STUDY_ID, STUDY_TITLE, SPONSOR_NAME } from '@/lib/auditTypes';

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

function xmlTag(name: string, value: unknown, attrs: Record<string, string> = {}): string {
  const attrString = Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeXml(v)}"`)
    .join(' ');
  const open = attrString ? `<${name} ${attrString}>` : `<${name}>`;
  return `${open}${escapeXml(value)}</${name}>`;
}

function buildStudyHeader(meta: StudyMetadata): string {
  return [
    xmlTag('studyId', meta.studyId),
    xmlTag('studyTitle', meta.studyTitle),
    xmlTag('sponsorName', meta.sponsorName),
    xmlTag('protocolVersion', meta.protocolVersion),
    xmlTag('exportedAt', meta.exportedAt),
    xmlTag('exportedBy', meta.exportedBy),
  ].join('\n      ');
}

export function buildStatisticalXml(meta: StudyMetadata, patients: XmlExportPatient[]): string {
  const patientNodes = patients
    .map((p) => {
      return `    <subject>
      ${xmlTag('subjectId', p.unique_id)}
      ${xmlTag('horseName', p.horse_name)}
      ${xmlTag('ageYears', p.age)}
      ${xmlTag('breed', p.breed)}
      ${xmlTag('sex', p.sex)}
      ${xmlTag('weightKg', p.weight)}
      ${xmlTag('enrollmentDate', p.enrollment_date)}
      ${xmlTag('consentDate', p.consent_date)}
      ${xmlTag('trialStatus', p.trial_status)}
      ${xmlTag('screeningStatus', p.screening_status)}
      ${xmlTag('eligibilityVerified', p.eligibility_verified)}
      ${xmlTag('veterinarianName', p.veterinarian_name)}
      ${xmlTag('veterinarianEmail', p.veterinarian_email)}
      ${xmlTag('latestLaminitisGrade', p.laminitis_grade)}
      ${xmlTag('treatmentCount', p.treatment_count ?? 0)}
      ${xmlTag('assessmentCount', p.assessment_count ?? 0)}
      ${xmlTag('labCount', p.lab_count ?? 0)}
      ${xmlTag('noteCount', p.note_count ?? 0)}
    </subject>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ptp102:clinicalStudy xmlns:ptp102="https://byrock.com/ptp102/schema/v1"
                      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                      xsi:schemaLocation="https://byrock.com/ptp102/schema/v1 ptp102-statistical.xsd">
  <studyHeader>
    ${buildStudyHeader(meta)}
  </studyHeader>
  <subjects count="${patients.length}">
${patientNodes}
  </subjects>
</ptp102:clinicalStudy>`;
}

function serializeObject(obj: any, tagName: string, indent = '    '): string {
  if (obj === null || obj === undefined) {
    return `${indent}<${tagName} xsi:nil="true"/>`;
  }
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return `${indent}${xmlTag(tagName, Array.isArray(obj) ? JSON.stringify(obj) : obj)}`;
  }
  const childTags = Object.entries(obj)
    .map(([key, value]) => serializeObject(value, key, `${indent}  `))
    .join('\n');
  return `${indent}<${tagName}>\n${childTags}\n${indent}</${tagName}>`;
}

export function buildFullXml(meta: StudyMetadata, patients: XmlExportPatient[], auditLogs: AuditLogEntry[]): string {
  const patientNodes = patients
    .map((p) => {
      const treatments = (p.treatments || [])
        .map((t) => serializeObject(t, 'treatment', '        '))
        .join('\n');
      const assessments = (p.assessments || [])
        .map((a) => serializeObject(a, 'assessment', '        '))
        .join('\n');
      const labs = (p.lab_results || [])
        .map((l) => serializeObject(l, 'labResult', '        '))
        .join('\n');
      const notes = (p.clinical_notes || [])
        .map((n) => serializeObject(n, 'clinicalNote', '        '))
        .join('\n');

      return `    <subject>
      ${xmlTag('subjectId', p.unique_id)}
      ${serializeObject({ ...p, treatments: undefined, assessments: undefined, lab_results: undefined, clinical_notes: undefined }, 'demographics', '      ')}
      <treatments count="${p.treatments?.length ?? 0}">
${treatments}
      </treatments>
      <assessments count="${p.assessments?.length ?? 0}">
${assessments}
      </assessments>
      <labResults count="${p.lab_results?.length ?? 0}">
${labs}
      </labResults>
      <clinicalNotes count="${p.clinical_notes?.length ?? 0}">
${notes}
      </clinicalNotes>
    </subject>`;
    })
    .join('\n');

  const auditNodes = auditLogs
    .map((log) => {
      return `    <auditEvent>
      ${xmlTag('sequenceNumber', log.sequenceNumber)}
      ${xmlTag('timestamp', log.timestamp)}
      ${xmlTag('userId', log.userId)}
      ${xmlTag('userRole', log.userRole)}
      ${xmlTag('action', log.action)}
      ${xmlTag('entityType', log.entityType)}
      ${xmlTag('entityId', log.entityId)}
      ${xmlTag('patientId', log.patientId)}
      ${xmlTag('studyId', log.studyId)}
      ${xmlTag('fieldName', log.fieldName)}
      ${xmlTag('oldValue', log.oldValue)}
      ${xmlTag('newValue', log.newValue)}
      ${xmlTag('reasonForChange', log.reasonForChange)}
      ${xmlTag('clientHash', log.clientHash)}
      ${xmlTag('previousHash', log.previousHash)}
    </auditEvent>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ptp102:clinicalStudy xmlns:ptp102="https://byrock.com/ptp102/schema/v1"
                      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                      xsi:schemaLocation="https://byrock.com/ptp102/schema/v1 ptp102-full.xsd">
  <studyHeader>
    ${buildStudyHeader(meta)}
  </studyHeader>
  <subjects count="${patients.length}">
${patientNodes}
  </subjects>
  <auditTrail count="${auditLogs.length}" hashAlgorithm="SHA-256">
${auditNodes}
  </auditTrail>
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
    { value: '0', label: 'Absent' },
    { value: '1', label: 'Weak' },
    { value: '2', label: 'Moderate' },
    { value: '3', label: 'Bounding' },
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
      { name: 'temperature', label: 'Rectal temperature', type: 'num', unit: 'Celsius', source: 'CRF Page 3' },
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

function buildItemDefXml(variable: VariableMeta, order: number): string {
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
