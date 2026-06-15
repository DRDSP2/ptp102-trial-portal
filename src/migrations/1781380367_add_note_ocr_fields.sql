ALTER TABLE clinical_notes
  ADD COLUMN IF NOT EXISTS ocr_document_url TEXT,
  ADD COLUMN IF NOT EXISTS ocr_document_file_name TEXT,
  ADD COLUMN IF NOT EXISTS ocr_document_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS ocr_extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMPTZ;
