/**
 * LabResultsRepository — read/write seam for public.lab_results.
 */

import type { Database } from '@/types/db';

export type LabResultRow = Database['public']['Tables']['lab_results']['Row'];

/** Mirrors the `addLabResult` action `params.*` payload. */
export type LabResultCreateInput = {
  patientId: number;
  testDatetime: string;
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

export interface LabResultsRepository {
  listByPatient(patientId: number): Promise<LabResultRow[]>;
  create(input: LabResultCreateInput): Promise<LabResultRow>;
}
