/**
 * Public entry point for the patients data layer.
 *
 * Call `getPatientsRepository()` from feature code; it returns the live
 * Supabase implementation when VITE_USE_SUPABASE_PATIENTS is enabled and
 * falls back to the mock implementation otherwise.
 *
 * The flag check is re-read on every call so tests can flip it via the
 * window.__FEATURE_FLAGS__ override without re-importing this module.
 */

import { flags } from '@/lib/featureFlags';
import { mockPatientsRepository } from './mockRepository';
import { supabasePatientsRepository } from './supabaseRepository';
import type { PatientsRepository } from './repository';

export function getPatientsRepository(): PatientsRepository {
  return flags.patients ? supabasePatientsRepository : mockPatientsRepository;
}

export type {
  PatientsRepository,
  PatientRow,
  PatientInsert,
  PatientUpdate,
  PatientListFilter,
} from './repository';
