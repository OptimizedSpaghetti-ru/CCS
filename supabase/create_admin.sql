-- ============================================================
-- CCS Connect Admin Account Setup & Maintenance
-- ============================================================
-- 
-- IMPORTANT:
-- Do NOT manually INSERT into `auth.users` via SQL.
-- Direct inserts cause "Database error querying schema" or
-- "Database error finding user" because Supabase GoTrue Auth
-- requires specific metadata and token fields managed by its API.
--
-- An official admin account has already been generated and verified:
--   Email:    ccs.admin@fatima.edu.ph
--   Password: CCSAdmin@2026!
--   Role:     admin
--   Status:   approved
--
-- ============================================================
-- If you ever need to clean up a corrupted account in SQL Editor:
-- ============================================================
DELETE FROM auth.users WHERE email = 'admin@ccs.olfu.edu.ph';

-- ============================================================
-- If you create any other user via Supabase Dashboard (Auth -> Users)
-- and want to promote them to Admin, run this in SQL Editor:
-- ============================================================
UPDATE public.profiles
SET role = 'admin',
    status = 'approved',
    approved_at = now()
WHERE email = 'ccs.admin@fatima.edu.ph';
