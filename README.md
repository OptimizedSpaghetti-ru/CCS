# CCS Connect Mobile App

This is a code bundle for CCS Connect Mobile App. The original project is available at https://www.figma.com/design/AFzZIAJaQLNnS8etAZ4xmF/CCS-Connect-Mobile-App.

## Running the code

Run `npm i` to install the dependencies.

Copy `.env.example` to `.env` and set your Supabase values.

Run the SQL bootstrap script in Supabase SQL Editor:

- `supabase/sql/001_ccs_connect_init.sql`

Create your initial accounts in Supabase Authentication (manual):

- 1 student account
- 1 admin account

Then set admin privileges in `profiles`:

- `role = 'admin'`
- `status = 'approved'`

Run `npm run dev` to start the development server.

update public.profiles
set role = 'admin', status = 'approved', approved_at = now()
where email = 'admin@yourdomain.com';

update public.profiles
set role = 'student', status = 'approved', approved_at = now()
where email = 'student@yourdomain.com';
