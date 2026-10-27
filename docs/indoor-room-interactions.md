# Indoor room selection

The indoor map uses SVG faces inside CSS 3D transforms, rather than a WebGL raycasting engine. Room selection now uses those visible faces on all five floors.

## Causes and repair

1. The flat transformed wrapper could intercept input intended for rooms projected behind its plane. The wrapper is now noninteractive, with input explicitly enabled on the transformed SVG. The existing map viewport still receives bubbled drag/gesture events.
2. Enlarged, invisible rectangular room hitboxes overlapped neighboring rooms and did not match the full visible roof/side faces. Those rectangles were removed. The actual room shapes receive mouse clicks in their existing paint order.
3. Touch browsers could adjust a synthetic click toward a larger adjacent target. A completed single-finger tap now resolves the actual painted room at the touch's screen coordinates. The result must belong to the active map and current floor. The compatibility click is prevented so it cannot overwrite that selection.

Existing pan/pinch state distinguishes a completed tap from a drag or multi-finger gesture. Cancellation and gesture completion retain their cleanup. No room geometry, dimensions, visual face attributes, colors, floor data, camera angle, default scale, or navigation behavior is changed by this interaction patch. QR destinations remain unchanged.

## Repeat the checks

```powershell
# Separate terminal
npm.cmd run dev -- --host 127.0.0.1 --port 5175
# Real mouse/touch input at projected face and edge coordinates
npm.cmd run verify:map-rooms
npm.cmd test
# Existing room QR regression; same server, separate terminal
$env:CCS_QR_URL = 'http://127.0.0.1:5175'
npm.cmd run verify:room-qr

npm.cmd run build
npx.cmd cap sync android
node scripts/prepare-android-sdk.mjs
node scripts/run-gradle.mjs assembleDebug
# Install the debug APK on a booted test emulator first
npm.cmd run verify:android-map-rooms
```

`CCS_MAP_URL` overrides the browser server URL. `CCS_MAP_FLOORS` optionally limits diagnostics to comma-separated IDs such as `1st,2nd`; omit it to validate all five floors.

The browser suite covers every room in the default view using real coordinate input. Tiny test-only SVG probes locate screen coordinates and are removed before input. An independent check of visible SVG fill/stroke excludes parts genuinely covered by another room and ambiguous subpixel shared borders. Selection is reset before each tap so ignored input cannot pass accidentally. Every room must have a visible test point.

The Android suite exercises the actual installed APK's WebView. It runs the same face/edge cases and then sends OS-level ADB taps to all room centers, using the actual native WebView bounds. It also checks pan, pinch, rotation, tap completion, and route controls. Fixture auth and backend responses keep production accounts/data untouched; native/web auth storage, the location pin, and original URL are restored.

The existing broader map TypeScript check still reports the pre-existing unsupported CSS `originX` property. A production Vite build does not certify a clean repository-wide type check.

Artifacts and check results are written under `artifacts/room-interactions/`. Emulator results do not certify behavior on a physical touchscreen device.

## Verified October 27, 2026

- Browser: 970 coordinate probes across all 76 rooms on all five floors, using desktop mouse and mobile touch. Every tested room face/edge selected its intended room; taps preserved the map transform.
- Android debug APK: 485 native WebView face/edge taps across all 76 rooms, plus 76 successful OS-level ADB room-center taps. Tests covered PT Lecture, Computer Lab 3, IT/OJT, restrooms, and every other existing room/area.
- Mouse pan/rotation, one-finger pan, two-finger pinch, gesture completion, floor switching, highlighting, and route controls passed. These delivered-input checks do not claim that the pre-existing pan threshold was rewritten or that arbitrary physical finger jitter is certified.
- All 19 Node tests and the existing room QR browser regression passed.
- Production build, Capacitor Android sync, and Gradle debug assembly passed. All 55 production web files match the synchronized Android assets and debug APK byte-for-byte, including the touch coordinate resolver.
- Complete room SVG face/label/symbol rendering, room data, and default camera constants were compared with the previous commit and are unchanged by this repair.
- Native/web auth, stored location, and the original emulator URL were restored after testing.

Concurrent external edits to the filter control and other screens were preserved; those UI changes are separate from this interaction fix. Physical-device testing remains outstanding.
