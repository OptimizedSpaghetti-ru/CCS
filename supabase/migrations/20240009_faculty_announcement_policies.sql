-- ============================================================
-- Faculty Announcement Permissions
--
-- Grants faculty users the ability to:
--   1. INSERT announcements targeting students only
--   2. DELETE their own announcements
--
-- Ensures faculty CANNOT:
--   - Target admins or other faculty in announcements
--   - Delete announcements they did not create
--   - Insert announcements with target_role other than 'student'
-- ============================================================

-- Helper: check if current user is faculty
CREATE OR REPLACE FUNCTION public.is_faculty_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'faculty'
      AND p.status = 'approved'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_faculty_user() TO authenticated;

-- ── Faculty INSERT policy ──────────────────────────────────
-- Faculty can post announcements ONLY when target_role = 'student'.
-- This prevents them from targeting admins or other faculty.
DROP POLICY IF EXISTS "Faculty can post student announcements" ON public.notifications;

CREATE POLICY "Faculty can post student announcements"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty_user()
    AND target_role = 'student'
    AND created_by = auth.uid()
  );

-- ── Faculty DELETE policy ──────────────────────────────────
-- Faculty can only delete announcements they personally created.
DROP POLICY IF EXISTS "Faculty can delete own announcements" ON public.notifications;

CREATE POLICY "Faculty can delete own announcements"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    public.is_faculty_user()
    AND created_by = auth.uid()
  );

-- ── Faculty SELECT policy ──────────────────────────────────
-- Faculty can read all notifications (needed for the notifications list).
-- (Admin already has a broader select policy; this ensures faculty can read.)
DROP POLICY IF EXISTS "Faculty can read notifications" ON public.notifications;

CREATE POLICY "Faculty can read notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    public.is_faculty_user()
  );
