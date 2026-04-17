-- ============================================================
-- HIGH-4 (server-side complement): Add DELETE policies for
-- storage objects so users can replace their own uploads.
-- MEDIUM-2: Allow students to delete their own documents.
--
-- NOTE: Bucket-level MIME type and size restrictions must be
-- configured in the Supabase Dashboard under Storage settings:
--   student-documents: max 5MB, allowed MIME types image/*
--   avatar: max 5MB, allowed MIME types image/*
-- ============================================================

-- ── avatar bucket – DELETE policy ─────────────────────────────
DROP POLICY IF EXISTS "avatar delete own file" ON storage.objects;

CREATE POLICY "avatar delete own file"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatar'
    AND name LIKE auth.uid()::text || '.%'
  );

-- ── student-documents bucket – user DELETE policy ─────────────
DROP POLICY IF EXISTS "student docs delete own folder" ON storage.objects;

CREATE POLICY "student docs delete own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      name LIKE 'reg-cards/' || auth.uid()::text || '/%'
      OR name LIKE 'profile-pics/' || auth.uid()::text || '/%'
    )
  );

-- ── Notification image SELECT for all authenticated users ─────
-- Non-admins need to be able to VIEW notification images
-- (the insert/update/delete for notifications/ path is admin-only,
--  defined in migration 20240004)
DROP POLICY IF EXISTS "authenticated read notification files" ON storage.objects;

CREATE POLICY "authenticated read notification files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND name LIKE 'notifications/%'
  );

-- ── Admin SELECT for student documents (review during approval) ──
DROP POLICY IF EXISTS "admin read student documents" ON storage.objects;

CREATE POLICY "admin read student documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      name LIKE 'reg-cards/%'
      OR name LIKE 'profile-pics/%'
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );
