/**
 * PatientsRepository — single seam between the patients data layer and the
 * rest of the app.
 *
 * Currently consumed only by getPatientsRepository() in ./index. With the
 * VITE_USE_SUPABASE_PATIENTS flag OFF (the default), call sites still go
 * through the existing mock via the UIBakery hook layer; this interface is
 * only exercised when a feature is explicitly migrated to use the repo.
 */

import type { Database } from '@/types/db';

/** Row shape as it actually exists in Supabase. */
export type PatientRow = Database['public']['Tables']['patients']['Row'];

/** Insert shape derived from the live schema. */
export type PatientInsert = Database['public']['Tables']['patients']['Insert'];

/** Update shape derived from the live schema. */
export type PatientUpdate = Database['public']['Tables']['patients']['Update'];

/**
 * Optional filter for list(). Mirrors the parameter the existing
 * `loadPatients` UIBakery action accepts.
 *
 * `status` is matched against either `trial_status` or `screening_status`
 * to preserve the mock's current behaviour
 * (see uibakeryDataMock.ts: useLoadAction 'loadPatients' branch).
 */
export type PatientListFilter = {
  status?: string | null;
};

/** Input shape for createPatient — mirrors the action's `params.*` payload. */
export type PatientCreateInput = {
  horseName: string;
  age: number;
  breed: string;
  weight: number;
  sex: string;
  ownerName: string;
  ownerContact: string;
  enrollmentDate: string | null;
  trialStatus?: string | null;
  eligibilityVerified?: boolean | null;
  consentDate?: string | null;
  digitalPulse?: string | null;
  hoofWallTemperature?: string | null;
  coronaryBandCondition?: string | null;
  hoofTesterResponse?: string | null;
  stance?: string | null;
  gait?: string | null;
  enrollmentHeartRate?: number | null;
  enrollmentRespiratoryRate?: number | null;
  enrollmentTemperature?: number | null;
  bodyConditionScore?: number | null;
  profilePictureUrl?: string | null;
  enrolledByVetEmail?: string | null;
};

/** Input shape for updatePatient — mirrors the action's `params.*` payload. */
export type PatientUpdateInput = {
  patientId: number;
  horseName?: string;
  age?: number;
  breed?: string;
  weight?: number;
  sex?: string;
  ownerName?: string;
  ownerContact?: string;
  trialStatus?: string;
  eligibilityVerified?: boolean;
  consentDate?: string | null;
  digitalPulse?: string | null;
  hoofWallTemperature?: string | null;
  coronaryBandCondition?: string | null;
  hoofTesterResponse?: string | null;
  stance?: string | null;
  gait?: string | null;
  enrollmentHeartRate?: number | null;
  enrollmentRespiratoryRate?: number | null;
  enrollmentTemperature?: number | null;
  bodyConditionScore?: number | null;
  profilePictureUrl?: string | null;
};

/** Input shape for updatePatientFlag. */
export type PatientFlagInput = {
  patientId: number;
  isFlagged: boolean;
  flagReason: string | null;
  flaggedBy: string | null;
};

/** Screening outcome — mirrors the three screening actions. */
export type ScreeningStatus = 'approved' | 'rejected' | 'awaiting_details';

export type PatientScreeningInput = {
  patientId: number;
  screeningStatus: ScreeningStatus;
  trialStatus: 'enrolled' | 'withdrawn' | 'screening';
  notes: string | null;
  adminEmail: string;
};

export interface PatientsRepository {
  /** Returns all patients, optionally filtered by status. */
  list(filter?: PatientListFilter): Promise<PatientRow[]>;

  /** Returns a single patient by numeric id, or null if not found. */
  getById(id: number): Promise<PatientRow | null>;

  /** Creates a new patient. Returns the inserted row. */
  create(input: PatientCreateInput): Promise<PatientRow>;

  /** Updates patient fields. Returns the updated row. */
  update(input: PatientUpdateInput): Promise<PatientRow>;

  /** Sets/clears the flag on a patient. Returns the updated row. */
  updateFlag(input: PatientFlagInput): Promise<PatientRow>;

  /** Updates a patient's screening outcome (admin action). Returns the updated row. */
  updateScreening(input: PatientScreeningInput): Promise<PatientRow>;
}
