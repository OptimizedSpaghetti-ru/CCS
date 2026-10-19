# Animated splash startup

`AppStartup` mounts once inside `AppProvider`, outside route changes, theme refreshes and the Android activity's normal background/resume lifecycle. `StartupSplashScreen` renders the existing `src/standalone/splash/AnimatedSplashScreen` without changing its component or CSS. No neon title is present. The original MP4 and poster remain intact, exclusively for reference/preview comparison.

Supabase initializes through the existing persistent storage while the 1560ms animation plays. Both playback and session/profile initialization must finish before the destination mounts. Approved sessions open `/app/home`, logged-out launches open the existing `/` welcome screen, and pending/rejected accounts retain the existing `/pending-approval` authorization rule. Recovery routes and authentication callback URLs bypass the ordinary startup redirect. No roles, database configuration, Home design or welcome design were changed.

The final artwork remains visible until the destination is ready. After two paint opportunities, the entire splash fades over 250ms. There is no artificial delay for fast authentication. The wrapper pauses running animations when the document is hidden and resumes their existing positions on return. Once dismissed, it never remounts during routing or background resume. Reloading the web document or starting a new Android WebView after process death creates a fresh playback.

Animation exceptions show a static logo fallback and release the playback gate. An eight-second visible-playback watchdog handles missing completion. Authentication failures keep the final splash with a retry button, rather than forcing logout or clearing persistent storage. Slow initialization shows the retry option after 15 seconds of waiting after playback; authentication can still finish naturally. Retry reloads the document and starts a fresh initialization.

## Native handoff and offline assets

Initial HTML draws a maroon gradient and the existing local school logo before React loads. The native launch background, Android window background and Capacitor WebView background use the animation's `#50131c` starting color; the existing transparent native splash icon is retained. There is no video decoder, poster request, autoplay permission, remote font or new splash plugin. All animation graphics are SVG/CSS, and the PNG logo is bundled in `public/branding` and synchronized into Android assets. SVG cover framing preserves the animation's aspect ratio without stretching, cropping at viewport boundaries as in the preview.

The animation works without the network. Restoring an expired session may still require Supabase connectivity; an offline splash cannot guarantee that remote token refresh succeeds. The existing cached-session/profile metadata fallback remains unchanged. A failed initialization offers retry and does not explicitly sign out the user.

## Build and checks

```powershell
npm.cmd run build
npx.cmd cap sync android
node scripts/prepare-android-sdk.mjs
node scripts/run-gradle.mjs assembleDebug
```

Browser verification uses optional Playwright outside the application dependencies:

```powershell
$env:CCS_PLAYWRIGHT_MODULE = 'file:///absolute/path/to/playwright/index.mjs'
node scripts/verify-startup-splash.mjs
node scripts/verify-animated-splash.mjs
```

The application server defaults to `http://127.0.0.1:5173/` (`CCS_SPLASH_URL` override). The independent preview defaults to `http://127.0.0.1:5174/`; see [preview instructions](../preview/splash/README.md).

The startup suite checks mobile/desktop playback, no video or neon, fresh reload, route changes, visibility pause/resume, delayed approved/pending fixture sessions, retained session storage, animation failure, session-initialization failure with recovery, password-recovery routing, and logged-out startup with external requests blocked. These are intercepted local authentication fixtures, not live-account authentication tests.

After installing the debug APK and launching it on a booted emulator:

```powershell
node scripts/verify-android-startup.mjs
```

This uses ADB and the debug WebView's CDP socket. It temporarily disables emulator Wi-Fi/mobile data and uses a synthetic session, then restores the previous radio state and both native/web session values. It verifies offline logged-out cold launch, vector playback and bundled logo in the actual WebView, navigation and real background/resume without document recreation, plus an offline cold launch restoring a synthetic approved session from Capacitor Preferences to Home. This does not verify a real Supabase login or expired-token refresh. An optional `CCS_ANDROID_SCREENSHOT` path captures a paused inspection frame.

## Verification on 2026-10-19

- Web startup browser checks passed at 390px and 1440px, including session/error/lifecycle cases.
- Web build, Capacitor Android sync and Gradle `assembleDebug` passed. The existing Vite large-chunk and Gradle flat-directory warnings remain.
- The debug APK installed on `Medium_Phone`, Android WebView 149. Offline logged-out cold launch, synthetic approved-session cold launch, native Preferences persistence, route changes and actual background/resume passed.
- Scoped TypeScript checking for the new wrapper passed. Broader application checking reports errors in existing shared shadow tokens, conflicting `CCSAndroidBridge` declarations, analytics/profile typing, map styles and the JavaScript campus-data module. Those unrelated files were not modified.
- Native cold-launch recordings showed the maroon handoff, code animation and welcome transition without a white flash. Emulator frame sampling was below the 60 FPS target, so smoothness at 60 FPS is not certified. Physical-device performance and real-account token refresh remain unverified. The supplied raster logo still has its original resolution; vector rings/background scale independently.
