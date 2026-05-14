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

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS announcement_id uuid REFERENCES public.announcements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS announcements_created_at_idx
  ON public.announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS announcements_target_audience_idx
  ON public.announcements(target_audience);

CREATE INDEX IF NOT EXISTS notifications_announcement_id_idx
  ON public.notifications(announcement_id);

DROP POLICY IF EXISTS "Users read targeted announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Faculty create student announcements" ON public.announcements;
DROP POLICY IF EXISTS "Faculty update own student announcements" ON public.announcements;
DROP POLICY IF EXISTS "Faculty delete own student announcements" ON public.announcements;

CREATE POLICY "Users read targeted announcements"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND public.current_user_status() = 'approved'
    AND (
      public.is_admin_user()
      OR target_audience IS NULL
      OR target_audience = 'all'
      OR target_audience = public.current_user_role()
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Admins manage announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

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

CREATE POLICY "Faculty delete own student announcements"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    public.is_faculty_user()
    AND created_by = auth.uid()
    AND target_audience = 'student'
  );

INSERT INTO public.announcements (
  id,
  title,
  body,
  image_url,
  created_by,
  created_by_role,
  target_audience,
  category,
  is_published,
  created_at
)
SELECT
  n.id,
  COALESCE(NULLIF(n.title, ''), 'Announcement'),
  COALESCE(n.body, ''),
  n.image_url,
  n.created_by,
  p.role,
  CASE
    WHEN n.target_role IN ('student', 'faculty', 'admin', 'it_support') THEN n.target_role
    ELSE 'all'
  END,
  CASE WHEN n.type = 'event' THEN 'Event' ELSE 'Announcement' END,
  true,
  n.created_at
FROM public.notifications n
LEFT JOIN public.profiles p ON p.id = n.created_by
WHERE n.type IN ('announcement', 'event')
ON CONFLICT (id) DO NOTHING;

UPDATE public.notifications n
SET announcement_id = n.id
WHERE n.announcement_id IS NULL
  AND n.type IN ('announcement', 'event')
  AND EXISTS (
    SELECT 1
    FROM public.announcements a
    WHERE a.id = n.id
  );
