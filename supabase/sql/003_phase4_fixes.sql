-- Phase 4 fixes
-- Run this in Supabase SQL Editor after 002_phase4_additions.sql

-- ─── Fix: Allow approved users to read other approved profiles ──────────
-- The old policy only allowed "self or admin", blocking Compose search,
-- Messages member display, and Chat participant info for normal users.
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_own_or_approved"
on public.profiles
for select
using (
  auth.uid() = id                          -- always see own profile
  or public.is_admin(auth.uid())           -- admins see all
  or (status = 'approved' and auth.uid() is not null)  -- approved users see other approved users
);

-- ─── Fix: Add notification_status to realtime publication ───────────────
do $$
begin
  alter publication supabase_realtime add table public.notification_status;
exception
  when duplicate_object then null;
end $$;
