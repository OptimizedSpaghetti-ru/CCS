# Floor QR checkpoints

Open **Map > Indoor Map > Scan QR** to scan either a floor code or a supported room code.

All five original floor codes remain compatible. Their permanent payloads are `/app/map?view=indoor&floor=1st`, `2nd`, `3rd`, `4th`, and `5th` (each with the same route and query prefix). A floor scan opens its floor and clears any prior room QR target. Room scans open the correct floor and highlight the selected room. Scanning never moves the stored current-location pin or automatically starts navigation.

Original floor PNGs and SVGs are restored byte-for-byte in `public/floor-qr/`. Print `/floor-qr/print.html` or use the individual images. Regenerate both floor and room catalogues with `npm.cmd run qr:generate`.

See [room QR checkpoints](room-qr-checkpoints.md) for supported rooms, scanner validation, camera lifecycle, and web/Android verification commands.
