-- ============================================================
-- Assistance module + IT Support role permissions
-- ============================================================

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

CREATE OR REPLACE FUNCTION public.admin_upsert_created_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_role text,
  p_department text DEFAULT NULL,
  p_year_section text DEFAULT NULL,
  p_program text DEFAULT NULL,
  p_student_id text DEFAULT NULL,
  p_employee_id text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile public.profiles;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Only admins can create managed profiles.';
  END IF;

  IF p_role NOT IN ('student', 'faculty', 'admin', 'it_support') THEN
    RAISE EXCEPTION 'Unsupported role: %', p_role;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    department,
    year_section,
    program,
    student_id,
    employee_id
  )
  VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_role,
    'pending',
    NULLIF(p_department, ''),
    NULLIF(p_year_section, ''),
    NULLIF(p_program, ''),
    NULLIF(p_student_id, ''),
    NULLIF(p_employee_id, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = 'pending',
    department = EXCLUDED.department,
    year_section = EXCLUDED.year_section,
    program = EXCLUDED.program,
    student_id = EXCLUDED.student_id,
    employee_id = EXCLUDED.employee_id,
    approved_by = NULL,
    approved_at = NULL
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_created_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) TO authenticated;

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'profiles'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'faculty', 'admin', 'it_support'));

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'notifications'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%target_role%'
  LOOP
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_target_role_check
  CHECK (
    target_role IS NULL
    OR target_role IN ('student', 'faculty', 'admin', 'it_support')
  );

CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx
  ON public.notifications(recipient_id);

CREATE TABLE IF NOT EXISTS public.assistance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_name text NOT NULL,
  requester_role text NOT NULL CHECK (requester_role IN ('student', 'faculty', 'admin')),
  title text NOT NULL,
  category text NOT NULL CHECK (
    category IN (
      'System/App Error',
      'Broken Computer',
      'Internet Issue',
      'Broken Peripheral',
      'Software Problem',
      'Hardware Problem',
      'Laboratory Equipment Issue',
      'Other Technical Concern'
    )
  ),
  description text NOT NULL,
  location text,
  image_url text,
  priority text NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'In Progress', 'Resolved', 'Rejected/Closed')),
  it_response text,
  assigned_it_support_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS assistance_requests_requester_id_idx
  ON public.assistance_requests(requester_id);

CREATE INDEX IF NOT EXISTS assistance_requests_status_idx
  ON public.assistance_requests(status);

CREATE INDEX IF NOT EXISTS assistance_requests_category_idx
  ON public.assistance_requests(category);

ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Requesters create assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Requesters read own assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "IT support read all assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Admins read all assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "IT support update assistance requests" ON public.assistance_requests;

CREATE POLICY "Requesters create assistance requests"
  ON public.assistance_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND public.current_user_status() = 'approved'
    AND public.current_user_role() IN ('student', 'faculty', 'admin')
    AND requester_role = public.current_user_role()
  );

CREATE POLICY "Requesters read own assistance requests"
  ON public.assistance_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id);

CREATE POLICY "IT support read all assistance requests"
  ON public.assistance_requests
  FOR SELECT
  TO authenticated
  USING (public.is_it_support_user());

CREATE POLICY "Admins read all assistance requests"
  ON public.assistance_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

CREATE POLICY "IT support update assistance requests"
  ON public.assistance_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_it_support_user())
  WITH CHECK (public.is_it_support_user());

DROP POLICY IF EXISTS "assistance evidence select" ON storage.objects;
DROP POLICY IF EXISTS "assistance evidence insert" ON storage.objects;
DROP POLICY IF EXISTS "assistance evidence update" ON storage.objects;

CREATE POLICY "assistance evidence select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND name LIKE 'assistance/%'
    AND (
      name LIKE 'assistance/' || auth.uid()::text || '/%'
      OR public.is_it_support_user()
      OR public.is_admin_user()
    )
  );

CREATE POLICY "assistance evidence insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND name LIKE 'assistance/' || auth.uid()::text || '/%'
    AND public.current_user_role() IN ('student', 'faculty', 'admin')
    AND public.current_user_status() = 'approved'
  );

CREATE POLICY "assistance evidence update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND name LIKE 'assistance/' || auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'student-documents'
    AND name LIKE 'assistance/' || auth.uid()::text || '/%'
  );

DROP POLICY IF EXISTS "Assistance notifications insert" ON public.notifications;
DROP POLICY IF EXISTS "IT support read assistance notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users read direct assistance notifications" ON public.notifications;

CREATE POLICY "Assistance notifications insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_status() = 'approved'
    AND (
      target_role = 'it_support'
      OR recipient_id = auth.uid()
      OR public.is_it_support_user()
    )
  );

CREATE POLICY "IT support read assistance notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    target_role = 'it_support'
    AND public.is_it_support_user()
  );

CREATE POLICY "Users read direct assistance notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());
