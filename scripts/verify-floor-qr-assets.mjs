import assert from 'node:assert/strict';
import { readFile, mkdir, readdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { ROOM_CHECKPOINTS, roomMapPath } from '../src/lib/room-checkpoints.ts';

const baseURL = process.env.CCS_QR_URL || 'http://127.0.0.1:5173';
const manifest = JSON.parse(await readFile(new URL('../public/room-qr/manifest.json', import.meta.url), 'utf8'));
assert.deepEqual(manifest.map(item => item.id).sort(), ROOM_CHECKPOINTS.map(room => room.id).sort());
const images = (await readdir(new URL('../public/room-qr/', import.meta.url))).filter(file => /\.(png|svg)$/.test(file));
assert.equal(images.length, 22, 'only 11 room QR pairs are published');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  await page.goto(`${baseURL}/room-qr/print.html`);
  assert.equal(await page.locator('article').count(), 11);
  assert.equal(await page.locator('.qr-page').count(), 2);
  for (const room of manifest) {
    assert.equal(room.payload, roomMapPath(room.id));
    assert.equal(room.floorId, ROOM_CHECKPOINTS.find(item => item.id === room.id).floorId);
    for (const extension of ['png', 'svg']) {
      const decoded = await page.evaluate(async filename => {
        const { default: QrScanner } = await import('/node_modules/qr-scanner/qr-scanner.min.js');
        return (await QrScanner.scanImage(`/room-qr/${filename}`, { returnDetailedScanResult: true })).data;
      }, room[extension]);
      assert.equal(decoded, room.payload);
    }
  }
  await mkdir('artifacts/room-qr', { recursive: true });
  await page.screenshot({ path: 'artifacts/room-qr/print-sheet.png', fullPage: true });
  await page.emulateMedia({ media: 'print' });
  const pages = await page.locator('.qr-page').evaluateAll(elements => elements.map((element, index) => ({
    height: element.getBoundingClientRect().height + (index === 0 ? document.querySelector('header').getBoundingClientRect().height : 0),
    overflowing: element.scrollWidth > element.clientWidth,
  })));
  for (const page of pages) {
    assert.ok(page.height <= 1031, `Each printed page must fit A4 with 12mm margins; got ${page.height}px`);
    assert.equal(page.overflowing, false);
  }
  console.log('PASS all 11 PNGs and 11 SVGs decode to their assigned rooms; labeled sheet fits two A4 pages.');
} finally {
  await browser.close();
}
