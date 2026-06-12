import { useCallback, useEffect, useState } from 'react';
import { verifyPassword } from '@/utils/passwordHash';
import {
  type AuditLogEntry,
  type AuditPayload,
  type AuditAction,
  type AuditEntityType,
  STUDY_ID,
  STUDY_TITLE,
  SPONSOR_NAME,
} from '@/lib/auditTypes';
import { buildStatisticalXml, buildFullXml, generateDefineXml, type XmlExportPatient } from '@/lib/xmlExport';
import { buildSubmissionPackage, type ExportFile } from '@/lib/submissionPackage';

// =============================================================================
// UIBAKERY DATA MOCK — Enhanced for 4EVERLAND Deployment
// =============================================================================
// This module replaces @uibakery/data because the real npm package is just a
// stub outside the UIBakery platform runtime. All data is persisted to
// localStorage so the app works on IPFS/4EVERLAND.
// =============================================================================

type ActionConfig = {
  name: string;
  type: 'SQL' | 'MongoDB' | 'HTTP';
  config: unknown;
};

type ActionFactory = () => ActionConfig;

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  patients: 'ptp102_mock_patients',
  vets: 'ptp102_mock_vets',
  notes: 'ptp102_mock_notes',
  treatments: 'ptp102_mock_treatments',
  assessments: 'ptp102_mock_assessments',
  labResults: 'ptp102_mock_lab_results',
  investigatorQuals: 'ptp102_mock_investigator_quals',
  informedConsents: 'ptp102_mock_informed_consents',
  shipments: 'ptp102_mock_shipments',
  auditLogs: 'ptp102_mock_audit_logs',
};

// Demo / test account credentials and case seeding
const DEMO_VET_EMAIL = 'phyto2002@gmail.com';
const DEMO_VET_PASSWORD_HASH = '$2a$10$xzmjTA6IZKO115IAD67/3ezpl31KZ9JvjS.whfHLohGgOwiTla1vG';
const DEMO_PATIENT_NAME = 'Midnight Thunder';
const DEMO_PROTOCOL_START = new Date('2025-11-15T08:00:00.000Z');

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------
function getAuditLogs(): AuditLogEntry[] {
  return loadFromStorage<AuditLogEntry[]>(STORAGE_KEYS.auditLogs, []);
}

function saveAuditLogs(logs: AuditLogEntry[]) {
  saveToStorage(STORAGE_KEYS.auditLogs, logs);
}

async function computeAuditHash(entry: Omit<AuditLogEntry, 'clientHash' | 'previousHash'>, previousHash: string): Promise<string> {
  if (typeof window === 'undefined') return '';
  const payload = JSON.stringify({
    id: entry.id,
    sequenceNumber: entry.sequenceNumber,
    timestamp: entry.timestamp,
    userId: entry.userId,
    userEmail: entry.userEmail,
    userRole: entry.userRole,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    patientId: entry.patientId,
    studyId: entry.studyId,
    fieldName: entry.fieldName,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    reasonForChange: entry.reasonForChange,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    sessionId: entry.sessionId,
    previousHash,
  });
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getCurrentUserForAudit(): { userId: string; userEmail: string; userRole: 'admin' | 'vet' | 'unknown' } {
  if (typeof window === 'undefined') {
    return { userId: 'unknown', userEmail: 'unknown', userRole: 'unknown' };
  }
  const adminEmail = window.localStorage.getItem('admin_email');
  const vetEmail = window.localStorage.getItem('veterinarian_email');
  const authRaw = window.localStorage.getItem('laminitis_auth_state');
  let auth: { role?: string; email?: string } | null = null;
  try {
    auth = authRaw ? JSON.parse(authRaw) : null;
  } catch {
    auth = null;
  }
  const email = auth?.email ?? adminEmail ?? vetEmail ?? 'unknown';
  const role = (auth?.role as 'admin' | 'vet' | 'unknown') ?? (adminEmail ? 'admin' : vetEmail ? 'vet' : 'unknown');
  return { userId: email, userEmail: email, userRole: role };
}

async function recordAudit(payload: AuditPayload): Promise<AuditLogEntry> {
  const logs = getAuditLogs();
  const nextId = logs.length > 0 ? Math.max(...logs.map((l) => l.id)) + 1 : 1;
  const nextSequence = logs.length > 0 ? Math.max(...logs.map((l) => l.sequenceNumber)) + 1 : 1;
  const previousHash = logs.length > 0 ? logs[logs.length - 1].clientHash : 'genesis';
  const user = getCurrentUserForAudit();

  const entryWithoutHashes: Omit<AuditLogEntry, 'clientHash' | 'previousHash'> = {
    id: nextId,
    sequenceNumber: nextSequence,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    userId: payload.userId ?? user.userId,
    userEmail: payload.userEmail ?? user.userEmail,
    userRole: payload.userRole ?? user.userRole,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId ?? null,
    patientId: payload.patientId ?? null,
    studyId: payload.studyId ?? STUDY_ID,
    fieldName: payload.fieldName ?? null,
    oldValue: payload.oldValue ?? null,
    newValue: payload.newValue ?? null,
    reasonForChange: payload.reasonForChange ?? null,
    ipAddress: payload.ipAddress ?? null,
    userAgent: payload.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : null),
    sessionId: payload.sessionId ?? null,
  };

  const clientHash = await computeAuditHash(entryWithoutHashes, previousHash);
  const entry: AuditLogEntry = { ...entryWithoutHashes, clientHash, previousHash };
  logs.push(entry);
  saveAuditLogs(logs);
  return entry;
}

function verifyAuditChain(logs: AuditLogEntry[]): { valid: boolean; firstInvalidIndex: number } {
  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];
    const expectedPrevious = i === 0 ? 'genesis' : logs[i - 1].clientHash;
    if (entry.previousHash !== expectedPrevious) {
      return { valid: false, firstInvalidIndex: i };
    }
    // Full hash verification requires async computeAuditHash; synchronous check covers linkage.
  }
  return { valid: true, firstInvalidIndex: -1 };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
const LOCAL_ADMIN = {
  id: 1,
  email: 'drdsp@pm.me',
  password_hash: 'PTP102',
  full_name: 'Admin User',
};

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------
type LocalPatient = {
  id: number;
  horse_name: string;
  age: number;
  breed: string;
  weight: number;
  sex: string;
  owner_name: string;
  owner_contact: string;
  owner_email: string | null;
  owner_phone: string | null;
  enrollment_date: string;
  trial_status: string;
  screening_status: 'pending_screening' | 'approved' | 'rejected' | 'awaiting_details';
  screening_notes: string | null;
  screened_by: string | null;
  screened_at: string | null;
  eligibility_verified: boolean;
  consent_date: string | null;
  consent_id: number | null;
  digital_pulse?: string | null;
  hoof_wall_temperature?: string | null;
  coronary_band_condition?: string | null;
  hoof_tester_response?: string | null;
  stance?: string | null;
  gait?: string | null;
  enrollment_heart_rate?: number | null;
  enrollment_respiratory_rate?: number | null;
  enrollment_temperature?: number | null;
  body_condition_score?: number | null;
  profile_picture_url?: string | null;
  enrolled_by_vet_email?: string | null;
  created_at: string;
  updated_at: string;
  status_history: { status: string; timestamp: string; admin: string; notes: string }[];
  audit_log: AuditEntry[];
};

type LocalPatientParams = Partial<LocalPatient> & {
  horseName?: string;
  ownerName?: string;
  ownerContact?: string;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  enrollmentDate?: string;
  trialStatus?: string;
  screeningStatus?: 'pending_screening' | 'approved' | 'rejected' | 'awaiting_details';
  screeningNotes?: string | null;
  screenedBy?: string | null;
  screenedAt?: string | null;
  eligibilityVerified?: boolean;
  consentDate?: string | null;
  consentId?: number | null;
  digitalPulse?: string | null;
  hoofWallTemperature?: string | null;
  coronaryBandCondition?: string | null;
  hoofTesterResponse?: string | null;
  profilePictureUrl?: string | null;
  enrolledByVetEmail?: string | null;
};

function seedPatients(): LocalPatient[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      horse_name: 'Copper Sunset',
      age: 13,
      breed: 'Quarter Horse',
      weight: 512,
      sex: 'Gelding',
      owner_name: 'Nicole Taylor',
      owner_contact: '555-0115',
      enrollment_date: '2025-11-01',
      trial_status: 'screening',
      screening_status: 'pending_screening',
      screening_notes: null,
      screened_by: null,
      screened_at: null,
      eligibility_verified: true,
      consent_date: '2025-11-01',
      digital_pulse: 'Bounding',
      hoof_wall_temperature: 'Warm',
      coronary_band_condition: 'Mild swelling',
      hoof_tester_response: 'Positive forefeet',
      stance: 'Camped out',
      gait: 'Reluctant',
      enrollment_heart_rate: 46,
      enrollment_respiratory_rate: 18,
      enrollment_temperature: 38.1,
      body_condition_score: 5,
      profile_picture_url: null,
      enrolled_by_vet_email: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: 2,
      horse_name: 'Ocean Breeze',
      age: 6,
      breed: 'Arabian',
      weight: 425.5,
      sex: 'Mare',
      owner_name: 'Brandon Moore',
      owner_contact: '555-0116',
      enrollment_date: '2025-11-02',
      trial_status: 'screening',
      screening_status: 'pending_screening',
      screening_notes: null,
      screened_by: null,
      screened_at: null,
      eligibility_verified: false,
      consent_date: null,
      profile_picture_url: null,
      enrolled_by_vet_email: null,
      created_at: now,
      updated_at: now,
    },
  ];
}

function getPatients(): LocalPatient[] {
  let stored = loadFromStorage<LocalPatient[]>(STORAGE_KEYS.patients, []);
  if (stored.length === 0) {
    const seeded = seedPatients();
    saveToStorage(STORAGE_KEYS.patients, seeded);
    stored = seeded;
  }
  ensureDemoData();
  return loadFromStorage<LocalPatient[]>(STORAGE_KEYS.patients, stored);
}

function savePatients(patients: LocalPatient[]) {
  saveToStorage(STORAGE_KEYS.patients, patients);
}

function createLocalPatient(params: LocalPatientParams = {}) {
  const patients = getPatients();
  const now = new Date().toISOString();
  const nextId = patients.length > 0 ? Math.max(...patients.map((p) => p.id)) + 1 : 1;

  const patient: LocalPatient = {
    id: nextId,
    horse_name: params.horseName ?? params.horse_name ?? '',
    age: params.age ?? 0,
    breed: params.breed ?? '',
    weight: params.weight ?? 0,
    sex: params.sex ?? '',
    owner_name: params.ownerName ?? params.owner_name ?? '',
    owner_contact: params.ownerContact ?? params.owner_contact ?? '',
    owner_email: params.ownerEmail ?? params.owner_email ?? null,
    owner_phone: params.ownerPhone ?? params.owner_phone ?? null,
    enrollment_date: params.enrollmentDate ?? params.enrollment_date ?? now.slice(0, 10),
    trial_status: params.trialStatus ?? params.trial_status ?? 'screening',
    screening_status: params.screeningStatus ?? params.screening_status ?? 'pending_screening',
    screening_notes: params.screeningNotes ?? params.screening_notes ?? null,
    screened_by: params.screenedBy ?? params.screened_by ?? null,
    screened_at: params.screenedAt ?? params.screened_at ?? null,
    eligibility_verified: params.eligibilityVerified ?? params.eligibility_verified ?? false,
    consent_date: params.consentDate ?? params.consent_date ?? null,
    consent_id: params.consentId ?? params.consent_id ?? null,
    digital_pulse: params.digitalPulse ?? params.digital_pulse ?? null,
    hoof_wall_temperature: params.hoofWallTemperature ?? params.hoof_wall_temperature ?? null,
    coronary_band_condition: params.coronaryBandCondition ?? params.coronary_band_condition ?? null,
    hoof_tester_response: params.hoofTesterResponse ?? params.hoof_tester_response ?? null,
    stance: params.stance ?? null,
    gait: params.gait ?? null,
    enrollment_heart_rate: params.enrollmentHeartRate ?? params.enrollment_heart_rate ?? null,
    enrollment_respiratory_rate: params.enrollmentRespiratoryRate ?? params.enrollment_respiratory_rate ?? null,
    enrollment_temperature: params.enrollmentTemperature ?? params.enrollment_temperature ?? null,
    body_condition_score: params.bodyConditionScore ?? params.body_condition_score ?? null,
    profile_picture_url: params.profilePictureUrl ?? params.profile_picture_url ?? null,
    enrolled_by_vet_email: params.enrolledByVetEmail ?? params.enrolled_by_vet_email ?? null,
    created_at: now,
    updated_at: now,
    status_history: [],
    audit_log: [],
  };

  patients.push(patient);
  savePatients(patients);
  return patient;
}

// ---------------------------------------------------------------------------
// Veterinarians
// ---------------------------------------------------------------------------
type LocalVet = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  license_number: string;
  hospital_affiliation: string;
  tc_accepted: boolean;
  tc_accepted_at: string | null;
  signature_text: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  no_conflict_of_interest?: boolean;
  consent_printed_at?: string | null;
  created_at: string;
  updated_at: string;
};

function getVets(): LocalVet[] {
  ensureDemoData();
  return loadFromStorage<LocalVet[]>(STORAGE_KEYS.vets, []);
}

function saveVets(vets: LocalVet[]) {
  saveToStorage(STORAGE_KEYS.vets, vets);
}

// ---------------------------------------------------------------------------
// Clinical Notes
// ---------------------------------------------------------------------------
type LocalNote = {
  id: number;
  patient_id: number;
  veterinarian_name: string;
  note_type: string;
  note_content: string;
  protocol_hour: number | null;
  video_url: string | null;
  video_file_name: string | null;
  video_uploaded_at: string | null;
  created_at: string;
};

function getNotes(): LocalNote[] {
  ensureDemoData();
  return loadFromStorage<LocalNote[]>(STORAGE_KEYS.notes, []);
}

function saveNotes(notes: LocalNote[]) {
  saveToStorage(STORAGE_KEYS.notes, notes);
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------
type LocalTreatment = {
  id: number;
  patient_id: number;
  administration_datetime: string;
  dosage_mg: number | null;
  route: string;
  protocol_hour: number | null;
  veterinarian_name: string;
  total_volume_ml: number | null;
};

function getTreatments(): LocalTreatment[] {
  ensureDemoData();
  return loadFromStorage<LocalTreatment[]>(STORAGE_KEYS.treatments, []);
}

function saveTreatments(treatments: LocalTreatment[]) {
  saveToStorage(STORAGE_KEYS.treatments, treatments);
}

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------
type LocalAssessment = {
  id: number;
  patient_id: number;
  assessment_datetime: string;
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
  protocol_hour: number | null;
};

function getAssessments(): LocalAssessment[] {
  ensureDemoData();
  return loadFromStorage<LocalAssessment[]>(STORAGE_KEYS.assessments, []);
}

function saveAssessments(assessments: LocalAssessment[]) {
  saveToStorage(STORAGE_KEYS.assessments, assessments);
}

// ---------------------------------------------------------------------------
// Lab Results
// ---------------------------------------------------------------------------
type LocalLabResult = {
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
};

function getLabResults(): LocalLabResult[] {
  ensureDemoData();
  return loadFromStorage<LocalLabResult[]>(STORAGE_KEYS.labResults, []);
}

function saveLabResults(labResults: LocalLabResult[]) {
  saveToStorage(STORAGE_KEYS.labResults, labResults);
}

// ---------------------------------------------------------------------------
// Demo / Test Data Seeding
// ---------------------------------------------------------------------------
function ensureDemoData() {
  if (typeof window === 'undefined') return;

  const now = new Date().toISOString();

  // Ensure demo veterinarian account exists and is approved
  const vets = loadFromStorage<LocalVet[]>(STORAGE_KEYS.vets, []);
  let demoVet = vets.find((v) => v.email.toLowerCase() === DEMO_VET_EMAIL);
  if (!demoVet) {
    const nextVetId = vets.length > 0 ? Math.max(...vets.map((v) => v.id)) + 1 : 1;
    demoVet = {
      id: nextVetId,
      full_name: 'Dr. Sarah Phyto',
      email: DEMO_VET_EMAIL,
      phone: '555-0199',
      password_hash: DEMO_VET_PASSWORD_HASH,
      license_number: 'VET-48291-CA',
      hospital_affiliation: 'Equine Recovery Center, Davis CA',
      tc_accepted: true,
      tc_accepted_at: now,
      signature_text: 'S. Phyto DVM',
      verification_status: 'approved',
      created_at: now,
      updated_at: now,
    };
    vets.push(demoVet);
    saveToStorage(STORAGE_KEYS.vets, vets);
  }

  // Ensure demo enrolled patient exists for this vet
  const patients = loadFromStorage<LocalPatient[]>(STORAGE_KEYS.patients, []);
  let demoPatient = patients.find(
    (p) => p.enrolled_by_vet_email?.toLowerCase() === DEMO_VET_EMAIL && p.horse_name === DEMO_PATIENT_NAME
  );
  if (!demoPatient) {
    const protocolStart = DEMO_PROTOCOL_START.toISOString();
    const screeningTime = new Date(DEMO_PROTOCOL_START.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const nextPatientId = patients.length > 0 ? Math.max(...patients.map((p) => p.id)) + 1 : 1;
    demoPatient = {
      id: nextPatientId,
      horse_name: DEMO_PATIENT_NAME,
      age: 9,
      breed: 'Thoroughbred',
      weight: 485,
      sex: 'Gelding',
      owner_name: 'Margaret Holloway',
      owner_contact: '555-0182',
      owner_email: 'm.holloway@example.com',
      owner_phone: '555-0182',
      enrollment_date: screeningTime.slice(0, 10),
      trial_status: 'enrolled',
      screening_status: 'approved',
      screening_notes:
        'Acute laminitis episode, Obel grade 3 at presentation. Owner consent obtained. Eligible for PTP-102 protocol.',
      screened_by: demoVet.full_name,
      screened_at: screeningTime,
      eligibility_verified: true,
      consent_date: screeningTime.slice(0, 10),
      consent_id: nextPatientId + 10000,
      digital_pulse: 'Bounding',
      hoof_wall_temperature: 'Warm',
      coronary_band_condition: 'Mild swelling',
      hoof_tester_response: 'Positive forefeet',
      stance: 'Camped out',
      gait: 'Reluctant',
      enrollment_heart_rate: 52,
      enrollment_respiratory_rate: 22,
      enrollment_temperature: 38.4,
      body_condition_score: 5,
      profile_picture_url: null,
      enrolled_by_vet_email: DEMO_VET_EMAIL,
      created_at: screeningTime,
      updated_at: protocolStart,
      status_history: [
        {
          status: 'screening',
          timestamp: screeningTime,
          admin: 'system',
          notes: 'Demo case created for vet portal preview.',
        },
        {
          status: 'enrolled',
          timestamp: protocolStart,
          admin: 'system',
          notes: 'First PTP-102 dose administered; 72-hour protocol clock started.',
        },
      ],
      audit_log: [],
    };
    patients.push(demoPatient);
    saveToStorage(STORAGE_KEYS.patients, patients);
  }

  const patientId = demoPatient.id;
  const vetName = demoVet.full_name;
  const protocolStartTime = new Date(demoPatient.updated_at).getTime();

  // Ensure demo treatments (Hour 0 and Hour 12)
  const treatments = loadFromStorage<LocalTreatment[]>(STORAGE_KEYS.treatments, []);
  if (!treatments.some((t) => t.patient_id === patientId)) {
    const nextTreatmentId = treatments.length > 0 ? Math.max(...treatments.map((t) => t.id)) + 1 : 1;
    treatments.push(
      {
        id: nextTreatmentId,
        patient_id: patientId,
        administration_datetime: new Date(protocolStartTime).toISOString(),
        dosage_mg: 2500,
        route: 'IV - Jugular',
        protocol_hour: 0,
        veterinarian_name: vetName,
        total_volume_ml: 500,
      },
      {
        id: nextTreatmentId + 1,
        patient_id: patientId,
        administration_datetime: new Date(protocolStartTime + 12 * 60 * 60 * 1000).toISOString(),
        dosage_mg: 2500,
        route: 'IV - Jugular',
        protocol_hour: 12,
        veterinarian_name: vetName,
        total_volume_ml: 500,
      }
    );
    saveToStorage(STORAGE_KEYS.treatments, treatments);
  }

  // Ensure demo assessments showing Obel 3 -> 2 -> 1 recovery
  const assessments = loadFromStorage<LocalAssessment[]>(STORAGE_KEYS.assessments, []);
  if (!assessments.some((a) => a.patient_id === patientId)) {
    const nextAssessmentId = assessments.length > 0 ? Math.max(...assessments.map((a) => a.id)) + 1 : 1;
    assessments.push(
      {
        id: nextAssessmentId,
        patient_id: patientId,
        assessment_datetime: new Date(protocolStartTime - 30 * 60 * 1000).toISOString(),
        obel_grade: 3,
        pain_score: 8,
        mobility_score: 2,
        digital_pulse_score: 3,
        hoof_temperature: 'Warm',
        heart_rate: 52,
        respiratory_rate: 22,
        temperature: 38.4,
        clinical_notes:
          'Baseline presentation: acute forelimb laminitis, Obel grade 3. Horse reluctant to move, weight shifting, bounding digital pulses, warm coronary bands. PTP-102 infusion initiated after consent.',
        veterinarian_name: vetName,
        protocol_hour: 0,
      },
      {
        id: nextAssessmentId + 1,
        patient_id: patientId,
        assessment_datetime: new Date(protocolStartTime + 12 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        obel_grade: 2,
        pain_score: 5,
        mobility_score: 4,
        digital_pulse_score: 2,
        hoof_temperature: 'Mildly warm',
        heart_rate: 44,
        respiratory_rate: 18,
        temperature: 38.2,
        clinical_notes:
          '12-hour reassessment: marked improvement. Horse walking more willingly, digital pulses less bounding, hoof temperature cooling. Second PTP-102 dose tolerated well.',
        veterinarian_name: vetName,
        protocol_hour: 12,
      },
      {
        id: nextAssessmentId + 2,
        patient_id: patientId,
        assessment_datetime: new Date(protocolStartTime + 36 * 60 * 60 * 1000).toISOString(),
        obel_grade: 1,
        pain_score: 2,
        mobility_score: 7,
        digital_pulse_score: 1,
        hoof_temperature: 'Cool',
        heart_rate: 38,
        respiratory_rate: 14,
        temperature: 38.0,
        clinical_notes:
          '36-hour reassessment: dramatic recovery. Obel grade 1, walking with only mild stiffness on firm ground, digital pulses soft, hooves cool. Owner reports horse is comfortable and eating well. Continue supportive care and monitoring.',
        veterinarian_name: vetName,
        protocol_hour: 36,
      }
    );
    saveToStorage(STORAGE_KEYS.assessments, assessments);
  }

  // Ensure demo clinical notes (including a video note)
  const notes = loadFromStorage<LocalNote[]>(STORAGE_KEYS.notes, []);
  if (!notes.some((n) => n.patient_id === patientId)) {
    const nextNoteId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
    notes.push(
      {
        id: nextNoteId,
        patient_id: patientId,
        veterinarian_name: vetName,
        note_type: 'observation',
        note_content:
          'Owner Margaret Holloway reports acute onset forelimb lameness this morning after a grain-bin escape. Horse otherwise healthy with no prior laminitis episodes. Informed consent signed for PTP-102 protocol.',
        protocol_hour: 0,
        video_url: null,
        video_file_name: null,
        video_uploaded_at: null,
        created_at: new Date(protocolStartTime).toISOString(),
      },
      {
        id: nextNoteId + 1,
        patient_id: patientId,
        veterinarian_name: vetName,
        note_type: 'video',
        note_content:
          '36-hour gait assessment video: horse walks briskly on soft surface, only mildly short-strided on concrete. Reference matches Obel grade 1 footage.',
        protocol_hour: 36,
        video_url: '/videos/video-grade1.mp4',
        video_file_name: 'midnight_thunder_36h_grade1.mp4',
        video_uploaded_at: new Date(protocolStartTime + 36 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(protocolStartTime + 36 * 60 * 60 * 1000).toISOString(),
      }
    );
    saveToStorage(STORAGE_KEYS.notes, notes);
  }

  // Ensure demo lab results (baseline + 36h)
  const labResults = loadFromStorage<LocalLabResult[]>(STORAGE_KEYS.labResults, []);
  if (!labResults.some((l) => l.patient_id === patientId)) {
    const nextLabId = labResults.length > 0 ? Math.max(...labResults.map((l) => l.id)) + 1 : 1;
    labResults.push(
      {
        id: nextLabId,
        patient_id: patientId,
        test_datetime: new Date(protocolStartTime - 60 * 60 * 1000).toISOString(),
        protocol_hour: 0,
        wbc: 12.5,
        rbc: 7.2,
        hemoglobin: 13.8,
        hematocrit: 42,
        platelets: 180,
        glucose: 98,
        creatinine: 1.1,
        bun: 18,
        alt: 28,
        ast: 32,
        alkaline_phosphatase: 120,
        total_protein: 68,
        albumin: 32,
        serum_amyloid_a: 45,
        fibrinogen: 4.5,
        lactate: 1.8,
        additional_notes:
          'Baseline inflammatory markers mildly elevated (SAA, fibrinogen) consistent with acute laminitis. Values within acceptable enrollment limits.',
      },
      {
        id: nextLabId + 1,
        patient_id: patientId,
        test_datetime: new Date(protocolStartTime + 36 * 60 * 60 * 1000).toISOString(),
        protocol_hour: 36,
        wbc: 8.2,
        rbc: 7.4,
        hemoglobin: 14.1,
        hematocrit: 43,
        platelets: 195,
        glucose: 88,
        creatinine: 1.0,
        bun: 16,
        alt: 26,
        ast: 30,
        alkaline_phosphatase: 110,
        total_protein: 66,
        albumin: 33,
        serum_amyloid_a: 8,
        fibrinogen: 3.1,
        lactate: 1.2,
        additional_notes:
          '36-hour follow-up: SAA and fibrinogen normalized, supporting clinical impression of rapid inflammatory resolution. Hematocrit and chemistry panels stable.',
      }
    );
    saveToStorage(STORAGE_KEYS.labResults, labResults);
  }

  // Ensure demo NCIE shipment assigned to the demo vet
  const shipments = loadFromStorage<LocalShipment[]>(STORAGE_KEYS.shipments, []);
  if (!shipments.some((s) => s.shipped_to_veterinarian_email?.toLowerCase() === DEMO_VET_EMAIL)) {
    const nextShipmentId = shipments.length > 0 ? Math.max(...shipments.map((s) => s.id)) + 1 : 1;
    shipments.push({
      id: nextShipmentId,
      shipment_date: '2025-11-13T10:00:00.000Z',
      quantity_vials: 10,
      quantity_ml_total: 5000,
      batch_lot_number: 'PTP102-2025-DEMO-001',
      expiration_date: '2026-05-13',
      shipped_to_site_id: null,
      shipped_to_investigator: null,
      shipped_to_veterinarian_id: demoVet.id,
      shipped_to_veterinarian_email: DEMO_VET_EMAIL,
      shipped_to_veterinarian_name: demoVet.full_name,
      shipment_status: 'delivered',
      carrier: 'ColdChain Equine Logistics',
      expected_delivery_date: '2025-11-14',
      delivered_date: '2025-11-14',
      receiving_signature: null,
      received_at: '2025-11-14T09:30:00.000Z',
      condition_on_receipt: 'Excellent - cold chain maintained',
      storage_temperature_celsius: 4,
      received_by_clinic_name: 'Equine Recovery Center',
      received_by_clinic_date: '2025-11-14',
      bottles_received_at_clinic: 10,
      shipment_notes: 'Demo shipment for PTP-102 protocol lot used in the Midnight Thunder case.',
      tracking_number: 'CCEL-999888777',
      created_at: now,
      updated_at: now,
    });
    saveToStorage(STORAGE_KEYS.shipments, shipments);
  }
}

// ---------------------------------------------------------------------------
// Investigator Qualifications
// ---------------------------------------------------------------------------
type AuditEntry = {
  action: string;
  user: string;
  timestamp: string;
  details?: string;
};

type LocalInvestigatorQual = {
  id: number;
  veterinarian_id: number;
  vet_email: string;
  license_number: string | null;
  license_state: string | null;
  years_experience: number | null;
  laminitis_case_volume_per_year: number | null;
  prior_clinical_trial_experience: boolean | null;
  prior_trials_count: number | null;
  cv_upload_url: string | null;
  gcp_training_completed: boolean | null;
  gcp_certificate_url: string | null;
  gcp_completion_date: string | null;
  gcp_expiry_date: string | null;
  gcp_quiz_score: number | null;
  facility_inspection_completed: boolean | null;
  facility_inspection_date: string | null;
  drug_storage_photo_url: string | null;
  drug_storage_photo_status: 'pending' | 'approved' | 'rejected' | null;
  emergency_equipment_photo_url: string | null;
  emergency_equipment_photo_status: 'pending' | 'approved' | 'rejected' | null;
  housing_photo_url: string | null;
  housing_photo_status: 'pending' | 'approved' | 'rejected' | null;
  feed_photo_url: string | null;
  feed_photo_status: 'pending' | 'approved' | 'rejected' | null;
  housing_comments: string | null;
  feed_comments: string | null;
  facility_checklist: Record<string, unknown> | null;
  investigator_agreement_signed: boolean | null;
  investigator_agreement_signed_at: string | null;
  investigator_agreement_signature: string | null;
  protocol_signed: boolean | null;
  protocol_signed_at: string | null;
  protocol_signed_version: string | null;
  protocol_signature: string | null;
  qualification_status: string | null;
  status: 'pending' | 'approved' | 'rejected';
  audit_log: AuditEntry[];
  created_at: string;
  updated_at: string;
  // backward compatibility: old blob format
  qualifications_data?: Record<string, unknown>;
};

type LocalInformedConsent = {
  id: number;
  patient_id: number;
  vet_id: number | null;
  vet_email: string | null;
  vet_phone: string | null;
  owner_name: string;
  owner_address: string | null;
  owner_phone: string;
  owner_email: string;
  owner_relationship: string | null;
  horse_name: string;
  horse_breed: string | null;
  horse_age: number | null;
  horse_weight: number | null;
  horse_microchip: string | null;
  section_acknowledgments: Record<string, boolean>;
  owner_signature: string | null;
  witness_name: string | null;
  witness_signature: string | null;
  investigator_signature: string | null;
  icf_pdf_url: string | null;
  scanned_document_url: string | null;
  signature_method: 'digital' | 'scanned' | null;
  signed_at: string | null;
  status: 'pending' | 'signed' | 'approved' | 'rejected';
  admin_notes: string | null;
  admin_reviewed_by: string | null;
  admin_reviewed_at: string | null;
  audit_log: AuditEntry[];
  created_at: string;
  updated_at: string;
};

function migrateInvestigatorQual(qual: LocalInvestigatorQual): LocalInvestigatorQual {
  if (!qual.qualifications_data || Object.keys(qual.qualifications_data).length === 0) return qual;
  const blob = qual.qualifications_data;
  return {
    ...qual,
    license_number: qual.license_number ?? (blob.license_number as string | null) ?? (blob.licenseNumber as string | null) ?? null,
    license_state: qual.license_state ?? (blob.license_state as string | null) ?? (blob.licenseState as string | null) ?? null,
    years_experience: qual.years_experience ?? (blob.years_experience as number | null) ?? (blob.yearsExperience as number | null) ?? null,
    laminitis_case_volume_per_year: qual.laminitis_case_volume_per_year ?? (blob.laminitis_case_volume_per_year as number | null) ?? (blob.laminitisCaseVolume as number | null) ?? null,
    prior_clinical_trial_experience: qual.prior_clinical_trial_experience ?? (blob.prior_clinical_trial_experience as boolean | null) ?? (blob.priorTrialExperience as boolean | null) ?? null,
    prior_trials_count: qual.prior_trials_count ?? (blob.prior_trials_count as number | null) ?? (blob.priorTrialsCount as number | null) ?? null,
    gcp_training_completed: qual.gcp_training_completed ?? (blob.gcp_training_completed as boolean | null) ?? (blob.gcpTrainingCompleted as boolean | null) ?? null,
    gcp_quiz_score: qual.gcp_quiz_score ?? (blob.gcp_quiz_score as number | null) ?? (blob.gcpQuizScore as number | null) ?? null,
    facility_inspection_completed: qual.facility_inspection_completed ?? (blob.facility_inspection_completed as boolean | null) ?? (blob.facilityInspectionCompleted as boolean | null) ?? null,
    investigator_agreement_signed: qual.investigator_agreement_signed ?? (blob.investigator_agreement_signed as boolean | null) ?? (blob.investigatorAgreementSigned as boolean | null) ?? null,
    investigator_agreement_signed_at: qual.investigator_agreement_signed_at ?? (blob.investigator_agreement_signed_at as string | null) ?? (blob.investigatorAgreementSignedAt as string | null) ?? null,
    investigator_agreement_signature: qual.investigator_agreement_signature ?? (blob.investigator_agreement_signature as string | null) ?? (blob.investigatorAgreementSignature as string | null) ?? null,
    protocol_signed: qual.protocol_signed ?? (blob.protocol_signed as boolean | null) ?? (blob.protocolSigned as boolean | null) ?? null,
    protocol_signed_at: qual.protocol_signed_at ?? (blob.protocol_signed_at as string | null) ?? (blob.protocolSignedAt as string | null) ?? null,
    protocol_signed_version: qual.protocol_signed_version ?? (blob.protocol_signed_version as string | null) ?? (blob.protocolSignedVersion as string | null) ?? null,
    protocol_signature: qual.protocol_signature ?? (blob.protocol_signature as string | null) ?? (blob.protocolSignature as string | null) ?? null,
    qualification_status: qual.qualification_status ?? (blob.qualification_status as string | null) ?? (blob.qualificationStatus as string | null) ?? null,
  };
}

function getInvestigatorQuals(): LocalInvestigatorQual[] {
  const raw = loadFromStorage<LocalInvestigatorQual[]>(STORAGE_KEYS.investigatorQuals, []);
  return raw.map((q) => ({
    ...migrateInvestigatorQual(q),
    audit_log: q.audit_log ?? [],
    drug_storage_photo_status: q.drug_storage_photo_status ?? (q.drug_storage_photo_url ? 'pending' : null),
    emergency_equipment_photo_status: q.emergency_equipment_photo_status ?? (q.emergency_equipment_photo_url ? 'pending' : null),
    housing_photo_status: q.housing_photo_status ?? (q.housing_photo_url ? 'pending' : null),
    feed_photo_status: q.feed_photo_status ?? (q.feed_photo_url ? 'pending' : null),
  }));
}

function saveInvestigatorQuals(quals: LocalInvestigatorQual[]) {
  saveToStorage(STORAGE_KEYS.investigatorQuals, quals);
}

function buildInvestigatorQualRow(qual: LocalInvestigatorQual, vet: LocalVet | undefined) {
  return {
    ...qual,
    full_name: vet?.full_name ?? null,
    email: vet?.email ?? qual.vet_email ?? null,
    hospital_affiliation: vet?.hospital_affiliation ?? null,
    verification_status: vet?.verification_status ?? null,
  };
}

function getInformedConsents(): LocalInformedConsent[] {
  return loadFromStorage<LocalInformedConsent[]>(STORAGE_KEYS.informedConsents, []);
}

function saveInformedConsents(consents: LocalInformedConsent[]) {
  saveToStorage(STORAGE_KEYS.informedConsents, consents);
}

// ---------------------------------------------------------------------------
// Shipments (NCIE)
// ---------------------------------------------------------------------------
type LocalShipment = {
  id: number;
  shipment_date: string;
  quantity_vials: number;
  quantity_ml_total: number | null;
  batch_lot_number: string;
  expiration_date: string | null;
  shipped_to_site_id: number | null;
  shipped_to_investigator: string | null;
  shipped_to_veterinarian_id: number | null;
  shipped_to_veterinarian_email: string | null;
  shipped_to_veterinarian_name: string | null;
  shipment_status: string;
  carrier: string | null;
  expected_delivery_date: string | null;
  delivered_date: string | null;
  receiving_signature: string | null;
  received_at: string | null;
  condition_on_receipt: string | null;
  storage_temperature_celsius: number | null;
  received_by_clinic_name: string | null;
  received_by_clinic_date: string | null;
  bottles_received_at_clinic: number | null;
  shipment_notes: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
};

function getShipments(): LocalShipment[] {
  ensureDemoData();
  return loadFromStorage<LocalShipment[]>(STORAGE_KEYS.shipments, []);
}

function saveShipments(shipments: LocalShipment[]) {
  saveToStorage(STORAGE_KEYS.shipments, shipments);
}

// ---------------------------------------------------------------------------
// Case Data Builder
// ---------------------------------------------------------------------------
function buildLocalCaseData(patient: LocalPatient) {
  const notes = getNotes().filter((n) => n.patient_id === patient.id);
  const treatments = getTreatments().filter((t) => t.patient_id === patient.id);
  const assessments = getAssessments().filter((a) => a.patient_id === patient.id);
  const labResults = getLabResults().filter((l) => l.patient_id === patient.id);

  return {
    ...patient,
    unique_id: `PTP-102-${String(patient.id).padStart(3, '0')}`,
    protocol_start_time: patient.trial_status === 'enrolled' ? patient.updated_at : null,
    treatments: treatments.sort((a, b) => new Date(a.administration_datetime).getTime() - new Date(b.administration_datetime).getTime()),
    clinical_notes: notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    assessments: assessments.sort((a, b) => new Date(a.assessment_datetime).getTime() - new Date(b.assessment_datetime).getTime()),
    lab_results: labResults.sort((a, b) => new Date(b.test_datetime).getTime() - new Date(a.test_datetime).getTime()),
  };
}

// ---------------------------------------------------------------------------
// Action Name Resolver
// ---------------------------------------------------------------------------
function getActionName(actionName: ActionFactory | string) {
  return typeof actionName === 'function' ? actionName().name : actionName;
}

// =============================================================================
// Exports matching @uibakery/data API
// =============================================================================

export function action(name: string, type: 'SQL' | 'MongoDB' | 'HTTP', config: unknown): ActionConfig {
  return { name, type, config };
}

export function useData(_prop: string, propDefault?: unknown) {
  return propDefault;
}

export function useLoadAction(actionName: ActionFactory | string, defaultValue: unknown[] = [], _params?: unknown) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const paramsKey = JSON.stringify(_params ?? null);

  useEffect(() => {
    const name = getActionName(actionName);
    setLoading(true);

    if (name === 'loadPatients') {
      const loadParams = _params as { status?: string | null } | undefined;
      const status = loadParams?.status;
      const patients = getPatients();
      const filtered = status && status !== 'all'
        ? patients.filter((p) => p.trial_status === status || p.screening_status === status)
        : patients;
      setData(filtered as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadPatientCaseData' || name === 'loadCompletePatientTrialData') {
      const loadParams = _params as { patientId?: number | null } | undefined;
      const patient = getPatients().find((p) => p.id === Number(loadParams?.patientId));
      setData(patient ? [buildLocalCaseData(patient)] as unknown[] : []);
      setLoading(false);
      return;
    }

    if (name === 'loadVeterinarians') {
      setData(getVets() as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadInvestigatorQualification') {
      const loadParams = _params as { vetEmail?: string } | undefined;
      const vets = getVets();
      const quals = getInvestigatorQuals();
      const qual = quals.find((q) => q.vet_email === loadParams?.vetEmail);
      const vet = qual ? vets.find((v) => v.id === qual.veterinarian_id) : undefined;
      setData(qual ? [buildInvestigatorQualRow(qual, vet)] as unknown[] : []);
      setLoading(false);
      return;
    }

    if (name === 'loadAllInvestigatorQualifications') {
      const vets = getVets();
      const quals = getInvestigatorQuals();
      setData(quals.map((q) => buildInvestigatorQualRow(q, vets.find((v) => v.id === q.veterinarian_id))) as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadInformedConsentByPatient') {
      const loadParams = _params as { patientId?: number } | undefined;
      const consents = getInformedConsents().filter((c) => c.patient_id === loadParams?.patientId);
      setData(consents as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadAdminStatistics') {
      const patients = getPatients();
      setData([{
        total_patients: patients.length,
        enrolled_patients: patients.filter((p) => p.trial_status === 'enrolled').length,
        pending_screening: patients.filter((p) => p.screening_status === 'pending_screening').length,
        total_vets: getVets().length,
        pending_vets: getVets().filter((v) => v.verification_status === 'pending').length,
      }] as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadRecentVetActivity') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadAllTrialsData') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadRegulatoryTrialsData') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadAdminComplianceDashboard') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadAuditLogs') {
      const loadParams = _params as {
        startDate?: string | null;
        endDate?: string | null;
        userEmail?: string | null;
        subjectId?: string | null;
        action?: string | null;
        entityType?: string | null;
      } | undefined;
      let logs = getAuditLogs();
      if (loadParams?.startDate) {
        const start = new Date(loadParams.startDate).getTime();
        logs = logs.filter((l) => new Date(l.timestamp).getTime() >= start);
      }
      if (loadParams?.endDate) {
        const end = new Date(loadParams.endDate).getTime();
        logs = logs.filter((l) => new Date(l.timestamp).getTime() <= end);
      }
      if (loadParams?.userEmail) {
        const email = loadParams.userEmail.toLowerCase().trim();
        logs = logs.filter((l) => l.userEmail.toLowerCase().trim() === email);
      }
      if (loadParams?.subjectId) {
        const subject = loadParams.subjectId.toLowerCase().trim();
        logs = logs.filter(
          (l) =>
            l.entityId?.toString() === subject ||
            l.patientId?.toString() === subject ||
            (l.newValue && l.newValue.toLowerCase().includes(subject))
        );
      }
      if (loadParams?.action) {
        logs = logs.filter((l) => l.action === loadParams.action);
      }
      if (loadParams?.entityType) {
        logs = logs.filter((l) => l.entityType === loadParams.entityType);
      }
      const chain = verifyAuditChain(logs);
      setData(logs.map((l, i) => ({ ...l, chainValid: chain.valid && i < chain.firstInvalidIndex })) as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadProtocolVersions') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadSiteQualifications') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadMonitoringVisits') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadFDACorrespondence') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadProtocolDeviations') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadAdverseEvents') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadAllAdverseEvents') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadEnrollmentEligibility') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadInformedConsentByPatient') {
      const loadParams = _params as { patientId?: number } | undefined;
      const consents = getInformedConsents().filter((c) => c.patient_id === loadParams?.patientId);
      setData(consents as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadStudySettings') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadCommunicationMessages') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadNCIEShipments') {
      const allShipments = getShipments();
      setData(allShipments as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadNCIEShipmentsByVet') {
      const loadParams = _params as { vetEmail?: string } | undefined;
      const vetEmail = loadParams?.vetEmail?.toLowerCase().trim() || '';
      const allShipments = getShipments();
      const filtered = allShipments.filter((s) =>
        (s.shipped_to_veterinarian_email && s.shipped_to_veterinarian_email.toLowerCase().trim() === vetEmail) ||
        (s.shipped_to_investigator && s.shipped_to_investigator.toLowerCase().trim() === vetEmail)
      );
      setData(filtered as unknown[]);
      setLoading(false);
      return;
    }

    if (name === 'loadTreatmentOutcomes') {
      setData([]);
      setLoading(false);
      return;
    }

    if (name === 'loadPatientById') {
      const loadParams = _params as { patientId?: number | null } | undefined;
      const patient = getPatients().find((p) => p.id === Number(loadParams?.patientId));
      setData(patient ? [patient] as unknown[] : []);
      setLoading(false);
      return;
    }

    if (name === 'checkVeterinarianAcceptance') {
      const loadParams = _params as { email?: string } | undefined;
      const vet = getVets().find((v) => v.email === loadParams?.email?.toLowerCase().trim());
      setData(vet ? [{
        id: vet.id,
        email: vet.email,
        full_name: vet.full_name,
        accepted: vet.tc_accepted,
        verification_status: vet.verification_status,
        created_at: vet.created_at,
      }] as unknown[] : []);
      setLoading(false);
      return;
    }

    setData(defaultValue);
    setLoading(false);
  }, [actionName, paramsKey]);

  const refresh = useCallback(async () => {
    const name = getActionName(actionName);
    if (name === 'loadPatients') {
      const loadParams = _params as { status?: string | null } | undefined;
      const status = loadParams?.status;
      const patients = getPatients();
      const filtered = status && status !== 'all'
        ? patients.filter((p) => p.trial_status === status || p.screening_status === status)
        : patients;
      setData(filtered as unknown[]);
      return filtered;
    }

    if (name === 'loadPatientCaseData' || name === 'loadCompletePatientTrialData') {
      const loadParams = _params as { patientId?: number | null } | undefined;
      const patient = getPatients().find((p) => p.id === Number(loadParams?.patientId));
      const caseData = patient ? [buildLocalCaseData(patient)] : [];
      setData(caseData as unknown[]);
      return caseData;
    }

    if (name === 'loadVeterinarians') {
      const vets = getVets();
      setData(vets as unknown[]);
      return vets;
    }

    if (name === 'loadInvestigatorQualification') {
      const loadParams = _params as { vetEmail?: string } | undefined;
      const vets = getVets();
      const quals = getInvestigatorQuals();
      const qual = quals.find((q) => q.vet_email === loadParams?.vetEmail);
      const vet = qual ? vets.find((v) => v.id === qual.veterinarian_id) : undefined;
      const result = qual ? [buildInvestigatorQualRow(qual, vet)] : [];
      setData(result as unknown[]);
      return result;
    }

    if (name === 'checkVeterinarianAcceptance') {
      const loadParams = _params as { email?: string } | undefined;
      const vet = getVets().find((v) => v.email === loadParams?.email?.toLowerCase().trim());
      const result = vet ? [{
        id: vet.id,
        email: vet.email,
        full_name: vet.full_name,
        accepted: vet.tc_accepted,
        verification_status: vet.verification_status,
        created_at: vet.created_at,
      }] : [];
      setData(result as unknown[]);
      return result;
    }

    console.info(`Local preview skipped data reload for ${name}.`);
    setData(defaultValue);
    return defaultValue;
  }, [actionName, paramsKey]);

  return [data, loading, error, refresh] as const;
}

export function useMutateAction(actionName: ActionFactory | string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (params?: unknown) => {
      setLoading(true);
      setError(null);
      try {
        const name = getActionName(actionName);
        console.info(`[Mock] Handling mutation: ${name}`);

        // -------------------------------------------------------------------
        // Admin Login
        // -------------------------------------------------------------------
        if (name === 'adminLogin') {
          const loginParams = params as { email?: string; password?: string } | undefined;
          const email = loginParams?.email?.toLowerCase().trim();
          const password = loginParams?.password ?? '';
          const success = email === LOCAL_ADMIN.email && password === LOCAL_ADMIN.password_hash;
          if (success) {
            await recordAudit({
              action: 'LOGIN',
              entityType: 'admin',
              entityId: LOCAL_ADMIN.id,
              userId: email ?? 'unknown',
              userEmail: email ?? 'unknown',
              userRole: 'admin',
              newValue: JSON.stringify({ action: 'admin_login', email }),
            });
            return [LOCAL_ADMIN];
          }
          throw new Error('Invalid admin credentials');
        }

        // -------------------------------------------------------------------
        // Vet Registration
        // -------------------------------------------------------------------
        if (name === 'simpleRegisterVet') {
          const p = params as {
            fullName?: string;
            email?: string;
            phone?: string;
            passwordHash?: string;
            licenseNumber?: string;
            hospitalAffiliation?: string;
            signatureText?: string;
            consentPrintedAt?: string | null;
          };
          const email = p?.email?.toLowerCase().trim();
          if (!email) throw new Error('Email is required');

          const vets = getVets();
          const existing = vets.find((v) => v.email === email);
          if (existing) {
            // Update existing (ON CONFLICT behaviour)
            existing.full_name = p.fullName ?? existing.full_name;
            existing.phone = p.phone ?? existing.phone;
            existing.password_hash = p.passwordHash ?? existing.password_hash;
            existing.license_number = p.licenseNumber ?? existing.license_number;
            existing.hospital_affiliation = p.hospitalAffiliation ?? existing.hospital_affiliation;
            existing.signature_text = p.signatureText ?? existing.signature_text;
            existing.consent_printed_at = p.consentPrintedAt ?? existing.consent_printed_at;
            existing.verification_status = 'pending';
            existing.updated_at = new Date().toISOString();
            saveVets(vets);
            return [existing];
          }

          const newVet: LocalVet = {
            id: vets.length > 0 ? Math.max(...vets.map((v) => v.id)) + 1 : 1,
            full_name: p.fullName ?? '',
            email,
            phone: p.phone ?? null,
            password_hash: p.passwordHash ?? '',
            license_number: p.licenseNumber ?? '',
            hospital_affiliation: p.hospitalAffiliation ?? '',
            tc_accepted: true,
            tc_accepted_at: new Date().toISOString(),
            signature_text: p.signatureText ?? '',
            consent_printed_at: p.consentPrintedAt ?? null,
            verification_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          vets.push(newVet);
          saveVets(vets);
          await recordAudit({
            action: 'REGISTER',
            entityType: 'veterinarian',
            entityId: newVet.id,
            userId: newVet.email,
            userEmail: newVet.email,
            userRole: 'vet',
            newValue: JSON.stringify({ full_name: newVet.full_name, email: newVet.email, license_number: newVet.license_number }),
          });
          return [newVet];
        }

        // -------------------------------------------------------------------
        // Vet Login
        // -------------------------------------------------------------------
        if (name === 'veterinarianLogin') {
          const p = params as { email?: string; password?: string } | undefined;
          const email = p?.email?.toLowerCase().trim();
          const password = p?.password ?? '';
          const vet = getVets().find((v) => v.email === email);
          if (!vet) throw new Error('Invalid email or password');
          // Support both bcrypt hashes (from registration) and plain text (for testing)
          let passwordValid = vet.password_hash === password;
          if (!passwordValid) {
            try {
              passwordValid = await verifyPassword(password, vet.password_hash);
            } catch {
              passwordValid = false;
            }
          }
          if (!passwordValid) throw new Error('Invalid email or password');
          if (vet.verification_status !== 'approved') throw new Error('Account pending approval');
          await recordAudit({
            action: 'LOGIN',
            entityType: 'veterinarian',
            entityId: vet.id,
            userId: vet.email,
            userEmail: vet.email,
            userRole: 'vet',
            newValue: JSON.stringify({ action: 'vet_login', email: vet.email, verification_status: vet.verification_status }),
          });
          return [vet];
        }

        // -------------------------------------------------------------------
        // Check Vet Acceptance / Status
        // -------------------------------------------------------------------
        if (name === 'checkVeterinarianAcceptance') {
          const p = params as { email?: string } | undefined;
          const vet = getVets().find((v) => v.email === p?.email?.toLowerCase().trim());
          return vet ? [{ accepted: vet.tc_accepted, verification_status: vet.verification_status }] : [];
        }

        // -------------------------------------------------------------------
        // Update Vet Verification Status
        // -------------------------------------------------------------------
        if (name === 'updateVetVerificationStatus') {
          const p = params as { email?: string; status?: string } | undefined;
          const vets = getVets();
          const vet = vets.find((v) => v.email === p?.email?.toLowerCase().trim());
          if (vet && p?.status) {
            const oldStatus = vet.verification_status;
            vet.verification_status = p.status as LocalVet['verification_status'];
            vet.updated_at = new Date().toISOString();
            saveVets(vets);
            await recordAudit({
              action: 'UPDATE',
              entityType: 'veterinarian',
              entityId: vet.id,
              userId: getCurrentUserForAudit().userEmail,
              fieldName: 'verification_status',
              oldValue: oldStatus,
              newValue: vet.verification_status,
            });
            return [vet];
          }
          return [];
        }

        // -------------------------------------------------------------------
        // Approve / Reject Veterinarian
        // -------------------------------------------------------------------
        if (name === 'approveVeterinarian' || name === 'rejectVeterinarian') {
          const p = params as { id?: number; vetId?: number } | undefined;
          const vets = getVets();
          const targetId = p?.id ?? p?.vetId;
          const vet = vets.find((v) => v.id === targetId);
          if (vet) {
            const oldStatus = vet.verification_status;
            const newStatus = name === 'approveVeterinarian' ? 'approved' : 'rejected';
            vet.verification_status = newStatus;
            vet.updated_at = new Date().toISOString();
            saveVets(vets);
            await recordAudit({
              action: name === 'approveVeterinarian' ? 'APPROVE' : 'REJECT',
              entityType: 'veterinarian',
              entityId: vet.id,
              fieldName: 'verification_status',
              oldValue: oldStatus,
              newValue: newStatus,
            });
            return [vet];
          }
          return [];
        }

        // -------------------------------------------------------------------
        // Patients
        // -------------------------------------------------------------------
        if (name === 'createPatient') {
          const newPatient = createLocalPatient(params as LocalPatientParams);
          await recordAudit({
            action: 'CREATE',
            entityType: 'patient',
            entityId: newPatient.id,
            patientId: newPatient.id,
            newValue: JSON.stringify({
              horse_name: newPatient.horse_name,
              owner_name: newPatient.owner_name,
              trial_status: newPatient.trial_status,
              enrolled_by_vet_email: newPatient.enrolled_by_vet_email,
            }),
          });
          return [newPatient];
        }

        if (name === 'deletePatient') {
          const p = params as { patientId?: number } | undefined;
          const patients = getPatients();
          const index = patients.findIndex((patient) => patient.id === p?.patientId);
          if (index >= 0) {
            const removed = patients.splice(index, 1);
            savePatients(patients);
            // Also clean up related data
            saveNotes(getNotes().filter((n) => n.patient_id !== p?.patientId));
            saveTreatments(getTreatments().filter((t) => t.patient_id !== p?.patientId));
            saveAssessments(getAssessments().filter((a) => a.patient_id !== p?.patientId));
            saveLabResults(getLabResults().filter((l) => l.patient_id !== p?.patientId));
            await recordAudit({
              action: 'DELETE',
              entityType: 'patient',
              entityId: p?.patientId ?? null,
              patientId: p?.patientId ?? null,
              oldValue: JSON.stringify(removed[0]),
            });
            return removed;
          }
          return [];
        }

        if (name === 'updatePatient') {
          const p = params as { patientId?: number; [key: string]: unknown } | undefined;
          const patients = getPatients();
          const patient = patients.find((pt) => pt.id === p?.patientId);
          if (patient) {
            const oldPatient = JSON.parse(JSON.stringify(patient));
            Object.assign(patient, p, { updated_at: new Date().toISOString() });
            savePatients(patients);
            const changedFields = Object.entries(p || {}).filter(([k, v]) => k !== 'patientId' && oldPatient[k] !== v);
            await recordAudit({
              action: 'UPDATE',
              entityType: 'patient',
              entityId: patient.id,
              patientId: patient.id,
              newValue: JSON.stringify(Object.fromEntries(changedFields)),
              oldValue: JSON.stringify(oldPatient),
              reasonForChange: (p as any)?.reasonForChange ?? null,
            });
            return [patient];
          }
          return [];
        }

        if (name === 'updatePatientFlag') {
          const p = params as { patientId?: number; flagName?: string; flagValue?: unknown } | undefined;
          const patients = getPatients();
          const patient = patients.find((pt) => pt.id === p?.patientId);
          if (patient && p?.flagName) {
            const oldValue = (patient as any)[p.flagName];
            (patient as any)[p.flagName] = p.flagValue;
            patient.updated_at = new Date().toISOString();
            savePatients(patients);
            await recordAudit({
              action: 'UPDATE',
              entityType: 'patient',
              entityId: patient.id,
              patientId: patient.id,
              fieldName: p.flagName,
              oldValue: JSON.stringify(oldValue),
              newValue: JSON.stringify(p.flagValue),
              reasonForChange: (p as any)?.reasonForChange ?? null,
            });
            return [patient];
          }
          return [];
        }

        if (name === 'updateDataLockStatus') {
          const p = params as { patientId?: number; dataLockStatus?: string; reasonForChange?: string } | undefined;
          const patients = getPatients();
          const patient = patients.find((pt) => pt.id === p?.patientId);
          if (patient) {
            const oldValue = (patient as any).data_lock_status ?? 'open';
            const newValue = p?.dataLockStatus ?? 'open';
            (patient as any).data_lock_status = newValue;
            patient.updated_at = new Date().toISOString();
            savePatients(patients);
            await recordAudit({
              action: newValue === 'frozen' ? 'FREEZE' : newValue === 'locked' ? 'LOCK' : 'UNLOCK',
              entityType: 'patient',
              entityId: patient.id,
              patientId: patient.id,
              fieldName: 'data_lock_status',
              oldValue,
              newValue,
              reasonForChange: p?.reasonForChange ?? null,
            });
            return [patient];
          }
          return [];
        }

        // -------------------------------------------------------------------
        // Patient Screening
        // -------------------------------------------------------------------
        if (name === 'approvePatientScreening' || name === 'rejectPatientScreening' || name === 'requestPatientDetails') {
          const p = params as { patientId?: number; adminEmail?: string; notes?: string | null; messageToVet?: string | null; reasonForChange?: string | null } | undefined;
          const patients = getPatients();
          const patient = patients.find((pt) => pt.id === p?.patientId);
          if (!patient) return [];

          const now = new Date().toISOString();
          const admin = p?.adminEmail ?? LOCAL_ADMIN.email;
          const actionName = name === 'approvePatientScreening' ? 'Admit' : name === 'rejectPatientScreening' ? 'Reject' : 'Awaiting Further Details';
          const newStatus = name === 'approvePatientScreening' ? 'approved' : name === 'rejectPatientScreening' ? 'rejected' : 'awaiting_details';
          const newTrialStatus = name === 'approvePatientScreening' ? 'enrolled' : name === 'rejectPatientScreening' ? 'withdrawn' : 'screening';
          const oldStatus = patient.screening_status;
          const oldTrialStatus = patient.trial_status;

          patient.screening_status = newStatus;
          patient.trial_status = newTrialStatus;
          patient.screening_notes = p?.notes ?? null;
          patient.screened_by = admin;
          patient.screened_at = now;
          patient.updated_at = now;

          // Status history
          patient.status_history = patient.status_history ?? [];
          patient.status_history.push({
            status: newStatus,
            timestamp: now,
            admin,
            notes: p?.notes ?? '',
          });

          // Audit log
          patient.audit_log = patient.audit_log ?? [];
          patient.audit_log.push({
            action: actionName,
            user: admin,
            timestamp: now,
            details: p?.notes || p?.messageToVet || `Patient ${newStatus}`,
          });

          savePatients(patients);
          await recordAudit({
            action: name === 'approvePatientScreening' ? 'APPROVE' : name === 'rejectPatientScreening' ? 'REJECT' : 'UPDATE',
            entityType: 'patient',
            entityId: patient.id,
            patientId: patient.id,
            fieldName: 'screening_status',
            oldValue: JSON.stringify({ screening_status: oldStatus, trial_status: oldTrialStatus }),
            newValue: JSON.stringify({ screening_status: newStatus, trial_status: newTrialStatus, notes: p?.notes }),
            reasonForChange: p?.reasonForChange ?? p?.notes ?? null,
          });
          return [patient];
        }

        // -------------------------------------------------------------------
        // Clinical Notes
        // -------------------------------------------------------------------
        if (name === 'addClinicalNote') {
          const p = params as {
            patientId?: number;
            veterinarianName?: string;
            noteType?: string;
            noteContent?: string;
            protocolHour?: number | null;
            videoUrl?: string | null;
            videoFileName?: string | null;
            videoUploadedAt?: string | null;
          };
          const notes = getNotes();
          const newNote: LocalNote = {
            id: notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1,
            patient_id: p?.patientId ?? 0,
            veterinarian_name: p?.veterinarianName ?? 'Unknown',
            note_type: p?.noteType ?? 'observation',
            note_content: p?.noteContent ?? '',
            protocol_hour: p?.protocolHour ?? null,
            video_url: p?.videoUrl ?? null,
            video_file_name: p?.videoFileName ?? null,
            video_uploaded_at: p?.videoUploadedAt ?? null,
            created_at: new Date().toISOString(),
          };
          notes.push(newNote);
          saveNotes(notes);
          await recordAudit({
            action: 'CREATE',
            entityType: 'clinical_note',
            entityId: newNote.id,
            patientId: newNote.patient_id,
            newValue: JSON.stringify({ note_type: newNote.note_type, note_content: newNote.note_content, protocol_hour: newNote.protocol_hour }),
          });
          return [newNote];
        }

        // -------------------------------------------------------------------
        // Treatments
        // -------------------------------------------------------------------
        if (name === 'addTreatment') {
          const p = params as {
            patientId?: number;
            administrationDatetime?: string;
            dosageMg?: number | null;
            route?: string;
            protocolHour?: number | null;
            veterinarianName?: string;
            totalVolumeMl?: number | null;
          };
          const treatments = getTreatments();
          const newTreatment: LocalTreatment = {
            id: treatments.length > 0 ? Math.max(...treatments.map((t) => t.id)) + 1 : 1,
            patient_id: p?.patientId ?? 0,
            administration_datetime: p?.administrationDatetime ?? new Date().toISOString(),
            dosage_mg: p?.dosageMg ?? null,
            route: p?.route ?? 'IV',
            protocol_hour: p?.protocolHour ?? null,
            veterinarian_name: p?.veterinarianName ?? 'Unknown',
            total_volume_ml: p?.totalVolumeMl ?? null,
          };
          treatments.push(newTreatment);
          saveTreatments(treatments);
          await recordAudit({
            action: 'CREATE',
            entityType: 'treatment',
            entityId: newTreatment.id,
            patientId: newTreatment.patient_id,
            newValue: JSON.stringify({
              dosage_mg: newTreatment.dosage_mg,
              route: newTreatment.route,
              protocol_hour: newTreatment.protocol_hour,
              administration_datetime: newTreatment.administration_datetime,
              total_volume_ml: newTreatment.total_volume_ml,
            }),
          });
          return [newTreatment];
        }

        // -------------------------------------------------------------------
        // Assessments
        // -------------------------------------------------------------------
        if (name === 'addClinicalAssessment') {
          const p = params as {
            patientId?: number;
            assessmentDatetime?: string;
            obelGrade?: number | null;
            painScore?: number | null;
            mobilityScore?: number | null;
            digitalPulseScore?: number | null;
            hoofTemperature?: string | null;
            heartRate?: number | null;
            respiratoryRate?: number | null;
            temperature?: number | null;
            clinicalNotes?: string | null;
            veterinarianName?: string;
            protocolHour?: number | null;
          };
          const assessments = getAssessments();
          const newAssessment: LocalAssessment = {
            id: assessments.length > 0 ? Math.max(...assessments.map((a) => a.id)) + 1 : 1,
            patient_id: p?.patientId ?? 0,
            assessment_datetime: p?.assessmentDatetime ?? new Date().toISOString(),
            obel_grade: p?.obelGrade ?? null,
            pain_score: p?.painScore ?? null,
            mobility_score: p?.mobilityScore ?? null,
            digital_pulse_score: p?.digitalPulseScore ?? null,
            hoof_temperature: p?.hoofTemperature ?? null,
            heart_rate: p?.heartRate ?? null,
            respiratory_rate: p?.respiratoryRate ?? null,
            temperature: p?.temperature ?? null,
            clinical_notes: p?.clinicalNotes ?? null,
            veterinarian_name: p?.veterinarianName ?? 'Unknown',
            protocol_hour: p?.protocolHour ?? null,
          };
          assessments.push(newAssessment);
          saveAssessments(assessments);
          await recordAudit({
            action: 'CREATE',
            entityType: 'clinical_assessment',
            entityId: newAssessment.id,
            patientId: newAssessment.patient_id,
            newValue: JSON.stringify({
              obel_grade: newAssessment.obel_grade,
              pain_score: newAssessment.pain_score,
              protocol_hour: newAssessment.protocol_hour,
              assessment_datetime: newAssessment.assessment_datetime,
            }),
          });
          return [newAssessment];
        }

        // -------------------------------------------------------------------
        // Lab Results
        // -------------------------------------------------------------------
        if (name === 'addLabResult') {
          const p = params as {
            patientId?: number;
            testDatetime?: string;
            protocolHour?: number | null;
            wbc?: number | null;
            rbc?: number | null;
            hemoglobin?: number | null;
            hematocrit?: number | null;
            platelets?: number | null;
            glucose?: number | null;
            creatinine?: number | null;
            bun?: number | null;
            alt?: number | null;
            ast?: number | null;
            alkalinePhosphatase?: number | null;
            totalProtein?: number | null;
            albumin?: number | null;
            serumAmyloidA?: number | null;
            fibrinogen?: number | null;
            lactate?: number | null;
            additionalNotes?: string | null;
          };
          const labResults = getLabResults();
          const newResult: LocalLabResult = {
            id: labResults.length > 0 ? Math.max(...labResults.map((l) => l.id)) + 1 : 1,
            patient_id: p?.patientId ?? 0,
            test_datetime: p?.testDatetime ?? new Date().toISOString(),
            protocol_hour: p?.protocolHour ?? null,
            wbc: p?.wbc ?? null,
            rbc: p?.rbc ?? null,
            hemoglobin: p?.hemoglobin ?? null,
            hematocrit: p?.hematocrit ?? null,
            platelets: p?.platelets ?? null,
            glucose: p?.glucose ?? null,
            creatinine: p?.creatinine ?? null,
            bun: p?.bun ?? null,
            alt: p?.alt ?? null,
            ast: p?.ast ?? null,
            alkaline_phosphatase: p?.alkalinePhosphatase ?? null,
            total_protein: p?.totalProtein ?? null,
            albumin: p?.albumin ?? null,
            serum_amyloid_a: p?.serumAmyloidA ?? null,
            fibrinogen: p?.fibrinogen ?? null,
            lactate: p?.lactate ?? null,
            additional_notes: p?.additionalNotes ?? null,
          };
          labResults.push(newResult);
          saveLabResults(labResults);
          await recordAudit({
            action: 'CREATE',
            entityType: 'lab_result',
            entityId: newResult.id,
            patientId: newResult.patient_id,
            newValue: JSON.stringify({
              protocol_hour: newResult.protocol_hour,
              wbc: newResult.wbc,
              serum_amyloid_a: newResult.serum_amyloid_a,
              fibrinogen: newResult.fibrinogen,
              test_datetime: newResult.test_datetime,
            }),
          });
          return [newResult];
        }

        // -------------------------------------------------------------------
        // Investigator Qualifications
        // -------------------------------------------------------------------
        if (name === 'saveInvestigatorQualification') {
          const p = params as Record<string, unknown> | undefined;
          const quals = getInvestigatorQuals();
          const vetEmail = (p?.vetEmail as string) || (p?.email as string) || '';
          const veterinarianId = (p?.veterinarianId as number) || (p?.veterinarian_id as number) || 0;
          const vets = getVets();
          const vet = vetEmail ? vets.find((v) => v.email === vetEmail) : vets.find((v) => v.id === veterinarianId);
          const targetEmail = vet?.email ?? vetEmail;
          const targetVetId = vet?.id ?? veterinarianId;
          const existingIndex = quals.findIndex((q) => q.vet_email === targetEmail);
          const now = new Date().toISOString();

          const fields = {
            license_number: (p?.licenseNumber as string | null) ?? (p?.license_number as string | null) ?? null,
            license_state: (p?.licenseState as string | null) ?? (p?.license_state as string | null) ?? null,
            years_experience: (p?.yearsExperience as number | null) ?? (p?.years_experience as number | null) ?? null,
            laminitis_case_volume_per_year: (p?.laminitisCaseVolume as number | null) ?? (p?.laminitis_case_volume_per_year as number | null) ?? null,
            prior_clinical_trial_experience: (p?.priorTrialExperience as boolean | null) ?? (p?.prior_clinical_trial_experience as boolean | null) ?? null,
            prior_trials_count: (p?.priorTrialsCount as number | null) ?? (p?.prior_trials_count as number | null) ?? null,
            cv_upload_url: (p?.cvUploadUrl as string | null) ?? (p?.cv_upload_url as string | null) ?? null,
            gcp_training_completed: (p?.gcpTrainingCompleted as boolean | null) ?? (p?.gcp_training_completed as boolean | null) ?? null,
            gcp_certificate_url: (p?.gcpCertificateUrl as string | null) ?? (p?.gcp_certificate_url as string | null) ?? null,
            gcp_completion_date: (p?.gcpCompletionDate as string | null) ?? (p?.gcp_completion_date as string | null) ?? null,
            gcp_expiry_date: (p?.gcpExpiryDate as string | null) ?? (p?.gcp_expiry_date as string | null) ?? null,
            gcp_quiz_score: (p?.gcpQuizScore as number | null) ?? (p?.gcp_quiz_score as number | null) ?? null,
            facility_inspection_completed: (p?.facilityInspectionCompleted as boolean | null) ?? (p?.facility_inspection_completed as boolean | null) ?? null,
            facility_inspection_date: (p?.facilityInspectionDate as string | null) ?? (p?.facility_inspection_date as string | null) ?? null,
            drug_storage_photo_url: (p?.drugStoragePhotoUrl as string | null) ?? (p?.drug_storage_photo_url as string | null) ?? null,
            emergency_equipment_photo_url: (p?.emergencyEquipmentPhotoUrl as string | null) ?? (p?.emergency_equipment_photo_url as string | null) ?? null,
            housing_photo_url: (p?.housingPhotoUrl as string | null) ?? (p?.housing_photo_url as string | null) ?? null,
            feed_photo_url: (p?.feedPhotoUrl as string | null) ?? (p?.feed_photo_url as string | null) ?? null,
            housing_comments: (p?.housingComments as string | null) ?? (p?.housing_comments as string | null) ?? null,
            feed_comments: (p?.feedComments as string | null) ?? (p?.feed_comments as string | null) ?? null,
            facility_checklist: (p?.facilityChecklist as Record<string, unknown> | null) ?? (p?.facility_checklist as Record<string, unknown> | null) ?? null,
            investigator_agreement_signed: (p?.investigatorAgreementSigned as boolean | null) ?? (p?.investigator_agreement_signed as boolean | null) ?? null,
            investigator_agreement_signed_at: (p?.investigatorAgreementSignedAt as string | null) ?? (p?.investigator_agreement_signed_at as string | null) ?? null,
            investigator_agreement_signature: (p?.investigatorAgreementSignature as string | null) ?? (p?.investigator_agreement_signature as string | null) ?? null,
            protocol_signed: (p?.protocolSigned as boolean | null) ?? (p?.protocol_signed as boolean | null) ?? null,
            protocol_signed_at: (p?.protocolSignedAt as string | null) ?? (p?.protocol_signed_at as string | null) ?? null,
            protocol_signed_version: (p?.protocolSignedVersion as string | null) ?? (p?.protocol_signed_version as string | null) ?? null,
            protocol_signature: (p?.protocolSignature as string | null) ?? (p?.protocol_signature as string | null) ?? null,
            qualification_status: (p?.qualificationStatus as string | null) ?? (p?.qualification_status as string | null) ?? null,
          };

          if (existingIndex >= 0) {
            const oldQual = JSON.parse(JSON.stringify(quals[existingIndex]));
            quals[existingIndex] = {
              ...quals[existingIndex],
              ...fields,
              veterinarian_id: targetVetId || quals[existingIndex].veterinarian_id,
              vet_email: targetEmail || quals[existingIndex].vet_email,
              updated_at: now,
              qualifications_data: { ...(quals[existingIndex].qualifications_data ?? {}), ...(p ?? {}) },
            };
            saveInvestigatorQuals(quals);
            await recordAudit({
              action: 'UPDATE',
              entityType: 'investigator_qualification',
              entityId: quals[existingIndex].id,
              userId: targetEmail,
              userEmail: targetEmail,
              oldValue: JSON.stringify(oldQual),
              newValue: JSON.stringify(fields),
            });
            return [buildInvestigatorQualRow(quals[existingIndex], vet)];
          }
          const newQual: LocalInvestigatorQual = {
            id: quals.length > 0 ? Math.max(...quals.map((q) => q.id)) + 1 : 1,
            veterinarian_id: targetVetId,
            vet_email: targetEmail,
            status: 'pending',
            created_at: now,
            updated_at: now,
            ...fields,
            qualifications_data: p ?? {},
          };
          quals.push(newQual);
          saveInvestigatorQuals(quals);
          await recordAudit({
            action: 'CREATE',
            entityType: 'investigator_qualification',
            entityId: newQual.id,
            userId: targetEmail,
            userEmail: targetEmail,
            newValue: JSON.stringify({ vet_email: newQual.vet_email, qualification_status: newQual.qualification_status }),
          });
          return [buildInvestigatorQualRow(newQual, vet)];
        }

        if (name === 'approveInvestigatorQualification') {
          const p = params as { vetEmail?: string; veterinarianId?: number } | undefined;
          const quals = getInvestigatorQuals();
          const qual = p?.vetEmail
            ? quals.find((q) => q.vet_email === p.vetEmail)
            : p?.veterinarianId
            ? quals.find((q) => q.veterinarian_id === p.veterinarianId)
            : undefined;
          if (qual) {
            const oldStatus = qual.status;
            qual.status = 'approved';
            qual.qualification_status = 'approved';
            qual.updated_at = new Date().toISOString();
            saveInvestigatorQuals(quals);
            const vet = getVets().find((v) => v.id === qual.veterinarian_id);
            await recordAudit({
              action: 'APPROVE',
              entityType: 'investigator_qualification',
              entityId: qual.id,
              fieldName: 'qualification_status',
              oldValue: oldStatus,
              newValue: 'approved',
            });
            return [buildInvestigatorQualRow(qual, vet)];
          }
          return [];
        }

        if (name === 'rejectInvestigatorQualification') {
          const p = params as { vetEmail?: string; veterinarianId?: number } | undefined;
          const quals = getInvestigatorQuals();
          const qual = p?.vetEmail
            ? quals.find((q) => q.vet_email === p.vetEmail)
            : p?.veterinarianId
            ? quals.find((q) => q.veterinarian_id === p.veterinarianId)
            : undefined;
          if (qual) {
            const oldStatus = qual.status;
            qual.status = 'rejected';
            qual.qualification_status = 'rejected';
            qual.updated_at = new Date().toISOString();
            saveInvestigatorQuals(quals);
            const vet = getVets().find((v) => v.id === qual.veterinarian_id);
            await recordAudit({
              action: 'REJECT',
              entityType: 'investigator_qualification',
              entityId: qual.id,
              fieldName: 'qualification_status',
              oldValue: oldStatus,
              newValue: 'rejected',
            });
            return [buildInvestigatorQualRow(qual, vet)];
          }
          return [];
        }

        // -------------------------------------------------------------------
        // Other mutations (stubs returning empty)
        // -------------------------------------------------------------------
        if (name === 'sendEmailNotification') {
          console.info('[Mock] Email notification skipped:', params);
          return [{ sent: true }];
        }

        if (name === 'createAdverseEvent') {
          const p = params as Record<string, unknown> | undefined;
          console.info('[Mock] Adverse event created (stub):', params);
          await recordAudit({
            action: 'CREATE',
            entityType: 'adverse_event',
            entityId: 1,
            patientId: (p?.patientId as number) ?? null,
            newValue: JSON.stringify(p),
          });
          return [{ id: 1 }];
        }

        if (name === 'createInformedConsent') {
          const p = params as Record<string, unknown> | undefined;
          const consents = getInformedConsents();
          const now = new Date().toISOString();
          const newConsent: LocalInformedConsent = {
            id: consents.length > 0 ? Math.max(...consents.map((c) => c.id)) + 1 : 1,
            patient_id: (p?.patientId as number) ?? 0,
            vet_id: (p?.vetId as number) ?? null,
            vet_email: (p?.vetEmail as string) ?? null,
            vet_phone: (p?.vetPhone as string) ?? null,
            owner_name: (p?.ownerName as string) ?? '',
            owner_address: (p?.ownerAddress as string) ?? null,
            owner_phone: (p?.ownerPhone as string) ?? '',
            owner_email: (p?.ownerEmail as string) ?? '',
            owner_relationship: (p?.ownerRelationship as string) ?? null,
            horse_name: (p?.horseName as string) ?? '',
            horse_breed: (p?.horseBreed as string) ?? null,
            horse_age: (p?.horseAge as number) ?? null,
            horse_weight: (p?.horseWeight as number) ?? null,
            horse_microchip: (p?.horseMicrochip as string) ?? null,
            section_acknowledgments: (p?.sectionAcknowledgments as Record<string, boolean>) ?? {},
            owner_signature: null,
            witness_name: null,
            witness_signature: null,
            investigator_signature: null,
            icf_pdf_url: null,
            scanned_document_url: null,
            signature_method: null,
            signed_at: null,
            status: 'pending',
            admin_notes: null,
            admin_reviewed_by: null,
            admin_reviewed_at: null,
            audit_log: [],
            created_at: now,
            updated_at: now,
          };
          consents.push(newConsent);
          saveInformedConsents(consents);
          // Link to patient
          const patients = getPatients();
          const patient = patients.find((pt) => pt.id === newConsent.patient_id);
          if (patient) {
            patient.consent_id = newConsent.id;
            patient.consent_date = now;
            patient.updated_at = now;
            savePatients(patients);
          }
          await recordAudit({
            action: 'CREATE',
            entityType: 'informed_consent',
            entityId: newConsent.id,
            patientId: newConsent.patient_id,
            newValue: JSON.stringify({ patient_id: newConsent.patient_id, owner_name: newConsent.owner_name, status: newConsent.status }),
          });
          return [newConsent];
        }

        if (name === 'createEnrollmentEligibility') {
          console.info('[Mock] Enrollment eligibility created (stub):', params);
          return [{ id: 1 }];
        }

        if (name === 'createMonitoringVisit') {
          console.info('[Mock] Monitoring visit created (stub):', params);
          return [{ id: 1 }];
        }

        if (name === 'createSiteQualification') {
          console.info('[Mock] Site qualification created (stub):', params);
          return [{ id: 1 }];
        }

        if (name === 'createTreatmentOutcome') {
          console.info('[Mock] Treatment outcome created (stub):', params);
          return [{ id: 1 }];
        }

        if (name === 'createProtocolVersion') {
          const p = params as Record<string, unknown> | undefined;
          console.info('[Mock] Protocol version created (stub):', params);
          await recordAudit({
            action: 'CREATE',
            entityType: 'protocol_version',
            entityId: 1,
            newValue: JSON.stringify({ version: p?.versionNumber, uploadedBy: p?.uploadedBy }),
          });
          return [{ id: 1 }];
        }

        if (name === 'createProtocolDeviation') {
          const p = params as Record<string, unknown> | undefined;
          console.info('[Mock] Protocol deviation created (stub):', params);
          await recordAudit({
            action: 'CREATE',
            entityType: 'system',
            entityId: 1,
            newValue: JSON.stringify(p),
          });
          return [{ id: 1 }];
        }

        if (name === 'createFDAcorrespondence') {
          const p = params as Record<string, unknown> | undefined;
          console.info('[Mock] FDA correspondence created (stub):', params);
          await recordAudit({
            action: 'CREATE',
            entityType: 'system',
            entityId: 1,
            newValue: JSON.stringify(p),
          });
          return [{ id: 1 }];
        }

        if (name === 'createAuditLog') {
          const p = params as AuditPayload | undefined;
          const entry = await recordAudit(p ?? { action: 'SYSTEM', entityType: 'system' });
          return [entry];
        }

        if (name === 'createGoogleOAuthVet') {
          console.info('[Mock] Google OAuth vet created (stub):', params);
          return [{ id: 1 }];
        }

        if (name === 'googleOAuthLogin') {
          console.info('[Mock] Google OAuth login (stub):', params);
          return [{ email: (params as any)?.email }];
        }

        if (name === 'updatePassword') {
          const p = params as Record<string, unknown> | undefined;
          console.info('[Mock] Password updated (stub):', params);
          await recordAudit({
            action: 'UPDATE',
            entityType: 'veterinarian',
            entityId: null,
            userId: (p?.email as string) ?? 'unknown',
            userEmail: (p?.email as string) ?? 'unknown',
            fieldName: 'password_hash',
            oldValue: null,
            newValue: '[REDACTED]',
          });
          return [{ success: true }];
        }

        if (name === 'requestPasswordReset') {
          console.info('[Mock] Password reset requested (stub):', params);
          return [{ success: true }];
        }

        if (name === 'validateResetToken') {
          console.info('[Mock] Reset token validated (stub):', params);
          return [{ valid: true }];
        }

        if (name === 'signInformedConsent') {
          const p = params as Record<string, unknown> | undefined;
          const consents = getInformedConsents();
          const consentId = (p?.consentId as number) ?? (p?.id as number) ?? 0;
          const consent = consents.find((c) => c.id === consentId);
          if (!consent) return [];

          const now = new Date().toISOString();
          consent.owner_signature = (p?.ownerSignature as string) ?? consent.owner_signature;
          consent.witness_name = (p?.witnessName as string) ?? consent.witness_name;
          consent.witness_signature = (p?.witnessSignature as string) ?? consent.witness_signature;
          consent.investigator_signature = (p?.investigatorSignature as string) ?? consent.investigator_signature;
          consent.icf_pdf_url = (p?.icfPdfUrl as string) ?? consent.icf_pdf_url;
          consent.scanned_document_url = (p?.scannedDocumentUrl as string) ?? consent.scanned_document_url;
          consent.signature_method = (p?.signatureMethod as 'digital' | 'scanned') ?? consent.signature_method;
          consent.signed_at = now;
          consent.status = 'signed';
          consent.updated_at = now;
          consent.audit_log.push({
            action: 'Consent Signed',
            user: consent.vet_email || 'Unknown',
            timestamp: now,
            details: `Method: ${consent.signature_method}`,
          });
          saveInformedConsents(consents);
          await recordAudit({
            action: 'UPDATE',
            entityType: 'informed_consent',
            entityId: consent.id,
            patientId: consent.patient_id,
            fieldName: 'status',
            oldValue: 'pending',
            newValue: 'signed',
          });
          return [consent];
        }

        if (name === 'updateStudySettings') {
          const p = params as Record<string, unknown> | undefined;
          console.info('[Mock] Study settings updated (stub):', params);
          await recordAudit({
            action: 'UPDATE',
            entityType: 'system',
            entityId: 1,
            fieldName: 'study_settings',
            newValue: JSON.stringify(p),
          });
          return [{ id: 1 }];
        }

        if (name === 'updateAdminLastLogin') {
          console.info('[Mock] Admin last login updated (stub):', params);
          return [{ id: 1 }];
        }

        if (name === 'updateVetLastLogin') {
          console.info('[Mock] Vet last login updated (stub):', params);
          return [{ id: 1 }];
        }

        if (name === 'sendCommunicationMessage') {
          console.info('[Mock] Communication message sent (stub):', params);
          return [{ id: 1 }];
        }

        if (name === 'createNCIEShipment') {
          const p = params as Record<string, unknown> | undefined;
          const shipments = getShipments();
          const now = new Date().toISOString();
          const newShipment: LocalShipment = {
            id: shipments.length > 0 ? Math.max(...shipments.map((s) => s.id)) + 1 : 1,
            shipment_date: (p?.shipmentDate as string) ?? now,
            quantity_vials: (p?.quantityVials as number) ?? 0,
            quantity_ml_total: (p?.quantityMlTotal as number) ?? null,
            batch_lot_number: (p?.batchLotNumber as string) ?? '',
            expiration_date: (p?.expirationDate as string) ?? null,
            shipped_to_site_id: (p?.shippedToSiteId as number) ?? null,
            shipped_to_investigator: (p?.shippedToInvestigator as string) ?? null,
            shipped_to_veterinarian_id: (p?.shippedToVeterinarianId as number) ?? null,
            shipped_to_veterinarian_email: (p?.shippedToVeterinarianEmail as string) ?? null,
            shipped_to_veterinarian_name: (p?.shippedToVeterinarianName as string) ?? null,
            shipment_status: (p?.shipmentStatus as string) ?? 'pending_dispatch',
            carrier: (p?.carrier as string) ?? null,
            expected_delivery_date: (p?.expectedDeliveryDate as string) ?? null,
            delivered_date: (p?.deliveredDate as string) ?? null,
            receiving_signature: (p?.receivingSignature as string) ?? null,
            received_at: (p?.receivedAt as string) ?? null,
            condition_on_receipt: (p?.conditionOnReceipt as string) ?? null,
            storage_temperature_celsius: (p?.storageTemperatureCelsius as number) ?? null,
            received_by_clinic_name: (p?.receivedByClinicName as string) ?? null,
            received_by_clinic_date: (p?.receivedByClinicDate as string) ?? null,
            bottles_received_at_clinic: (p?.bottlesReceivedAtClinic as number) ?? null,
            shipment_notes: (p?.shipmentNotes as string) ?? null,
            tracking_number: (p?.trackingNumber as string) ?? null,
            created_at: now,
            updated_at: now,
          };
          shipments.push(newShipment);
          saveShipments(shipments);
          await recordAudit({
            action: 'CREATE',
            entityType: 'shipment',
            entityId: newShipment.id,
            newValue: JSON.stringify({
              batch_lot_number: newShipment.batch_lot_number,
              shipped_to_veterinarian_email: newShipment.shipped_to_veterinarian_email,
              shipment_status: newShipment.shipment_status,
            }),
          });
          return [newShipment];
        }

        if (name === 'updateNCIEShipment') {
          const p = params as Record<string, unknown> | undefined;
          const shipments = getShipments();
          const idx = shipments.findIndex((s) => s.id === Number(p?.shipmentId));
          if (idx === -1) return [];
          const now = new Date().toISOString();
          const oldShipment = JSON.parse(JSON.stringify(shipments[idx]));
          shipments[idx] = {
            ...shipments[idx],
            shipment_status: (p?.shipmentStatus as string) ?? shipments[idx].shipment_status,
            received_at: (p?.receivedAt as string) ?? shipments[idx].received_at,
            receiving_signature: (p?.receivingSignature as string) ?? shipments[idx].receiving_signature,
            condition_on_receipt: (p?.conditionOnReceipt as string) ?? shipments[idx].condition_on_receipt,
            storage_temperature_celsius: (p?.storageTemperatureCelsius as number) ?? shipments[idx].storage_temperature_celsius,
            received_by_clinic_name: (p?.receivedByClinicName as string) ?? shipments[idx].received_by_clinic_name,
            received_by_clinic_date: (p?.receivedByClinicDate as string) ?? shipments[idx].received_by_clinic_date,
            bottles_received_at_clinic: (p?.bottlesReceivedAtClinic as number) ?? shipments[idx].bottles_received_at_clinic,
            shipment_notes: (p?.shipmentNotes as string) ?? shipments[idx].shipment_notes,
            delivered_date: (p?.deliveredDate as string) ?? shipments[idx].delivered_date,
            carrier: (p?.carrier as string) ?? shipments[idx].carrier,
            expected_delivery_date: (p?.expectedDeliveryDate as string) ?? shipments[idx].expected_delivery_date,
            tracking_number: (p?.trackingNumber as string) ?? shipments[idx].tracking_number,
            updated_at: now,
          };
          saveShipments(shipments);
          await recordAudit({
            action: 'UPDATE',
            entityType: 'shipment',
            entityId: shipments[idx].id,
            fieldName: 'shipment_status',
            oldValue: JSON.stringify(oldShipment),
            newValue: JSON.stringify(shipments[idx]),
          });
          return [shipments[idx]];
        }

        if (name === 'acceptTermsAndConditions') {
          console.info('[Mock] T&Cs accepted (stub):', params);
          return [{ success: true }];
        }

        if (name === 'debugClinicalNotes') {
          const p = params as { patientId?: number } | undefined;
          return getNotes().filter((n) => n.patient_id === p?.patientId);
        }

        if (name === 'debugVeterinarianData') {
          return getVets();
        }

        if (name === 'exportStudyXml' || name === 'exportStudyFullXml') {
          const p = params as { exportedBy?: string } | undefined;
          const exportedBy = p?.exportedBy ?? getCurrentUserForAudit().userEmail;
          const exportedAt = new Date().toISOString();
          const patients = getPatients();
          const notes = getNotes();
          const treatments = getTreatments();
          const assessments = getAssessments();
          const labResults = getLabResults();

          const exportPatients: XmlExportPatient[] = patients.map((patient) => {
            const patientNotes = notes.filter((n) => n.patient_id === patient.id);
            const patientTreatments = treatments.filter((t) => t.patient_id === patient.id);
            const patientAssessments = assessments.filter((a) => a.patient_id === patient.id);
            const patientLabs = labResults.filter((l) => l.patient_id === patient.id);
            const latestAssessment = [...patientAssessments].sort(
              (a, b) => new Date(b.assessment_datetime).getTime() - new Date(a.assessment_datetime).getTime()
            )[0];
            const vet = getVets().find((v) => v.email === patient.enrolled_by_vet_email);

            return {
              ...patient,
              unique_id: `PTP-102-${String(patient.id).padStart(3, '0')}`,
              veterinarian_name: vet?.full_name ?? patient.enrolled_by_vet_email ?? null,
              veterinarian_email: patient.enrolled_by_vet_email ?? null,
              laminitis_grade: latestAssessment?.obel_grade ?? null,
              treatment_count: patientTreatments.length,
              assessment_count: patientAssessments.length,
              lab_count: patientLabs.length,
              note_count: patientNotes.length,
              treatments: patientTreatments,
              assessments: patientAssessments,
              lab_results: patientLabs,
              clinical_notes: patientNotes,
            };
          });

          const meta = {
            studyId: STUDY_ID,
            studyTitle: STUDY_TITLE,
            sponsorName: SPONSOR_NAME,
            protocolVersion: '1.0',
            exportedAt,
            exportedBy,
          };

          const isFull = name === 'exportStudyFullXml';
          const xmlString = isFull
            ? buildFullXml(meta, exportPatients, getAuditLogs())
            : buildStatisticalXml(meta, exportPatients);

          const filename = `${STUDY_ID}_${isFull ? 'full' : 'statistical'}_${exportedAt.replace(/[-:]/g, '').split('.')[0].replace('T', '_')}.xml`;
          const defineFilename = `${STUDY_ID}_${isFull ? 'full' : 'statistical'}_define_${exportedAt.replace(/[-:]/g, '').split('.')[0].replace('T', '_')}.xml`;
          const defineXml = generateDefineXml(STUDY_ID, exportedAt, exportedBy);

          await recordAudit({
            action: 'EXPORT',
            entityType: 'study_export',
            entityId: null,
            patientId: null,
            studyId: STUDY_ID,
            fieldName: isFull ? 'full_xml' : 'statistical_xml',
            oldValue: null,
            newValue: JSON.stringify({ filename, defineFilename, exportedBy, exportedAt, mode: isFull ? 'full' : 'statistical' }),
            reasonForChange: null,
          });

          return [{ xmlString, filename, defineXml, defineFilename }];
        }

        if (name === 'exportSubmissionPackage') {
          const p = params as { exportedBy?: string } | undefined;
          const exportedBy = p?.exportedBy ?? getCurrentUserForAudit().userEmail;
          const exportedAt = new Date().toISOString();
          const patients = getPatients();
          const notes = getNotes();
          const treatments = getTreatments();
          const assessments = getAssessments();
          const labResults = getLabResults();

          const exportPatients: XmlExportPatient[] = patients.map((patient) => {
            const patientNotes = notes.filter((n) => n.patient_id === patient.id);
            const patientTreatments = treatments.filter((t) => t.patient_id === patient.id);
            const patientAssessments = assessments.filter((a) => a.patient_id === patient.id);
            const patientLabs = labResults.filter((l) => l.patient_id === patient.id);
            const latestAssessment = [...patientAssessments].sort(
              (a, b) => new Date(b.assessment_datetime).getTime() - new Date(a.assessment_datetime).getTime()
            )[0];
            const vet = getVets().find((v) => v.email === patient.enrolled_by_vet_email);

            return {
              ...patient,
              unique_id: `PTP-102-${String(patient.id).padStart(3, '0')}`,
              veterinarian_name: vet?.full_name ?? patient.enrolled_by_vet_email ?? null,
              veterinarian_email: patient.enrolled_by_vet_email ?? null,
              laminitis_grade: latestAssessment?.obel_grade ?? null,
              treatment_count: patientTreatments.length,
              assessment_count: patientAssessments.length,
              lab_count: patientLabs.length,
              note_count: patientNotes.length,
              treatments: patientTreatments,
              assessments: patientAssessments,
              lab_results: patientLabs,
              clinical_notes: patientNotes,
            };
          });

          const meta = {
            studyId: STUDY_ID,
            studyTitle: STUDY_TITLE,
            sponsorName: SPONSOR_NAME,
            protocolVersion: '1.0',
            exportedAt,
            exportedBy,
          };

          const statisticalXml = buildStatisticalXml(meta, exportPatients);
          const fullXml = buildFullXml(meta, exportPatients, getAuditLogs());
          const defineXml = generateDefineXml(STUDY_ID, exportedAt, exportedBy);

          const files: ExportFile[] = [
            {
              content: statisticalXml,
              fileType: 'dataset_statistical',
              ext: 'xml',
              description: 'Per-subject raw numerical data without audit metadata for statistical analysis',
            },
            {
              content: fullXml,
              fileType: 'dataset_fda_audit',
              ext: 'xml',
              description: 'Raw clinical data plus complete immutable audit trail for regulatory audit',
            },
            {
              content: defineXml,
              fileType: 'define',
              ext: 'xml',
              description: 'Data dictionary / README file defining all variables, codelists, units, and sources',
            },
          ];

          const pkg = await buildSubmissionPackage(STUDY_ID, files, exportedAt);

          await recordAudit({
            action: 'EXPORT_SUBMISSION_PACKAGE',
            entityType: 'study_export',
            entityId: null,
            patientId: null,
            studyId: STUDY_ID,
            fieldName: 'submission_package',
            oldValue: null,
            newValue: JSON.stringify({
              filenames: pkg.files.map((f) => f.filename),
              exportedBy,
              exportedAt,
            }),
            reasonForChange: null,
          });

          return [{ ...pkg, exportedAt, exportedBy }];
        }

        if (name === 'testRegistration') {
          return [{ success: true }];
        }

        console.warn(`[Mock] Unhandled mutation: ${name}. Returning empty array.`);
        await recordAudit({
          action: 'SYSTEM',
          entityType: 'system',
          entityId: null,
          fieldName: 'unhandled_mutation',
          newValue: JSON.stringify({ actionName: name, params }),
        });
        return [];
      } catch (err) {
        console.error(`[Mock] Mutation error for ${getActionName(actionName)}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [actionName],
  );

  return [mutate, loading, error] as const;
}

export function triggerEvent(param?: unknown) {
  console.info('Local preview skipped triggerEvent.', param);
}
