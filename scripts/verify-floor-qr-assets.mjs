import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.CCS_QR_URL || 'http://127.0.0.1:5173';
const floors = ['1st', '2nd', '3rd', '4th', '5th'];
const manifest = JSON.parse(await readFile(new URL('../public/floor-qr/manifest.json', import.meta.url), 'utf8'));
assert.deepEqual(manifest.map(item => item.id), floors);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  await page.goto(`${baseURL}/floor-qr/print.html`);
  assert.equal(await page.locator('article').count(), 5);
  for (const floor of floors) {
    for (const extension of ['png', 'svg']) {
      const decoded = await page.evaluate(async ({ floor, extension }) => {
        const { default: QrScanner } = await import('/node_modules/qr-scanner/qr-scanner.min.js');
        return (await QrScanner.scanImage(`/floor-qr/floor-${floor}.${extension}`, { returnDetailedScanResult: true })).data;
      }, { floor, extension });
      assert.equal(decoded, `/app/map?view=indoor&floor=${floor}`);
    }
  }
  await mkdir('artifacts/floor-qr', { recursive: true });
  await page.screenshot({ path: 'artifacts/floor-qr/print-sheet.png', fullPage: true });
  await page.emulateMedia({ media: 'print' });
  const height = await page.locator('body').evaluate(el => el.scrollHeight);
  assert.ok(height <= 1031, `Print content should fit A4 with 12mm margins; got ${height}px`);
  console.log('PASS five PNGs and five SVGs decode to the correct five floor destinations; printable sheet fits one A4 page.');
} finally {
  await browser.close();
}
