-- ============================================================
-- Migration: Auto-confirm users
-- Removes the email confirmation requirement permanently
-- ============================================================

-- Confirm all existing unconfirmed accounts in auth.users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Auto-confirm trigger function for future registrations
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users BEFORE INSERT
DROP TRIGGER IF EXISTS trigger_auto_confirm_user ON auth.users;
CREATE TRIGGER trigger_auto_confirm_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auto_confirm_user();
