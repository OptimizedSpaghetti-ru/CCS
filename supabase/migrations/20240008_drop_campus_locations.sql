-- ============================================================
-- Remove legacy campus_locations table
-- NOTE: Uses no CASCADE so migration fails if DB-level dependencies exist.
-- ============================================================

DROP TABLE IF EXISTS public.campus_locations;
