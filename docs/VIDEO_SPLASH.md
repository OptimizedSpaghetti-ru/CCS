# Video splash startup

`AppStartup` mounts once inside `AppProvider`, outside the router and its refresh/theme remounts. Supabase session and profile initialization run while `VideoSplashScreen` plays the bundled MP4. The original MP4 is copied without re-encoding; the JPEG poster is its first frame.

Playback completion uses `ended`. The final frame remains visible until authentication finishes, then the existing destination mounts behind a 250 ms fade. Approved sessions open Home, pending sessions retain the existing approval guard, and logged-out launches open the existing welcome screen. Password-recovery callbacks retain their URL and existing routing.

Navigation and background/resume do not remount the splash. Resuming interrupted playback continues at the saved video position. A fresh document/WebView launch plays again. Video load errors, rejected autoplay, and 15 seconds without playback progress release the video gate while still waiting for authentication. Timers suspend while the document is hidden.

The fixed video uses `object-fit: cover`: it fills the viewport without distortion or borders, cropping edges on screens with a different aspect ratio. The first-frame poster is present in the initial HTML before React loads. Android launch and WebView backgrounds use a matching dark red; the default native icon is transparent. Capacitor's existing WebView configuration already permits media playback without a gesture. No splash plugin or production dependency was added.

## Verification

Build and synchronize:

```powershell
npm.cmd run build
npx.cmd cap sync android
node scripts/prepare-android-sdk.mjs
node scripts/run-gradle.mjs assembleDebug
```

`scripts/verify-video-splash.mjs` runs real browser checks in headless Microsoft Edge using optional Playwright tooling. Start Vite first. Playwright may be installed outside this checkout, then supplied through `CCS_PLAYWRIGHT_MODULE` as a file URL to its `index.mjs`. `CCS_SPLASH_URL` optionally overrides `http://127.0.0.1:5173/`.

```powershell
npm.cmd install --prefix "$env:TEMP\ccs-splash-browser" playwright --no-audit --no-fund
$env:CCS_PLAYWRIGHT_MODULE = ([System.Uri](Join-Path $env:TEMP 'ccs-splash-browser/node_modules/playwright/index.mjs')).AbsoluteUri
node scripts/verify-video-splash.mjs
```

The checks cover real MP4 playback, muted inline autoplay, welcome navigation, no replay during routing, replay on document reload, failed video loading, rejected autoplay, stalled playback, delayed restored approved/pending sessions, preserved session storage, and simulated visibility changes. Authentication checks use local fixtures and intercepted Supabase requests; they do not sign in to or modify hosted accounts.

Native device checks should include fresh launch, Home/background/resume, offline launch, and authenticated launch with an existing account. Browser visibility simulation does not establish Android lifecycle behavior by itself.

Verified on 2026-10-19: the browser checks passed, Vite built successfully, Capacitor Android sync completed, and Gradle `assembleDebug` passed. The debug APK installed on `Medium_Phone`, and its Android WebView reached the existing welcome screen with the video removed. The emulator restarted during subsequent lifecycle/recording checks, so native animation timing, background/resume, offline playback, and real-account restoration remain unverified. The build retains the existing Vite chunk-size and Gradle flat-directory warnings.
