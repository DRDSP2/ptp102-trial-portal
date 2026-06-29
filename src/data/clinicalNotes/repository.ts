/**
 * ClinicalNotesRepository — read/write seam for public.clinical_notes.
 */

import type { Database } from '@/types/db';

export type ClinicalNoteRow = Database['public']['Tables']['clinical_notes']['Row'];

/** Mirrors the `addClinicalNote` action `params.*` payload. */
export type ClinicalNoteCreateInput = {
  patientId: number;
  veterinarianName: string;
  noteType: string;
  noteContent: string;
  protocolHour?: number | null;
  videoUrl?: string | null;
  videoFileName?: string | null;
  videoUploadedAt?: string | null;
  ocrDocumentUrl?: string | null;
  ocrDocumentFileName?: string | null;
  ocrDocumentMimeType?: string | null;
  ocrExtractedText?: string | null;
  ocrProcessedAt?: string | null;
};

export interface ClinicalNotesRepository {
  listByPatient(patientId: number): Promise<ClinicalNoteRow[]>;
  create(input: ClinicalNoteCreateInput): Promise<ClinicalNoteRow>;
}
