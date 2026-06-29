/**
 * Supabase-backed implementation of ClinicalAssessmentsRepository.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  ClinicalAssessmentCreateInput,
  ClinicalAssessmentRow,
  ClinicalAssessmentsRepository,
} from './repository';

export const supabaseClinicalAssessmentsRepository: ClinicalAssessmentsRepository = {
  async listByPatient(patientId: number): Promise<ClinicalAssessmentRow[]> {
    const { data, error } = await supabase
      .from('clinical_assessments')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessment_datetime', { ascending: true });
    if (error) {
      throw new Error(`supabaseClinicalAssessmentsRepository.listByPatient(${patientId}) failed: ${error.message}`);
    }
    return data ?? [];
  },

  async create(input: ClinicalAssessmentCreateInput): Promise<ClinicalAssessmentRow> {
    const { data, error } = await supabase
      .from('clinical_assessments')
      .insert({
        patient_id: input.patientId,
        assessment_datetime: input.assessmentDatetime,
        veterinarian_name: input.veterinarianName,
        protocol_hour: input.protocolHour ?? null,
        obel_grade: input.obelGrade ?? null,
        pain_score: input.painScore ?? null,
        mobility_score: input.mobilityScore ?? null,
        digital_pulse_score: input.digitalPulseScore ?? null,
        hoof_temperature: input.hoofTemperature ?? null,
        heart_rate: input.heartRate ?? null,
        respiratory_rate: input.respiratoryRate ?? null,
        temperature: input.temperature ?? null,
        clinical_notes: input.clinicalNotes ?? null,
      })
      .select('*')
      .single();
    if (error) {
      throw new Error(`supabaseClinicalAssessmentsRepository.create failed: ${error.message}`);
    }
    return data;
  },
};
