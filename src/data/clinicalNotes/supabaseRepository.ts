/**
 * Supabase-backed implementation of ClinicalNotesRepository.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  ClinicalNoteCreateInput,
  ClinicalNoteRow,
  ClinicalNotesRepository,
} from './repository';

export const supabaseClinicalNotesRepository: ClinicalNotesRepository = {
  async listByPatient(patientId: number): Promise<ClinicalNoteRow[]> {
    const { data, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true });
    if (error) {
      throw new Error(`supabaseClinicalNotesRepository.listByPatient(${patientId}) failed: ${error.message}`);
    }
    return data ?? [];
  },

  async create(input: ClinicalNoteCreateInput): Promise<ClinicalNoteRow> {
    const { data, error } = await supabase
      .from('clinical_notes')
      .insert({
        patient_id: input.patientId,
        veterinarian_name: input.veterinarianName,
        note_type: input.noteType,
        note_content: input.noteContent,
        protocol_hour: input.protocolHour ?? null,
        video_url: input.videoUrl ?? null,
        video_file_name: input.videoFileName ?? null,
        video_uploaded_at: input.videoUploadedAt ?? null,
        ocr_document_url: input.ocrDocumentUrl ?? null,
        ocr_document_file_name: input.ocrDocumentFileName ?? null,
        ocr_document_mime_type: input.ocrDocumentMimeType ?? null,
        ocr_extracted_text: input.ocrExtractedText ?? null,
        ocr_processed_at: input.ocrProcessedAt ?? null,
      })
      .select('*')
      .single();
    if (error) {
      throw new Error(`supabaseClinicalNotesRepository.create failed: ${error.message}`);
    }
    return data;
  },
};
