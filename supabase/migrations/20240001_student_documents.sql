-- ============================================================
-- student_documents table
-- Stores uploaded registration card and 1x1 photo URLs for
-- each student account, linked to their profile.
-- ============================================================

CREATE TABLE IF NOT EXISTS student_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reg_card_url    text,
  profile_pic_url text,
  uploaded_at     timestamptz DEFAULT now()
);

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students read own documents" ON student_documents;
DROP POLICY IF EXISTS "Admins read all documents" ON student_documents;
DROP POLICY IF EXISTS "Users insert own documents" ON student_documents;

-- Students can read their own documents
CREATE POLICY "Students read own documents"
  ON student_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all documents
CREATE POLICY "Admins read all documents"
  ON student_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Users can insert their own documents
CREATE POLICY "Users insert own documents"
  ON student_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage policies (REQUIRED to avoid "new row violates policy")
-- Buckets used by code:
--   1) student-documents
--   2) avatar
-- ============================================================

-- NOTE:
-- Create the buckets first in Supabase Storage:
--   - student-documents (public)
--   - avatar (public)

-- Drop all storage policy names we have ever used (idempotent)
DROP POLICY IF EXISTS "student docs insert own folder" ON storage.objects;
DROP POLICY IF EXISTS "student docs update own folder" ON storage.objects;
DROP POLICY IF EXISTS "student docs select own folder" ON storage.objects;
DROP POLICY IF EXISTS "avatar insert own file" ON storage.objects;
DROP POLICY IF EXISTS "avatar update own file" ON storage.objects;
DROP POLICY IF EXISTS "avatar select own file" ON storage.objects;

-- ── avatar bucket ──────────────────────────────────────────
-- Path pattern: {user_id}.{ext}  e.g.  550e8400-….jpg

CREATE POLICY "avatar select own file"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatar'
    AND name LIKE auth.uid()::text || '.%'
  );

CREATE POLICY "avatar insert own file"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatar'
    AND name LIKE auth.uid()::text || '.%'
  );

CREATE POLICY "avatar update own file"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatar'
    AND name LIKE auth.uid()::text || '.%'
  )
  WITH CHECK (
    bucket_id = 'avatar'
    AND name LIKE auth.uid()::text || '.%'
  );

-- ── student-documents bucket ───────────────────────────────
-- Path patterns:
--   reg-cards/{user_id}/reg-card.{ext}
--   profile-pics/{user_id}/profile-pic.{ext}

CREATE POLICY "student docs select own folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      name LIKE 'reg-cards/' || auth.uid()::text || '/%'
      OR name LIKE 'profile-pics/' || auth.uid()::text || '/%'
    )
  );

CREATE POLICY "student docs insert own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (
      name LIKE 'reg-cards/' || auth.uid()::text || '/%'
      OR name LIKE 'profile-pics/' || auth.uid()::text || '/%'
    )
  );

CREATE POLICY "student docs update own folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      name LIKE 'reg-cards/' || auth.uid()::text || '/%'
      OR name LIKE 'profile-pics/' || auth.uid()::text || '/%'
    )
  )
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (
      name LIKE 'reg-cards/' || auth.uid()::text || '/%'
      OR name LIKE 'profile-pics/' || auth.uid()::text || '/%'
    )
  );
