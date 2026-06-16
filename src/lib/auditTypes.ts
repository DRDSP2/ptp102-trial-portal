/**
 * Shared audit-trail types and constants.
 * Used by the mock data layer and the UI components.
 */

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'EXPORT_SUBMISSION_PACKAGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOCK'
  | 'UNLOCK'
  | 'FREEZE'
  | 'APPROVE'
  | 'REJECT'
  | 'REGISTER'
  | 'SUBMIT'
  | 'MARK_TIMELINE_COMPLETE'
  | 'DOSE_ADMINISTERED'
  | 'MONITORING_CHECKPOINT'
  | 'GENERATE'
  | 'SEND'
  | 'SIGN'
  | 'UPLOAD'
  | 'REPLACE'
  | 'VERIFY'
  | 'DISPENSE'
  | 'SHIPMENT_DISPATCH'
  | 'SHIPMENT_RECEIVE'
  | 'INVENTORY_ADJUST'
  | 'SYSTEM';

export type AuditEntityType =
  | 'patient'
  | 'clinical_assessment'
  | 'treatment'
  | 'clinical_note'
  | 'lab_result'
  | 'veterinarian'
  | 'admin'
  | 'informed_consent'
  | 'investigator_qualification'
  | 'shipment'
  | 'protocol_version'
  | 'adverse_event'
  | 'protocol_deviation'
  | 'consent_document'
  | 'study_export'
  | 'inventory'
  | 'system';

export type AuditLogEntry = {
  id: number;
  sequenceNumber: number;
  timestamp: string; // ISO-8601 with offset, e.g. 2025-11-15T08:00:00.000Z
  userId: string;
  userEmail: string;
  userRole: 'admin' | 'vet' | 'unknown';
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number | null;
  patientId: number | null;
  studyId: string | null;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  reasonForChange: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  clientHash: string;
  previousHash: string;
};

/**
 * Input payload for `recordAudit`. Only `action` and `entityType` are required;
 * every other field is filled in by the recorder with safe defaults
 * (current user, current timestamp, null for unspecified context).
 *
 * The recorder is responsible for the audit-chain fields it generates itself
 * (`id`, `sequenceNumber`, `timestamp`, `clientHash`, `previousHash`).
 */
export type AuditPayload = Pick<AuditLogEntry, 'action' | 'entityType'> &
  Partial<
    Omit<
      AuditLogEntry,
      'id' | 'sequenceNumber' | 'clientHash' | 'previousHash' | 'action' | 'entityType'
    >
  >;

export const STUDY_ID = 'PTP-102';
export const STUDY_TITLE = 'PTP-102 Laminitis Pilot Study';
export const SPONSOR_NAME = 'Byrock Technologies Ltd.';

export const CRITICAL_FIELDS: Record<string, string[]> = {
  patient: ['trial_status', 'screening_status', 'eligibility_verified', 'consent_date', 'owner_name', 'horse_name'],
  clinical_assessment: ['obel_grade', 'pain_score'],
  treatment: ['dosage_mg', 'protocol_hour', 'administration_datetime', 'route', 'batch_number'],
  lab_result: ['serum_amyloid_a', 'fibrinogen', 'wbc'],
  veterinarian: ['verification_status'],
  patient_lock: ['data_lock_status'],
};

export function isCriticalField(entityType: AuditEntityType, fieldName: string | null): boolean {
  if (!fieldName) return false;
  const fields = CRITICAL_FIELDS[entityType] ?? [];
  return fields.includes(fieldName);
}
