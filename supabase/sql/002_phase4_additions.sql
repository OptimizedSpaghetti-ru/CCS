-- Phase 4 schema additions
-- Run this in Supabase SQL Editor after 001_ccs_connect_init.sql

-- ─── Add phone and bio columns to profiles ─────────────────────────────
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists bio text;
-- JSONB for notification preferences (push, message_alerts, etc.)
alter table public.profiles add column if not exists notification_prefs jsonb
  not null default '{"push":true,"message_alerts":true,"announcement_alerts":true,"sound":false,"active_status":true}'::jsonb;

-- ─── Notification read / dismiss tracking (per-user) ───────────────────
create table if not exists public.notification_status (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id         uuid not null references public.profiles(id)      on delete cascade,
  read_at         timestamptz,
  dismissed_at    timestamptz,
  primary key (notification_id, user_id)
);

-- RLS
alter table public.notification_status enable row level security;

create policy "Users can view their own notification status"
  on public.notification_status for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notification status"
  on public.notification_status for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notification status"
  on public.notification_status for update
  using (auth.uid() = user_id);

-- ─── RPC to count unread notifications for a user ──────────────────────
-- Counts notifications targeted at the user (by user_id or by role) that
-- have NOT been read or dismissed.
create or replace function public.count_unread_notifications(p_user_id uuid)
returns bigint
language sql
stable
security definer
as $$
  select count(*)
  from public.notifications n
  left join public.notification_status ns
    on ns.notification_id = n.id and ns.user_id = p_user_id
  where (n.target_user_id = p_user_id
         or n.target_role = (select role from public.profiles where id = p_user_id)
         or (n.target_user_id is null and n.target_role is null))
    and ns.read_at is null
    and ns.dismissed_at is null;
$$;

-- ─── RPC to let a user delete their own account ────────────────────────
-- Cascading via profiles → conversations/messages/etc.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
