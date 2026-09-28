-- ============================================================
-- Create or Promote an Admin Account for CCS Connect
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/euliewsfbuwybeghnrne/sql/new
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'admin@ccs.olfu.edu.ph';
  v_password text := 'CCSAdmin@2026!';
  v_full_name text := 'CCS Administrator';
  v_encrypted_pw text;
BEGIN
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    -- Generate new UUID for user
    v_user_id := gen_random_uuid();

    -- 1. Insert into auth.users (Pre-confirmed so email confirmation is bypassed)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', v_full_name, 'role', 'admin', 'status', 'approved'),
      now(),
      now(),
      encode(gen_random_bytes(32), 'hex'),
      false
    );

    -- 2. Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );

  ELSE
    -- If user already exists, update password and confirm email
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_build_object('full_name', v_full_name, 'role', 'admin', 'status', 'approved'),
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- 3. Upsert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    approved_at
  ) VALUES (
    v_user_id,
    v_email,
    v_full_name,
    'admin',
    'approved',
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      status = 'approved',
      full_name = EXCLUDED.full_name,
      approved_at = now();

  RAISE NOTICE 'Admin account % ready! You can now log in with password: %', v_email, v_password;
END $$;
