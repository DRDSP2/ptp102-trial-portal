/**
 * Supabase-backed implementation of LabResultsRepository.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  LabResultCreateInput,
  LabResultRow,
  LabResultsRepository,
} from './repository';

export const supabaseLabResultsRepository: LabResultsRepository = {
  async listByPatient(patientId: number): Promise<LabResultRow[]> {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('test_datetime', { ascending: true });
    if (error) {
      throw new Error(`supabaseLabResultsRepository.listByPatient(${patientId}) failed: ${error.message}`);
    }
    return data ?? [];
  },

  async create(input: LabResultCreateInput): Promise<LabResultRow> {
    const { data, error } = await supabase
      .from('lab_results')
      .insert({
        patient_id: input.patientId,
        test_datetime: input.testDatetime,
        protocol_hour: input.protocolHour ?? null,
        wbc: input.wbc ?? null,
        rbc: input.rbc ?? null,
        hemoglobin: input.hemoglobin ?? null,
        hematocrit: input.hematocrit ?? null,
        platelets: input.platelets ?? null,
        glucose: input.glucose ?? null,
        creatinine: input.creatinine ?? null,
        bun: input.bun ?? null,
        alt: input.alt ?? null,
        ast: input.ast ?? null,
        alkaline_phosphatase: input.alkalinePhosphatase ?? null,
        total_protein: input.totalProtein ?? null,
        albumin: input.albumin ?? null,
        serum_amyloid_a: input.serumAmyloidA ?? null,
        fibrinogen: input.fibrinogen ?? null,
        lactate: input.lactate ?? null,
        additional_notes: input.additionalNotes ?? null,
      })
      .select('*')
      .single();
    if (error) {
      throw new Error(`supabaseLabResultsRepository.create failed: ${error.message}`);
    }
    return data;
  },
};
