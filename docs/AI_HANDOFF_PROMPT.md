# CCS Connect — prompt for the next AI

Copy the prompt below into the next AI chat, or give the AI this file and ask it to read it before working. Transfer this file with the repository. The repository path can change; all paths below are relative to its root.

---

You are taking over development of **CCS Connect**, an existing campus communication and assistance app. Help me continue developing it with minimal repetition and without breaking working features. Treat this as a handoff of an existing project. A new workspace or AI does not imply permission to rewrite the app, change its stack, migrate its database, or redesign its screens.

## Start here

1. Find the project root and read applicable `AGENTS.md` or equivalent instructions if present. Check Git status, branch, and recent commits before editing. Preserve my existing work.
2. Read this handoff, `package.json`, `README.md`, and the feature docs listed below. Then inspect the source files relevant to my next request. Read the actual implementation rather than guessing from filenames.
3. Briefly explain your understanding of the project and any material setup gaps. If I supplied a task, continue with it. If I only supplied this handoff, familiarize yourself with the project and wait for my next task; do not make unsolicited changes.

This handoff was prepared on **October 27, 2026**, from `C:\Users\ASUS\CCS`. The branch at that time was `QR-CODE`, with HEAD `16a4d402` (remove the unused App Version setting). The working tree was clean before adding this document. These are reference points, not instructions to switch branches or reset files. Recheck the current checkout.

## What the app does

CCS Connect serves students, faculty, IT Support, and administrators in a College of Computer Studies environment. It includes:

- Supabase authentication, registration, document uploads, persistent sessions, and account approval.
- Direct and group messaging, attachments, unread state, and realtime updates.
- Announcements, in-app notifications, and Android local notification support.
- Assistance requests and an IT Support queue.
- Admin account management, document review, announcements, and analytics/export.
- Campus location search and an interactive indoor map for Saint Benedict Hall, including 11 room QR checkpoints.
- Profiles, settings, help, legal pages, light/dark/system themes, animated startup, and connection-loss recovery.

## Stack and architecture

- React 18, TypeScript, Vite 6, React Router 7, Tailwind CSS 4, Radix UI primitives, Lucide icons, Motion, and Recharts. Some MUI dependencies also exist; follow the component being edited.
- Supabase JS 2 supplies Auth, Postgres, Storage, RPCs, and Realtime. Keep the real backend integration.
- Capacitor 8 packages the shared web app for Android. An iOS project exists, but its existence is not proof of tested iPhone behavior.
- `qr-scanner` decodes camera frames locally; `qrcode` generates printable assets.
- npm and `package-lock.json` are the existing dependency workflow. The package still has a Figma-generated name; that does not mean the app is a disposable prototype.
- The Vite `@` alias points to `src`. Retain the React and Tailwind Vite plugins and the existing offline-shell plugin.

Key files:

| Area | Start with |
| --- | --- |
| Entry, startup, shell | `src/main.tsx`, `src/app/App.tsx` |
| Routes and access | `src/app/routes.ts`, `src/app/components/guards/AuthGuards.tsx` |
| Shared auth/profile/data state | `src/app/context/AppContext.tsx` |
| Supabase client/session storage | `src/lib/supabase.ts` |
| Screens and shared components | `src/app/screens/`, `src/app/components/`, `src/app/components/ui/` |
| Design tokens and bundled fonts | `src/app/theme.ts`, `src/styles/`, `public/fonts/` |
| Connection detection and requests | `src/lib/connectivity.ts`, `src/lib/connectedFetch.ts`, `src/app/components/OfflineBoundary.tsx` |
| Production startup | `src/app/components/StartupSplashScreen.tsx`, `src/standalone/splash/AnimatedSplashScreen.tsx` |
| Map and room QR | `src/app/screens/MapView.tsx`, `src/app/screens/Map.tsx`, `src/app/components/RoomQrScanner.tsx`, `src/lib/room-checkpoints.ts` |
| Campus geometry/location data | `src/data/indoorMapData.js`, `src/data/buildingMapData.js`, `src/data/campusLocations.ts` |
| Mobile notifications | `src/lib/mobileNotifications.ts` |
| Native Android bridge | `android/app/src/main/java/com/ccs/connect/MainActivity.java` |
| Backend changes | `supabase/migrations/` |
| Build, verification, QR generation | `scripts/`, `package.json` |
| Hosting/native configuration | `vercel.json`, `vite.config.ts`, `capacitor.config.ts` |

`guidelines/Guidelines.md` is currently a mostly commented template. Do not interpret its sample rules as an established project design specification.

## Behavior to preserve

**Authentication and authorization**

- Role values are `student`, `faculty`, `admin`, and `it_support`; profile status values include `pending`, `approved`, and `rejected`.
- Login currently requires an email address. Registration and admin creation are separate flows; inspect their existing behavior before changing either.
- `/app` is protected by approval checks. Admin, faculty, and IT Support areas have additional role guards. Guarding navigation alone does not secure database access: sensitive functionality also needs Supabase policies or authorized backend logic.
- Supabase auth storage uses `ccs-connect-auth`: localStorage on web, Capacitor Preferences with a localStorage fallback/mirror on native. Preserve persistence, callback handling, and recovery behavior. Do not clear sessions as a routine connectivity fix.
- Email confirmation and application account approval are different. Do not auto-approve users or run bulk confirmation/admin SQL as a setup shortcut.
- Never expose service-role keys, database passwords, access tokens, real user passwords, or personal account lists in browser code, commits, logs, prompts, or handoff documents.
- Admin actions must work securely through the real backend. Inspect their RPCs/policies rather than adding cosmetic buttons or frontend-only permission checks.

**Design and existing product decisions**

- Preserve the established burgundy/maroon and cream brand, responsive layouts, bottom navigation, accessibility, and theme support. Make scoped changes unless I request a redesign.
- Use existing semantic tokens in `src/app/theme.ts`. `fonts.display` uses locally bundled Space Grotesk; `fonts.ui` uses locally bundled DM Sans. Retain font files and license files. Do not reintroduce remote-font dependencies for these roles.
- Active Now / Activity Status presence UI was intentionally removed. Do not restore it incidentally or remove messaging/realtime functionality while touching related screens.
- The App Version setting row was intentionally removed.
- If I ask for a standalone preview or say “do not integrate yet,” keep the result independent until I request integration.

**Startup and offline recovery**

- Production uses an SVG/CSS animated startup, not the old MP4 wrapper. Preserve the supplied school logo, native maroon handoff, auth/destination readiness gating, lifecycle pause/resume, and retry recovery. Read `docs/ANIMATED_SPLASH.md`; `docs/VIDEO_SPLASH.md` describes an older approach.
- `OfflineBoundary` keeps the existing page mounted while showing the full-screen offline interface. Reconnection preserves input, route, and stored auth rather than reloading the page.
- Connectivity is checked with independent reachability probes. `navigator.onLine` alone is insufficient; HTTP errors can still prove transport reachability. Slow probes alone must not force an offline state.
- The connected fetch adapter can wait and retry interrupted reads with bounded retries. It deliberately does not replay mutations; avoid duplicate sends, saves, or account actions.
- Production web caches the public app shell through a generated service worker. It excludes API responses, tokens, and user data. Web offline opening requires a previous successful cache installation; Android bundles its shell. An available shell does not mean backend operations or maps are usable offline.

**Room QR checkpoints**

- Exactly 11 destinations: Computer Labs 1-5, EMC Laboratory, and Rooms 501-505. Stable payload example: `/app/map?view=indoor&room=room-501`.
- Floors and room names come from shared indoor geometry in `src/data/indoorMapData.js`. EMC Laboratory retains the legacy stable ID `soci`, its geometry and its existing map color; its search category is laboratory.
- A scan selects, centers, and highlights a room, without moving the stored location pin or automatically starting a route. The five floor buttons and ordinary floor links remain available. The scanner rejects floor-only codes.
- Validate the exact route, same origin, allowed room ID, and exact query shape. Never navigate to arbitrary scanned URLs or accept a floor supplied alongside a room.
- Preserve pending room selection through login/approval with `rememberMapCheckpoint` and `consumeMapCheckpoint`. Approval remains required.
- Request the camera only when opening the scanner; stop it on success, close, and backgrounding. Preserve manual floor selection and explicit Resume Camera behavior.
- Camera frames stay local. Web camera access requires HTTPS or localhost. Android permissions/plugins are unchanged. OS camera-to-app links are not configured.
- Printable PNGs/SVGs and `print.html` live in `public/room-qr/`. Regenerate with `npm.cmd run qr:generate`. Obsolete floor assets have been retired.

## Read these feature docs

- `docs/indoor-room-interactions.md` for the room input layer. Keep the CSS 3D wrapper noninteractive and the SVG interactive; use visible room faces rather than overlapping padded rectangles. Touch completion resolves the room at actual screen coordinates and excludes drag/pinch gestures.
- `docs/ANIMATED_SPLASH.md`
- `docs/offline-recovery.md`
- `docs/room-qr-checkpoints.md`
- `preview/splash/README.md` when working on the independent animation preview.
- `guidelines/BREVO_SMTP_SETUP.md` only when working on email configuration.

Floor scanning was added October 24 and replaced by room scanning October 27. Use current source and focused feature docs to resolve conflicts. Treat old specs/plans as historical context and verify their implementation before assuming work is still pending.

## Setup after transferring the codebase

Keep the source, `public/`, `assets/`, native Android/iOS source, `scripts/`, `supabase/`, docs, configuration, and lockfile. Preserve Git history when available. Dependencies, build output, SDK paths, credentials, and release-signing material need separate handling; copying the repository does not transfer hosted Supabase data or settings.

The frontend expects these variables in a local `.env` or the hosting environment:

```dotenv
VITE_SUPABASE_URL=<existing-project-url>
VITE_SUPABASE_ANON_KEY=<existing-project-anon-key>
```

Use the existing project configuration supplied privately. Do not replace missing credentials with fake data or create a new backend unless I request it. Do not print `.env` contents. `VITE_*` values are bundled into the client; privileged secrets do not belong there.

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if execution policy blocks the `.ps1` shims:

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Use separate terminals for servers and verification scripts. The inspected machine had Node `v24.19.0` and npm `11.17.0`; use a compatible runtime supporting the repository's `--experimental-strip-types` tests. Do not treat the README's older minimum-version text as a verified toolchain matrix.

If only the code location changes, preserve the existing Supabase project. If I explicitly request a new Supabase project, first inventory the live schema, RLS, RPCs, triggers, Auth settings/redirect URLs, Storage buckets/policies/files, Realtime, and data-transfer requirements. The migration folder contains incremental changes, not a verified complete backend bootstrap. For example, the frontend calls `admin_update_user_password` and `admin_delete_user`, but their definitions were not found in the checked-in migrations. Two migration files also share the `20240016` prefix. Reconcile migration history with the target before applying anything; do not blindly replay SQL or invent missing production definitions.

## Validation commands and limits

Choose checks that cover the change. Inspect script prerequisites before running them. Documentation-only work does not require rebuilding Android.

```powershell
# Node tests and production bundle
npm.cmd test
npm.cmd run build

# Targeted Node tests
npm.cmd run test:connectivity
npm.cmd run test:room-qr

# With the dev server running on 127.0.0.1:5173
node scripts/verify-startup-splash.mjs
npm.cmd run verify:room-qr
npm.cmd run verify:room-qr-assets

# For offline browser checks: run this server in a separate terminal
npx.cmd vite preview --host 127.0.0.1 --port 4173
# Then run against that production preview
node scripts/verify-offline.mjs

# Android: build, sync, prepare the local SDK path, assemble
npm.cmd run build
npx.cmd cap sync android
node scripts/prepare-android-sdk.mjs
node scripts/run-gradle.mjs assembleDebug
```

Browser verification scripts currently launch installed Microsoft Edge through Playwright. Some support `CCS_PLAYWRIGHT_MODULE` or URL overrides; inspect each script rather than assuming every script has the same options. These are environment prerequisites, not reasons to change app behavior.

Android identity: app ID `com.ccs.connect`, app name `CCS Connect`, web directory `dist`. Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Configure a compatible JDK and Android SDK for the checked-in Gradle/Capacitor versions. The SDK preparation script regenerates machine-specific `android/local.properties`.

For Android startup/offline/QR changes, install the APK and launch it on a booted, authorized test emulator before using:

```powershell
node scripts/verify-android-startup.mjs
node scripts/verify-android-offline.mjs
npm.cmd run verify:android-room-qr
```

These scripts can temporarily alter emulator network, auth-storage, or permission state; inspect them and use an isolated test emulator. If I ask whether the APK contains the latest work, inspect its packaged JS/assets and compare them with `dist` and synchronized Android assets. A successful web build or Capacitor sync alone does not prove APK parity.

There are no configured `lint` or `typecheck` npm scripts. A Vite build does not prove TypeScript correctness. Feature docs record earlier unrelated broad type-check errors involving shadow tokens, Android bridge declarations, analytics/profile/map typing, and entry configuration; recheck before declaring those errors current or blaming your changes. Do not fix unrelated issues automatically.

Existing docs report earlier successful browser/emulator checks, but those are historical results. Distinguish checks you ran now from documented evidence. Mocked fixture sessions do not prove real-account login, hosted writes, token refresh, physical-device performance, or printed QR readability. Physical camera/label checks and iOS behavior need their own validation.

The room QR update changes the Vercel camera policy to `camera=(self)` so the web scanner can request the camera. Hosted response headers and hosted scanning still require deployment verification; local fixtures cannot certify them.

## How I want to work

- When I give a clear implementation request or say “execute” / “let's go,” do the work through appropriate verification. Make routine decisions without repeatedly asking for confirmation.
- Preserve existing screens, data, and unrelated behavior. Avoid speculative refactors, broad dependency upgrades, new frameworks, or generic redesigns.
- “Functional” means a real UI-to-backend flow with permissions and error handling. Keep real queries, uploads, subscriptions, notifications, and authorization connected.
- If I ask only to analyze, audit, or familiarize yourself, inspect and report without editing.
- Never silently resolve conflicting user records, change account approval states, or modify unrelated production data.
- Ask a focused question only when a material requirement is missing and cannot be inferred from code or available context. Continue independent work while waiting when possible.
- Keep progress updates concise. When finishing, state what changed, what you actually verified, and any remaining blocker. Be explicit about local checks versus browser, emulator, physical-device, or hosted verification.

**My next task:** If I included a task with this prompt, carry it out. Otherwise, finish familiarization and wait for my next instruction.
