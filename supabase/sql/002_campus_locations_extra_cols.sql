-- 002 – Add presentation columns to campus_locations
-- Run in Supabase SQL Editor after 001_ccs_connect_init.sql

alter table public.campus_locations
  add column if not exists floor text,
  add column if not exists building text,
  add column if not exists icon_key text,
  add column if not exists color text;
