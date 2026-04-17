-- ============================================================
-- HIGH-1 & HIGH-2: Add missing RLS policies on profiles table
-- Ensures users can only modify their own rows and cannot
-- escalate their role or approval status.
-- ============================================================

-- Ensure RLS is enabled (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ── SELECT policies ───────────────────────────────────────────

-- Authenticated users can read their own profile
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all profiles (for admin dashboard)
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Approved users can read other approved users' basic info (for chat/compose)
DROP POLICY IF EXISTS "Approved users read approved profiles" ON profiles;
CREATE POLICY "Approved users read approved profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
    )
  );

-- ── INSERT policy ─────────────────────────────────────────────

-- Users can only insert their own profile row
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ── UPDATE policies ───────────────────────────────────────────

-- Regular users can update their own profile but CANNOT change role or status
-- This prevents privilege escalation via direct Supabase client calls.
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent self-promotion: role and status must remain unchanged
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    AND status = (SELECT p.status FROM profiles p WHERE p.id = auth.uid())
  );

-- Admins can update any profile (approve/reject, change role, edit details)
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;
CREATE POLICY "Admins update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );
