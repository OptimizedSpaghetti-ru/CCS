import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import './generate-floor-only-qr.mjs';
import { ROOM_CHECKPOINTS, roomMapPath } from '../src/lib/room-checkpoints.ts';

const directory = new URL('../public/room-qr/', import.meta.url);
await mkdir(directory, { recursive: true });
const manifest = [];
for (const room of ROOM_CHECKPOINTS) {
  const payload = roomMapPath(room.id);
  const filename = `room-${room.id}`;
  const options = { errorCorrectionLevel: 'M', margin: 4, width: 800, color: { dark: '#111111', light: '#FFFFFF' } };
  await writeFile(new URL(`${filename}.svg`, directory), await QRCode.toString(payload, { ...options, type: 'svg' }));
  await QRCode.toFile(fileURLToPath(new URL(`${filename}.png`, directory)), payload, options);
  manifest.push({ ...room, floorLabel: `${room.floorId} Floor`, building: 'Saint Benedict Hall', payload, png: `${filename}.png`, svg: `${filename}.svg` });
}
await writeFile(new URL('manifest.json', directory), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(new URL('print.html', directory), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CCS Connect — Room QR Codes</title><style>
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { max-width: 760px; margin: 24px auto; padding: 0 12px; font-family: Arial, sans-serif; color: #111; background: #fff; }
h1 { margin: 0 0 6px; font-size: 24px; } header p { margin: 0 0 18px; font-size: 13px; }
.qr-page { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; break-after: page; margin-bottom: 24px; }
.qr-page:last-child { break-after: auto; margin-bottom: 0; }
article { break-inside: avoid; text-align: center; border: 1px solid #444; padding: 12px; }
h2 { margin: 0 0 4px; font-size: 24px; } article p { margin: 3px 0; font-size: 12px; line-height: 1.4; }
img { display: block; width: 180px; max-width: 100%; height: auto; margin: 4px auto; }
@media print { body { margin: 0; padding: 0; max-width: none; } .qr-page { margin-bottom: 0; } }
@media screen and (max-width: 480px) { .qr-page { grid-template-columns: 1fr; } }
</style></head><body><header><h1>CCS Connect Room QR Codes</h1>
<p>Saint Benedict Hall · Print at actual size. Place each code only at its matching room.</p></header>
<main>${Array.from({ length: Math.ceil(manifest.length / 6) }, (_, index) => manifest.slice(index * 6, (index + 1) * 6)).map(rooms => `<section class="qr-page">${rooms.map(room => `<article><h2>${room.name}</h2><p>${room.floorLabel} &middot; Saint Benedict Hall</p>
<img src="${room.svg}" alt="CCS Connect ${room.name} QR code" width="180" height="180">
<p>CCS Connect &rarr; Indoor Map &rarr; Scan QR.</p><p>Scan to highlight this room.</p></article>`).join('\n')}</section>`).join('\n')}</main></body></html>\n`);
console.log(`Generated ${manifest.length} room QR codes (PNG + SVG), manifest, and printable sheet in public/room-qr/.`);
