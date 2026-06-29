/**
 * ClinicalAssessmentsRepository — read/write seam for public.clinical_assessments.
 *
 * Note: the live table is named `clinical_assessments`. Earlier in this
 * migration we confirmed there is NO `assessments` table; the mock-level
 * field name `assessments` on the patient bundle is a derived view, not a
 * table reference. This repository uses the real DB name.
 */

import type { Database } from '@/types/db';

export type ClinicalAssessmentRow = Database['public']['Tables']['clinical_assessments']['Row'];

/** Mirrors the `addClinicalAssessment` action `params.*` payload. */
export type ClinicalAssessmentCreateInput = {
  patientId: number;
  assessmentDatetime: string;
  veterinarianName: string;
  protocolHour?: number | null;
  obelGrade?: number | null;
  painScore?: number | null;
  mobilityScore?: number | null;
  digitalPulseScore?: number | null;
  hoofTemperature?: string | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  temperature?: number | null;
  clinicalNotes?: string | null;
};

export interface ClinicalAssessmentsRepository {
  listByPatient(patientId: number): Promise<ClinicalAssessmentRow[]>;
  create(input: ClinicalAssessmentCreateInput): Promise<ClinicalAssessmentRow>;
}
