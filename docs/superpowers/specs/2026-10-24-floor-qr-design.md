# Floor QR checkpoints

Approved in chat on 2026-10-24: five QR codes, one per floor of Saint Benedict Hall. Scanning inside CCS Connect opens the existing indoor map at that floor. It does not locate a person, move the stored location pin, or start a route. Manual floor switching remains available.

Use the existing floor IDs `1st`, `2nd`, `3rd`, `4th`, `5th`. Encode a portable relative map link `/app/map?view=indoor&floor=<id>` so printed codes do not depend on a development hostname. Only accept this route and recognized floors; never follow arbitrary scanned links. External camera-to-Android app links are outside this version.

Add a Scan Floor QR action to the map screen. Request the rear camera only after the user opens the scanner. Decode on-device with qr-scanner; bundle its fallback decoder locally. Show camera errors and retry, retain manual selection, stop the camera on close, navigation, background, and a successful scan. Process one valid result per scanner session; invalid codes leave scanning available.

A valid scan selects the indoor tab, resets the view and active route/voice state, and confirms the floor. Deep links retain the requested floor through login and pending approval using session-scoped storage; existing approval and role guards remain authoritative. Do not change account/data permissions or offline policy. Resume the camera only after the user explicitly requests it following backgrounding.

Generate five PNG/SVG QR assets with a labeled printable HTML sheet and a manifest. Verify the actual image payloads using the production decoder. Keep all existing map controls and appearance outside the new scanner controls.

Architecture choice: browser camera scanning shared by web and Capacitor Android, whose existing WebChromeClient handles runtime camera requests when CAMERA is declared. The Capacitor App lifecycle plugin stops the camera on Android onStop because the emulator demonstrated that document.visibilitychange does not fire. No native barcode plugin or database changes. Alternatives considered: a native barcode plugin (additional native integration), and OS camera/app links (requires a hosted domain and Android association). Both are unnecessary for the approved in-app scope.
