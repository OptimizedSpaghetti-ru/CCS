# CCS Connect Mobile App

This is a code bundle for CCS Connect Mobile App. The original project is available at [Figma](https://www.figma.com/design/AFzZIAJaQLNnS8etAZ4xmF/CCS-Connect-Mobile-App).

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

## Android app export (Capacitor)

This project is configured to export the existing Vite app as a native Android app using Capacitor.

### Prerequisites

- Node.js 20+
- Android Studio (latest stable)
- Android SDK installed via Android Studio
- Java 17 (recommended for Android Gradle plugin compatibility)

Set one of these environment variables to your Android SDK path:

- `ANDROID_HOME`
- `ANDROID_SDK_ROOT`

The build scripts will auto-generate `android/local.properties` from this value.

### Initial setup

Run once to install dependencies:

```bash
npm install
```

### Common Android commands

- Sync latest web build into Android project:

```bash
npm run android:sync
```

- Open the Android project in Android Studio:

```bash
npm run android:open
```

- Build debug APK:

```bash
npm run android:build:debug
```

- Build release AAB (for Play Console upload):

```bash
npm run android:build:release
```

- Generate app icons (Android + iOS) from branding logo:

```bash
npm run icon:generate
```

Icon source file used by this command:

- `public/branding/school-logo.png`

### Output locations

- Debug APK: `android/app/build/outputs/apk/debug/`
- Release AAB: `android/app/build/outputs/bundle/release/`

### Notes

- Each time you change web code, rerun `npm run android:sync` (or any build script that already syncs) before building in Android Studio.
- Supabase env vars are compiled into the web bundle, so ensure `.env` has valid values before running sync/build.

```sql
update public.profiles
set role = 'admin', status = 'approved', approved_at = now()
where email = 'admin@yourdomain.com';

update public.profiles
set role = 'student', status = 'approved', approved_at = now()
where email = 'student@yourdomain.com';
```
