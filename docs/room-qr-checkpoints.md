# Room QR checkpoints

CCS Connect's indoor map accepts room QR codes for exactly these Saint Benedict Hall destinations:

| Room | Floor | Stable room ID |
| --- | --- | --- |
| Computer Lab 1 | 1F | `comp-lab-1` |
| Computer Lab 2 | 1F | `comp-lab-2` |
| Computer Lab 3 | 1F | `comp-lab-3` |
| Computer Lab 4 | 2F | `computer-lab-4` |
| Computer Lab 5 | 5F | `computer-lab-5` |
| EMC Laboratory | 1F | `soci` |
| Room 501 | 5F | `room-501` |
| Room 502 | 5F | `room-502` |
| Room 503 | 5F | `room-503` |
| Room 504 | 5F | `room-504` |
| Room 505 | 5F | `room-505` |

EMC Laboratory replaces the former SOCI / Co-Curricular Office label and description. Its original `soci` identifier, position, dimensions, height, and map colors remain stable. Its search metadata and category now identify it as a laboratory. Other laboratories, classrooms, offices, and facilities are not QR-enabled.

## Scan and print

Open **Map → Indoor Map → Scan QR**. A valid scan switches to the room's floor, centers and highlights the room using the existing selection style, and displays its name. Existing 1F–5F buttons, search, manual selection, route controls, drag/pan, pinch/zoom, rotation, and tilt remain available. Scanning selects a destination without moving the stored current-location pin or automatically starting a route. Any previously active route is cleared, as with the previous scanner.

Open `/room-qr/print.html` to print the two-page A4 sheet. Individual 800px PNGs, vector SVGs, and the manifest live in `public/room-qr/`. Place a code only at its matching room, with its quiet zone intact. Regenerate using `npm.cmd run qr:generate`.

Payloads are relative URLs such as `/app/map?view=indoor&room=room-501`. They work inside the scanner on web and Android without a production hostname. The QR catalogue derives each floor/name from the same geometry data used by the indoor map (`src/data/indoorMapData.js`). Floor information is not trusted from scanned input.

The former floor QR assets have been retired and floor-only QR codes are rejected by Scan QR. Ordinary floor deep links and the five manual floor buttons remain supported. Existing `*:floor-qr` npm commands are compatibility aliases for the updated scripts; use the `*:room-qr` commands below for new work.

## Validation, access, and camera lifecycle

- Only allowlisted room IDs on the exact map route are accepted, as relative links or absolute links on the app's own origin. Foreign origins, unsupported IDs, duplicate parameters, extra parameters, mixed room/floor payloads, and fragments are rejected with a recoverable scanner message.
- Room destinations survive login and pending approval once using session storage. Approval remains mandatory. If storage is unavailable, manual room selection still works.
- Decoding runs locally; frames are not stored or uploaded. Camera permissions and Capacitor plugins are unchanged.
- Web needs HTTPS or localhost. The Vercel configuration permits `camera=(self)`; deployed headers must match this configuration before hosted scanning can work.
- Closing, successful decoding, and backgrounding stop the camera. Resume Camera explicitly restarts it after backgrounding. Camera denial/unavailability has Retry Camera and manual selection recovery.
- Existing offline blocking remains in effect. This feature does not add offline map access or OS camera-to-app links.

## Checks

```powershell
npm.cmd test
npm.cmd run test:room-qr
# Start Vite in a separate terminal. Default verification URL: http://127.0.0.1:5173
npm.cmd run dev -- --host 127.0.0.1
npm.cmd run verify:room-qr
npm.cmd run verify:room-qr-assets
node scripts/verify-startup-splash.mjs
npm.cmd run build
npx.cmd cap sync android
node scripts/prepare-android-sdk.mjs
node scripts/run-gradle.mjs assembleDebug
# Install the debug APK and launch a booted, authorized test emulator first.
npm.cmd run verify:android-room-qr
```

Set `CCS_QR_URL` or `CCS_SPLASH_URL` when using a nondefault dev-server URL. Browser checks use Playwright with installed Microsoft Edge. Android checks use the actual packaged WebView, validate the emulator camera lifecycle, and simulate camera frames for deterministic QR decoding. Auth/backend responses are local fixtures, not live account or hosted mutation tests. Original native/web auth storage and camera permission are restored afterward.

Physical camera focus, printed-label readability, and real-device permission UX still require a device check before campus placement. Local browser results do not validate deployed HTTP headers or hosted scanning.

## Verified October 27, 2026

- All 19 Node tests passed, including strict room validation and one-time auth handoff.
- Browser checks passed at 390px and 1440px: all 11 codes decode from simulated camera frames, choose their correct floor, and highlight/center their room. Repeated scans, manual floors, pan/zoom, EMC search/filtering, invalid-code recovery, camera errors/cleanup, and login/approval handoff passed. Existing startup regression checks also passed.
- All 11 generated PNGs and 11 SVGs decoded correctly with the production decoder. The labeled print sheet fits two A4 pages.
- On the `Medium_Phone` Android emulator, the debug APK passed actual camera preview/close, full app backgrounding, explicit resume, and manual fallback. All 11 simulated camera codes also decoded in the actual packaged WebView with correct floor, highlight, centering, and cleanup. The test used an opaque Android Settings activity for backgrounding because this emulator's Home transition could pause without completing an Activity stop. Auth storage and camera permission were restored.
- Production build, `cap sync android`, and Gradle debug assembly passed. All 55 production files match synchronized Android assets and the APK byte-for-byte. The APK contains exactly 22 room QR images and no retired floor QR files.
- A comparison against the previous committed map confirmed that all 76 room definitions retain IDs, ordering, geometry, visual types, and heights, apart from EMC's display name. Native permissions, plugins, and bridge configuration are unchanged.
- Focused scanner/checkpoint TypeScript checks passed. Checking the broader map still reports its pre-existing unsupported CSS `originX` property; this unrelated issue was not changed. Existing Vite bundle-size and Gradle `flatDir` warnings remain.

These results use fixture authentication/backend responses and an emulator. They do not certify live-account flows, hosted camera headers, or printed codes on a physical device.
