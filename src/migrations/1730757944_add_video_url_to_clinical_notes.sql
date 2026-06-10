-- Migration to add video URL field to clinical_notes table
ALTER TABLE clinical_notes
ADD COLUMN video_url TEXT,
ADD COLUMN video_file_name TEXT,
ADD COLUMN video_uploaded_at TIMESTAMPTZ;

CREATE INDEX idx_clinical_notes_video_url ON clinical_notes (video_url);
