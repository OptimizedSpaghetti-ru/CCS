# CCS Connect offline recovery

Implemented October 24, 2026 in the shared React application and Capacitor Android package.

## Behavior

- Browser online/offline events and native Capacitor Network events trigger uncached reachability checks. A visible app also checks every 15 seconds and when focused or resumed.
- Checks contact Supabase's auth health endpoint and an independent destination: the web app's `/connectivity.txt`, or Google's `generate_204` endpoint on native Android. Android's bundled localhost content is never used to infer internet access.
- A response, including HTTP 401/429/500/503, proves transport reachability. Network failures from both destinations confirm an outage even with `navigator.onLine === true`. Probe timeouts alone retain the current state. Probes have a 6-second deadline and concurrent checks share one promise.
- The full-screen burgundy/cream interface leaves the existing page mounted and inert. Its Retry Connection button checks connectivity without reloading the page. Recovery restores focus and preserves input and location.
- Supabase transport attempts, including response bodies, have a 30-second deadline. Interrupted GET/HEAD requests wait without an active transport while the offline screen is visible, then retry once. The same read retries if an outage has already recovered when its transport failure arrives. Cancellation interrupts the recovery wait. Mutations are never replayed by this adapter; users can retry an unsuccessful send or save explicitly.
- Auth initialization waits for reconnection, retries a failed bootstrap after recovery, and does not clear stored sessions. Initial-session hydration avoids duplicate profile reads. Startup preserves authenticated `/app/` deep links and public login/register routes, including query strings and hashes; recovery callbacks retain their existing flow.
- The production web service worker caches public HTML, bundled JS/CSS, fonts and public assets. API responses, tokens, connectivity checks and user data are excluded. New versions wait for existing tabs to close before activating. Android uses its bundled shell and does not register this worker.

## Verification

| Scenario | Evidence |
| --- | --- |
| Open without internet | Cached production web shell opened offline; installed Android APK cold-launched with both radios disabled |
| Lose connection during use | Desktop/mobile browser and Android emulator showed offline screen |
| Refresh offline | Production service-worker navigation and Android WebView refresh passed |
| Interrupted Supabase request | Fixture profile request failed during an outage, resumed after recovery, and retained authenticated compose deep link and session storage |
| Retry while offline | Browser and Android kept the offline screen visible |
| Automatic recovery | Both platforms dismissed offline screen and preserved a typed login field without reload |
| Wi-Fi/mobile switching | Android emulator switched from Wi-Fi to emulated mobile data and retained page/input |
| Normal online behavior | Existing startup regression suite passed: approved/pending session routing, animation lifecycle, error recovery and password recovery |
| Server errors / slow network | Browser checks rejected transport while `navigator.onLine` remained true; HTTP 503 and slow probes did not trigger the screen |
| Transport edge cases | Nine Node tests passed, covering status codes, timeout, cancellation, interrupted/brief outages, bounded read retry, known-offline reads and no mutation replay |
| Build and native sync | `npm.cmd run build`, `npx.cmd cap sync android`, and `node scripts/run-gradle.mjs assembleDebug` passed |

Screenshots are in `artifacts/offline/`. Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Run the checks

```powershell
npm.cmd run test:connectivity
npm.cmd run build
npx.cmd vite preview --host 127.0.0.1 --port 4173
# In another terminal; requires Playwright with installed Edge, or CCS_PLAYWRIGHT_MODULE pointing to Playwright.
node scripts/verify-offline.mjs
# Existing startup regression script uses the development server at localhost:5173.
node scripts/verify-startup-splash.mjs
npx.cmd cap sync android
node scripts/prepare-android-sdk.mjs
node scripts/run-gradle.mjs assembleDebug
# Install the debug APK and start it on a booted emulator first.
node scripts/verify-android-offline.mjs
```

The Android test changes emulator network settings temporarily, restores them in `finally`, and saves/restores native and web auth storage. It refuses to change a physical device's radios.

## Limits and existing issues

- An entirely new web visitor cannot load any application without a connection. Offline web refresh/open requires a completed prior service-worker cache installation over HTTPS or localhost. Android already includes its app assets. Unsaved input survives connection loss/recovery; an explicit page refresh still has its normal effect on in-memory form state.
- Android testing used `Medium_Phone`, not a physical device or real carrier handoff. The auth/Supabase integration browser test uses a local fixture session and mocked profile response; it does not claim real-account token-refresh or hosted mutation validation.
- New connectivity modules and offline component passed focused TypeScript checking. Broad checking still reports unrelated existing errors in shadow tokens, `CCSAndroidBridge` declarations, analytics/profile/map typing, and entry-point type configuration.
- Vite reports its existing large-bundle warning. Gradle reports existing `flatDir` warnings. Dependency installation reports 25 audit findings; the Network plugin adds no transitive dependencies. No broad dependency upgrades were performed.

API references: [Capacitor Network](https://next.capacitorjs.com/docs/apis/network), [Supabase custom fetch](https://supabase.com/docs/reference/javascript/initializing).
