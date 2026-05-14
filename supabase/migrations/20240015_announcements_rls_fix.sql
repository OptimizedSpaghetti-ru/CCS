-- ============================================================
-- Migration 20240015: Announcements table RLS hardening
--
-- Purpose:
--   1. Ensure is_it_support_user() helper exists (used in other migrations)
--   2. Guarantee announcements table exists with correct schema
--   3. Re-apply RLS policies cleanly (drop + recreate = idempotent)
--   4. Grant SELECT to authenticated so RLS is the sole gating mechanism
--
-- Safe to run on a DB that already has the table (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ── Helper: is_it_support_user (may be missing on fresh installs) ──
CREATE OR REPLACE FUNCTION public.is_it_support_user()
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
      AND p.role = 'it_support'
      AND p.status = 'approved'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_it_support_user() TO authenticated;

-- ── Ensure announcements table exists ──────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_role text,
  target_audience text,
  category text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ── Role constraints ────────────────────────────────────────
ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_created_by_role_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_created_by_role_check
  CHECK (
    created_by_role IS NULL
    OR created_by_role IN ('student', 'faculty', 'admin', 'it_support')
  );

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_target_audience_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_target_audience_check
  CHECK (
    target_audience IS NULL
    OR target_audience IN ('student', 'faculty', 'admin', 'it_support', 'all')
  );

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS announcements_created_at_idx
  ON public.announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS announcements_target_audience_idx
  ON public.announcements(target_audience);

CREATE INDEX IF NOT EXISTS announcements_published_idx
  ON public.announcements(is_published)
  WHERE is_published = true;

-- ── announcement_id column on notifications ─────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS announcement_id uuid REFERENCES public.announcements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS notifications_announcement_id_idx
  ON public.notifications(announcement_id);

-- ── RLS Policies (drop + recreate for idempotency) ──────────
DROP POLICY IF EXISTS "Users read targeted announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Faculty create student announcements" ON public.announcements;
DROP POLICY IF EXISTS "Faculty update own student announcements" ON public.announcements;
DROP POLICY IF EXISTS "Faculty delete own student announcements" ON public.announcements;
DROP POLICY IF EXISTS "IT Support read targeted announcements" ON public.announcements;

-- All approved authenticated users can read announcements targeted to them or to 'all'.
-- Admins can read everything via the "Admins manage announcements" policy below.
CREATE POLICY "Users read targeted announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND public.current_user_status() = 'approved'
    AND (
      target_audience IS NULL
      OR target_audience = 'all'
      OR target_audience = public.current_user_role()
      OR created_by = auth.uid()
    )
  );

-- Admins have full control over all announcements.
CREATE POLICY "Admins manage announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Faculty can only insert announcements targeting students.
CREATE POLICY "Faculty create student announcements"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty_user()
    AND public.current_user_status() = 'approved'
    AND created_by = auth.uid()
    AND created_by_role = 'faculty'
    AND target_audience = 'student'
  );

-- Faculty can update their own student-targeted announcements.
CREATE POLICY "Faculty update own student announcements"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    public.is_faculty_user()
    AND created_by = auth.uid()
    AND target_audience = 'student'
  )
  WITH CHECK (
    public.is_faculty_user()
    AND created_by = auth.uid()
    AND created_by_role = 'faculty'
    AND target_audience = 'student'
  );

-- Faculty can delete their own student-targeted announcements.
CREATE POLICY "Faculty delete own student announcements"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    public.is_faculty_user()
    AND created_by = auth.uid()
    AND target_audience = 'student'
  );
