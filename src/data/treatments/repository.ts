/**
 * TreatmentsRepository — read/write seam for public.treatments.
 *
 * Companion to PatientsRepository. Migration is gated by
 * VITE_USE_SUPABASE_TREATMENTS. With the flag off, all access goes through
 * the legacy mock dispatcher unchanged.
 */

import type { Database } from '@/types/db';

export type TreatmentRow = Database['public']['Tables']['treatments']['Row'];
export type TreatmentInsert = Database['public']['Tables']['treatments']['Insert'];

/** Mirrors the `addTreatment` action `params.*` payload. */
export type TreatmentCreateInput = {
  patientId: number;
  administrationDatetime: string;
  dosageMg: number;
  route: string;
  veterinarianName: string;
  batchNumber?: string | null;
  immediateReactions?: string | null;
  notes?: string | null;
  protocolHour?: number | null;
  totalVolumeMl?: number | null;
};

export interface TreatmentsRepository {
  listByPatient(patientId: number): Promise<TreatmentRow[]>;
  create(input: TreatmentCreateInput): Promise<TreatmentRow>;
}
