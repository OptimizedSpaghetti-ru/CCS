import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { FLOOR_CHECKPOINTS, floorMapPath } from '../src/lib/floor-checkpoints.ts';

const directory = new URL('../public/floor-qr/', import.meta.url);
await mkdir(directory, { recursive: true });
const manifest = [];
for (const floor of FLOOR_CHECKPOINTS) {
  const payload = floorMapPath(floor.id);
  const filename = `floor-${floor.id}`;
  const options = { errorCorrectionLevel: 'M', margin: 4, width: 800, color: { dark: '#111111', light: '#FFFFFF' } };
  await writeFile(new URL(`${filename}.svg`, directory), await QRCode.toString(payload, { ...options, type: 'svg' }));
  await QRCode.toFile(fileURLToPath(new URL(`${filename}.png`, directory)), payload, options);
  manifest.push({ ...floor, building: 'Saint Benedict Hall', payload, png: `${filename}.png`, svg: `${filename}.svg` });
}
await writeFile(new URL('manifest.json', directory), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(new URL('print.html', directory), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CCS Connect — Floor QR Codes</title><style>
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { max-width: 760px; margin: 24px auto; padding: 0 12px; font-family: Arial, sans-serif; color: #111; background: #fff; }
h1 { margin: 0 0 6px; font-size: 24px; } header p { margin: 0 0 18px; font-size: 13px; }
main { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
article { break-inside: avoid; text-align: center; border: 1px solid #444; padding: 12px; }
h2 { margin: 0 0 4px; font-size: 24px; } article p { margin: 3px 0; font-size: 12px; line-height: 1.4; }
img { display: block; width: 180px; max-width: 100%; height: auto; margin: 4px auto; }
@media print { body { margin: 0; padding: 0; max-width: none; } }
@media screen and (max-width: 480px) { main { grid-template-columns: 1fr; } }
</style></head><body><header><h1>CCS Connect Floor QR Codes</h1>
<p>Saint Benedict Hall · Print at actual size. Place each code on its matching floor.</p></header>
<main>${manifest.map(floor => `<article><h2>${floor.label}</h2><p>Saint Benedict Hall</p>
<img src="${floor.svg}" alt="CCS Connect ${floor.label} QR code" width="180" height="180">
<p>CCS Connect → Indoor Map → Scan QR.</p><p>Scan to view this floor’s indoor map.</p></article>`).join('\n')}</main></body></html>\n`);
console.log('Generated five floor QR codes (PNG + SVG), manifest, and printable sheet in public/floor-qr/.');
