# Room QR checkpoints

CCS Connect's indoor map accepts room QR codes for these Saint Benedict Hall destinations, alongside floor codes for 1F-5F:

| Room | Floor | Stable room ID |
| --- | --- | --- |
| Computer Lab 1 | 1F | `comp-lab-1` |
| Computer Lab 2 | 1F | `comp-lab-2` |
| Computer Lab 3 | 1F | `comp-lab-3` |
| Computer Lab 4 | 2F | `computer-lab-4` |
| Computer Lab 5 | 5F | `computer-lab-5` |
| EMC Laboratory | 1F | `soci` |
| College of Computer Studies Office | 2F | `ccs-office` |
| IT / OJT Room | 2F | `it-ojt-room` |
| Tamaraw Library | 2F | `tamaraw-library` |
| Room 501 | 5F | `room-501` |
| Room 502 | 5F | `room-502` |
| Room 503 | 5F | `room-503` |
| Room 504 | 5F | `room-504` |
| Room 505 | 5F | `room-505` |

EMC Laboratory replaces the former SOCI / Co-Curricular Office label and description. Its original `soci` identifier, position, dimensions, height, and map colors remain stable. Its search metadata and category now identify it as a laboratory. Rooms outside this catalogue are not QR-enabled. Library uses the existing Tamaraw Library destination and label.

## Scan and print

Open **Map → Indoor Map → Scan QR**. A room scan switches to the room's floor, centers and highlights the room using the existing selection style, and displays its name. Existing 1F–5F buttons, search, manual selection, route controls, drag/pan, pinch/zoom, rotation, and tilt remain available. Scanning selects a destination without moving the stored current-location pin or automatically starting a route. Any previously active route is cleared, as with the previous scanner.

Open `/room-qr/print.html` to print the three-page A4 room sheet. Individual 800px PNGs, vector SVGs, and the manifest live in `public/room-qr/`. Place a code only at its matching room, with its quiet zone intact. Regenerate using `npm.cmd run qr:generate`.

Payloads are relative URLs such as `/app/map?view=indoor&room=room-501`. They work inside the scanner on web and Android without a production hostname. The QR catalogue derives each floor/name from the same geometry data used by the indoor map (`src/data/indoorMapData.js`). Floor information is not trusted from scanned input.

The same **Scan QR** action also accepts all five original floor payloads (`/app/map?view=indoor&floor=1st` through `5th`). Floor scans open that floor and clear any prior room QR target. They do not set a room destination or move the stored current-location pin. The original floor PNG/SVG images are restored byte-for-byte in `public/floor-qr/`; print them at `/floor-qr/print.html`. `npm.cmd run qr:generate` generates both catalogues. Existing npm verification aliases remain available.

## Validation, access, and camera lifecycle

- Only allowlisted room IDs or floor IDs on the exact map route are accepted, as relative links or absolute links on the app's own origin. Foreign origins, unsupported IDs, duplicate parameters, extra parameters, mixed room/floor payloads, and fragments are rejected with a recoverable scanner message.
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

## Verification scope

The verification scripts cover all 14 room destinations and all five legacy floor codes, repeated scans, switching between room/floor targets, room highlights and centering, unchanged location storage, invalid-code recovery, camera cleanup, manual map controls, and auth/approval handoff. Asset checks decode every PNG/SVG and compare restored floor images with their original published bytes. Android checks run inside the installed debug APK on a test emulator with fixture authentication/backend responses.

Physical camera focus, printed-label readability, deployed camera headers, and live-account behavior still require their respective device/hosted checks. Emulator and local browser checks do not certify those environments.

## Verified October 27, 2026

- All 19 Node tests and focused scanner/checkpoint TypeScript checks passed.
- Browser checks passed for all 14 room codes, all five legacy floor codes, repeated scans, room/floor switching, room centering/highlights, invalid-code recovery, manual controls/gestures, camera errors/cleanup, and login/approval handoff.
- All 38 room/floor PNG and SVG assets decode correctly. The five floor image pairs match the original published bytes, all 11 existing room image pairs remain unchanged, and the room print sheet fits three A4 pages.
- The installed debug APK passed actual emulator camera preview, close/background cleanup, explicit resume, and manual fallback. Simulated camera frames decoded all 14 rooms and all five floors in the packaged WebView with correct floor selection and room highlights; stored location and original auth/permission state were preserved.
- Production web build, `npx.cmd cap sync android`, and Gradle `assembleDebug` passed. All 73 production files match synchronized Android assets and the APK byte-for-byte. Map geometry and rendering files are unchanged. Existing Vite bundle-size and Gradle `flatDir` warnings remain.

These results use local fixture authentication/backend responses and a test emulator. Printed codes on a physical device and hosted/live-account flows were not tested.
