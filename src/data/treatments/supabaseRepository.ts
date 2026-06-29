/**
 * Supabase-backed implementation of TreatmentsRepository.
 *
 * Single-table only. The legacy `addTreatment` action also updates
 * patients.protocol_start_time in a CTE; that secondary write is performed
 * sequentially in the mock dispatcher branch when the flag is on, not here,
 * to keep this repository focused on the treatments table.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  TreatmentCreateInput,
  TreatmentRow,
  TreatmentsRepository,
} from './repository';

export const supabaseTreatmentsRepository: TreatmentsRepository = {
  async listByPatient(patientId: number): Promise<TreatmentRow[]> {
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('patient_id', patientId)
      .order('administration_datetime', { ascending: true });
    if (error) {
      throw new Error(`supabaseTreatmentsRepository.listByPatient(${patientId}) failed: ${error.message}`);
    }
    return data ?? [];
  },

  async create(input: TreatmentCreateInput): Promise<TreatmentRow> {
    const { data, error } = await supabase
      .from('treatments')
      .insert({
        patient_id: input.patientId,
        administration_datetime: input.administrationDatetime,
        dosage_mg: input.dosageMg,
        route: input.route,
        veterinarian_name: input.veterinarianName,
        batch_number: input.batchNumber ?? null,
        immediate_reactions: input.immediateReactions ?? null,
        notes: input.notes ?? null,
        protocol_hour: input.protocolHour ?? null,
        total_volume_ml: input.totalVolumeMl ?? null,
      })
      .select('*')
      .single();
    if (error) {
      throw new Error(`supabaseTreatmentsRepository.create failed: ${error.message}`);
    }
    return data;
  },
};
