/**
 * Mock-backed PatientsRepository.
 *
 * Reads from the same in-memory/localStorage state used by the existing
 * UIBakery mock layer (src/lib/uibakeryDataMock.ts) so the new repository
 * and the legacy `useLoadAction('loadPatients')` hook never diverge while
 * the migration is in flight.
 *
 * Active by default (VITE_USE_SUPABASE_PATIENTS=false).
 */

import { __internalGetPatientsForRepo } from '@/lib/uibakeryDataMock';
import type {
  PatientCreateInput,
  PatientFlagInput,
  PatientListFilter,
  PatientRow,
  PatientScreeningInput,
  PatientUpdateInput,
  PatientsRepository,
} from './repository';

type LocalPatient = ReturnType<typeof __internalGetPatientsForRepo>[number];

/**
 * Coerce a mock LocalPatient into the DB-shaped PatientRow. The mock has
 * legacy/derived fields the DB doesn't (owner_email, audit_log, …) and the
 * DB has fields the mock doesn't track (is_flagged, randomized_group, …).
 * We default the DB-only fields here so consumers can treat all rows as
 * PatientRow uniformly.
 */
function toPatientRow(p: LocalPatient): PatientRow {
  return {
    affected_limbs: p.affected_limbs ?? null,
    age: p.age,
    body_condition_score: p.body_condition_score ?? null,
    breed: p.breed,
    consent_date: p.consent_date ?? null,
    coronary_band_condition: p.coronary_band_condition ?? null,
    created_at: p.created_at,
    data_lock_status: p.data_lock_status ?? null,
    digital_pulse: p.digital_pulse ?? null,
    eligibility_verified: p.eligibility_verified,
    enrolled_by_vet_email: p.enrolled_by_vet_email ?? null,
    enrolled_by_veterinarian_id: null,
    enrollment_date: p.enrollment_date,
    enrollment_heart_rate: p.enrollment_heart_rate ?? null,
    enrollment_icf_id: null,
    enrollment_respiratory_rate: p.enrollment_respiratory_rate ?? null,
    enrollment_temperature: p.enrollment_temperature ?? null,
    exclusion_criteria_notes: null,
    flag_reason: p.flag_reason ?? null,
    flagged_at: null,
    flagged_by: null,
    gait: p.gait ?? null,
    hoof_tester_response: p.hoof_tester_response ?? null,
    hoof_wall_temperature: p.hoof_wall_temperature ?? null,
    horse_name: p.horse_name,
    id: p.id,
    inclusion_criteria_met: null,
    is_flagged: p.is_flagged ?? false,
    laminitis_duration_days: null,
    laminitis_grade: p.laminitis_grade ?? null,
    owner_contact: p.owner_contact,
    owner_name: p.owner_name,
    profile_picture_url: p.profile_picture_url ?? null,
    protocol_start_time: p.protocol_start_time ?? null,
    randomization_date: null,
    randomized_group: null,
    screened_at: p.screened_at ?? null,
    screened_by: p.screened_by ?? null,
    screening_notes: p.screening_notes ?? null,
    screening_status: p.screening_status ?? null,
    sex: p.sex,
    site_id: null,
    stance: p.stance ?? null,
    trial_status: p.trial_status,
    unique_id: p.unique_id ?? null,
    updated_at: p.updated_at,
    weight: p.weight,
  };
}

function isFilterActive(status: string | null | undefined): status is string {
  return typeof status === 'string' && status.length > 0 && status !== 'all';
}

export const mockPatientsRepository: PatientsRepository = {
  async list(filter?: PatientListFilter): Promise<PatientRow[]> {
    const all = __internalGetPatientsForRepo();
    const status = filter?.status;
    const filtered = isFilterActive(status)
      ? all.filter((p) => p.trial_status === status || p.screening_status === status)
      : all;
    return filtered.map(toPatientRow);
  },

  async getById(id: number): Promise<PatientRow | null> {
    const match = __internalGetPatientsForRepo().find((p) => p.id === id);
    return match ? toPatientRow(match) : null;
  },

  // Write paths intentionally throw on the mock repo. With
  // VITE_USE_SUPABASE_PATIENTS=false (default), all write traffic goes
  // through the existing useMutateAction branches in uibakeryDataMock.ts —
  // not through this repository — so these methods are never reached at
  // runtime. They exist only to satisfy the PatientsRepository contract
  // and to fail loudly if someone wires a direct repo write into the mock
  // path by accident.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_input: PatientCreateInput): Promise<PatientRow> {
    throw new Error(
      'mockPatientsRepository.create is not implemented. Writes via the mock layer go through useMutateAction.',
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(_input: PatientUpdateInput): Promise<PatientRow> {
    throw new Error(
      'mockPatientsRepository.update is not implemented. Writes via the mock layer go through useMutateAction.',
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateFlag(_input: PatientFlagInput): Promise<PatientRow> {
    throw new Error(
      'mockPatientsRepository.updateFlag is not implemented. Writes via the mock layer go through useMutateAction.',
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateScreening(_input: PatientScreeningInput): Promise<PatientRow> {
    throw new Error(
      'mockPatientsRepository.updateScreening is not implemented. Writes via the mock layer go through useMutateAction.',
    );
  },
};
