-- ============================================================
-- Confirm All Existing and Future Users in Supabase
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/euliewsfbuwybeghnrne/sql/new
-- ============================================================

-- 1. Immediately confirm all existing unconfirmed accounts in auth.users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. Create auto-confirm trigger function for any future signups
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to auth.users BEFORE INSERT so email is ALWAYS confirmed
DROP TRIGGER IF EXISTS trigger_auto_confirm_user ON auth.users;
CREATE TRIGGER trigger_auto_confirm_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auto_confirm_user();
