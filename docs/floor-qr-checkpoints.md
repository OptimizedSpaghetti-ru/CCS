# Floor QR checkpoints

CCS Connect has five floor checkpoints for Saint Benedict Hall: 1st, 2nd, 3rd, 4th, and 5th Floor.

## Use and print

Open **Map → Indoor Map → Scan Floor QR**, allow camera access, and point the camera at a posted code. The scan button sits beside Choose Building Level, directly above the five floor buttons. A valid code opens the indoor map on its floor. Existing manual floor buttons remain available. The scanner stops after success, cancellation, or backgrounding; use Resume Camera after returning.

Open `/floor-qr/print.html` in the web app to print the labeled sheet. Print at actual size with a clear quiet zone around each code. Individual 800px PNGs and vector SVGs are in `public/floor-qr/`. Place each label only on its matching floor. Regenerate with `npm.cmd run qr:generate`.

Codes contain relative links such as `/app/map?view=indoor&floor=3rd`. They work across web and Android inside the CCS Connect scanner without a production hostname. OS camera-to-Android app links are not configured in this version. Codes identify a floor, not a person's precise position, and do not move the existing location pin or start a route.

## Access and compatibility

- All decoding runs locally. Camera frames are not uploaded or stored.
- The camera is requested only when the scanner opens. Web use requires HTTPS or localhost; Android uses the packaged WebView and runtime CAMERA permission.
- If access is denied, use Android/browser settings and Retry Camera, or Choose Floor Manually.
- Only known floor links on the map route are accepted; scanned content never redirects to arbitrary websites.
- Floor links preserve their destination through login and pending approval using session storage. Account approval remains mandatory. If session storage is blocked, users can select their floor manually.
- Existing offline blocking and reconnection behavior remains in effect; this feature does not introduce offline map access.
- Android background cleanup uses Capacitor App lifecycle events as well as browser visibility events. The App plugin's back-button handler is disabled to preserve existing navigation behavior.

## Validation

- `npm.cmd run test:floor-qr`: floor payload validation and safe auth handoff.
- `npm.cmd run verify:floor-qr`: local Playwright fixtures for floor links, real QR decoding from simulated camera video, manual switching, errors, cleanup, and auth handoff. Run Vite on 127.0.0.1:5173 first, or set CCS_QR_URL.
- `npm.cmd run verify:floor-qr-assets`: decode every generated PNG and SVG with the production QR decoder and inspect the print layout.
- `npm.cmd run build`: production web bundle. Android must also be synced/built for permission and packaged asset changes to take effect.
- `npm.cmd run verify:android-floor-qr`: emulator-only check of the actual camera preview, close cleanup, background pause, and explicit resume. Existing auth storage and camera permission are restored after the test.

Physical camera focus, printed-label readability, and Android permission UX need a real-device check before campus placement. Browser fixtures exercise the production decoder and scanner lifecycle but do not replace this check.

Verified on 2026-10-24: all 13 Node tests, 12 browser verification scenarios, all five generated PNG/SVG destinations, A4 print layout, scoped scanner TypeScript checking, startup regressions, production web build, and Android debug assembly. Android emulator camera preview, close, background release, explicit resume, and manual fallback passed; test auth storage and camera permission were restored. All 43 production web files match synchronized Android assets and the APK. Vite's existing large-chunk warning remains non-blocking.
