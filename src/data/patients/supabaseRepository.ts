/**
 * Supabase-backed implementation of PatientsRepository.
 *
 * Runs as the currently authenticated user; RLS policies on the `patients`
 * table are expected to permit the caller's role. Verify in staging before
 * flipping VITE_USE_SUPABASE_PATIENTS=true in production.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  PatientCreateInput,
  PatientFlagInput,
  PatientListFilter,
  PatientRow,
  PatientScreeningInput,
  PatientUpdateInput,
  PatientsRepository,
} from './repository';

function isFilterActive(status: string | null | undefined): status is string {
  return typeof status === 'string' && status.length > 0 && status !== 'all';
}

export const supabasePatientsRepository: PatientsRepository = {
  async list(filter?: PatientListFilter): Promise<PatientRow[]> {
    let query = supabase
      .from('patients')
      .select('*')
      .order('enrollment_date', { ascending: false });

    if (filter && isFilterActive(filter.status)) {
      // Mirror the mock semantics: a status filter matches either
      // trial_status OR screening_status.
      query = query.or(
        `trial_status.eq.${filter.status},screening_status.eq.${filter.status}`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`supabasePatientsRepository.list failed: ${error.message}`);
    }
    return data ?? [];
  },

  async getById(id: number): Promise<PatientRow | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`supabasePatientsRepository.getById(${id}) failed: ${error.message}`);
    }
    return data ?? null;
  },

  async create(input: PatientCreateInput): Promise<PatientRow> {
    // Mirror the createPatient action: insert with the listed columns,
    // RETURNING *. The RLS INSERT policy enforces that enrolled_by_vet_email
    // matches the JWT email (unless caller is admin), so the application
    // doesn't need to repeat that check here.
    const { data, error } = await supabase
      .from('patients')
      .insert({
        horse_name: input.horseName,
        age: input.age,
        breed: input.breed,
        weight: input.weight,
        sex: input.sex,
        owner_name: input.ownerName,
        owner_contact: input.ownerContact,
        enrollment_date: input.enrollmentDate ?? new Date().toISOString().slice(0, 10),
        trial_status: input.trialStatus ?? 'screening',
        eligibility_verified: input.eligibilityVerified ?? false,
        consent_date: input.consentDate ?? null,
        digital_pulse: input.digitalPulse ?? null,
        hoof_wall_temperature: input.hoofWallTemperature ?? null,
        coronary_band_condition: input.coronaryBandCondition ?? null,
        hoof_tester_response: input.hoofTesterResponse ?? null,
        stance: input.stance ?? null,
        gait: input.gait ?? null,
        enrollment_heart_rate: input.enrollmentHeartRate ?? null,
        enrollment_respiratory_rate: input.enrollmentRespiratoryRate ?? null,
        enrollment_temperature: input.enrollmentTemperature ?? null,
        body_condition_score: input.bodyConditionScore ?? null,
        profile_picture_url: input.profilePictureUrl ?? null,
        enrolled_by_vet_email: input.enrolledByVetEmail ?? null,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`supabasePatientsRepository.create failed: ${error.message}`);
    }
    return data;
  },

  async update(input: PatientUpdateInput): Promise<PatientRow> {
    // Mirror the updatePatient action. Only assigns columns the caller
    // actually provided, so a partial update never overwrites unrelated
    // fields with null.
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const setIfDefined = (col: string, val: unknown) => {
      if (val !== undefined) patch[col] = val;
    };
    setIfDefined('horse_name', input.horseName);
    setIfDefined('age', input.age);
    setIfDefined('breed', input.breed);
    setIfDefined('weight', input.weight);
    setIfDefined('sex', input.sex);
    setIfDefined('owner_name', input.ownerName);
    setIfDefined('owner_contact', input.ownerContact);
    setIfDefined('trial_status', input.trialStatus);
    setIfDefined('eligibility_verified', input.eligibilityVerified);
    setIfDefined('consent_date', input.consentDate);
    setIfDefined('digital_pulse', input.digitalPulse);
    setIfDefined('hoof_wall_temperature', input.hoofWallTemperature);
    setIfDefined('coronary_band_condition', input.coronaryBandCondition);
    setIfDefined('hoof_tester_response', input.hoofTesterResponse);
    setIfDefined('stance', input.stance);
    setIfDefined('gait', input.gait);
    setIfDefined('enrollment_heart_rate', input.enrollmentHeartRate);
    setIfDefined('enrollment_respiratory_rate', input.enrollmentRespiratoryRate);
    setIfDefined('enrollment_temperature', input.enrollmentTemperature);
    setIfDefined('body_condition_score', input.bodyConditionScore);
    setIfDefined('profile_picture_url', input.profilePictureUrl);

    const { data, error } = await supabase
      .from('patients')
      .update(patch)
      .eq('id', input.patientId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`supabasePatientsRepository.update(${input.patientId}) failed: ${error.message}`);
    }
    return data;
  },

  async updateFlag(input: PatientFlagInput): Promise<PatientRow> {
    const { data, error } = await supabase
      .from('patients')
      .update({
        is_flagged: input.isFlagged,
        flag_reason: input.flagReason,
        flagged_at: input.isFlagged ? new Date().toISOString() : null,
        flagged_by: input.flaggedBy,
      })
      .eq('id', input.patientId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`supabasePatientsRepository.updateFlag(${input.patientId}) failed: ${error.message}`);
    }
    return data;
  },

  async updateScreening(input: PatientScreeningInput): Promise<PatientRow> {
    // Mirrors the approvePatientScreening / rejectPatientScreening /
    // requestPatientDetails SQL actions. RLS patients_update permits admin
    // (app_metadata.role = 'admin'); vets are blocked by policy, which is
    // the intended behaviour — screening is an admin-only action.
    const { data, error } = await supabase
      .from('patients')
      .update({
        screening_status: input.screeningStatus,
        trial_status: input.trialStatus,
        screening_notes: input.notes,
        screened_by: input.adminEmail,
        screened_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.patientId)
      .select('*')
      .single();

    if (error) {
      throw new Error(
        `supabasePatientsRepository.updateScreening(${input.patientId}, ${input.screeningStatus}) failed: ${error.message}`,
      );
    }
    return data;
  },
};
