import assert from 'node:assert/strict';
import { readFile, mkdir, readdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { FLOOR_CHECKPOINTS, floorMapPath } from '../src/lib/floor-checkpoints.ts';
import { ROOM_CHECKPOINTS, roomMapPath } from '../src/lib/room-checkpoints.ts';

const baseURL = process.env.CCS_QR_URL || 'http://127.0.0.1:5173';
const manifest = JSON.parse(await readFile(new URL('../public/room-qr/manifest.json', import.meta.url), 'utf8'));
assert.deepEqual(manifest.map(item => item.id).sort(), ROOM_CHECKPOINTS.map(room => room.id).sort());
const images = (await readdir(new URL('../public/room-qr/', import.meta.url))).filter(file => /\.(png|svg)$/.test(file));
assert.equal(images.length, 28, 'all 14 room QR pairs are published');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  await page.goto(`${baseURL}/room-qr/print.html`);
  assert.equal(await page.locator('article').count(), 14);
  assert.equal(await page.locator('.qr-page').count(), 3);
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
  const floors = JSON.parse(await readFile(new URL('../public/floor-qr/manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(floors.map(floor => floor.id), FLOOR_CHECKPOINTS.map(floor => floor.id));
  for (const floor of floors) {
    assert.equal(floor.payload, floorMapPath(floor.id));
    for (const extension of ['png', 'svg']) {
      const filename = floor[extension];
      // Restored floor images must be identical to the originally published codes.
      const original = execFileSync('git', ['show', `1cbaea62:public/floor-qr/${filename}`]);
      assert.deepEqual(await readFile(new URL(`../public/floor-qr/${filename}`, import.meta.url)), original);
      const decoded = await page.evaluate(async filename => {
        const { default: QrScanner } = await import('/node_modules/qr-scanner/qr-scanner.min.js');
        return (await QrScanner.scanImage(`/floor-qr/${filename}`, { returnDetailedScanResult: true })).data;
      }, filename);
      assert.equal(decoded, floor.payload);
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
  console.log('PASS all 14 room PNG/SVG pairs and five original floor PNG/SVG pairs decode to their assigned rooms; labeled sheet fits three A4 room pages.');
} finally {
  await browser.close();
}
