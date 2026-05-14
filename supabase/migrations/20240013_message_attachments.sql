ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_size bigint;

DROP POLICY IF EXISTS "message attachments select" ON storage.objects;
DROP POLICY IF EXISTS "message attachments insert" ON storage.objects;

CREATE POLICY "message attachments select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND name LIKE 'messages/%'
  );

CREATE POLICY "message attachments insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND name LIKE 'messages/' || auth.uid()::text || '/%'
  );
