-- Storage bucket for deal room documents

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deal-room-documents',
  'deal-room-documents',
  false,
  52428800,
  ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/markdown','image/png','image/jpeg']
);

CREATE POLICY "Owner upload deal docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'deal-room-documents' AND auth.uid() = owner);

CREATE POLICY "Owner or admin read deal docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'deal-room-documents' AND (auth.uid() = owner OR is_admin()));

CREATE POLICY "Owner or admin delete deal docs" ON storage.objects FOR DELETE
  USING (bucket_id = 'deal-room-documents' AND (auth.uid() = owner OR is_admin()));
