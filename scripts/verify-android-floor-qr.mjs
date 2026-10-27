// Emulator only. Preserve existing auth storage and use local fixtures for backend requests.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import QRCode from 'qrcode';
import { ROOM_CHECKPOINTS, roomMapPath } from '../src/lib/room-checkpoints.ts';

const adbPath = process.env.CCS_ADB || path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const adb = (...args) => execFileSync(adbPath, args, { encoding: 'utf8', windowsHide: true }).trim();
assert.match(adb('get-serialno'), /^emulator-/, 'Native QR verification must run only on a test emulator');
const appId = 'com.ccs.connect';
const permission = 'android.permission.CAMERA';
const originallyGranted = adb('shell', 'dumpsys', 'package', appId).includes(`${permission}: granted=true`);
adb('shell', 'pm', 'grant', appId, permission);
adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
let browser;
let page;
for (let attempt = 0; attempt < 40 && !page; attempt++) {
  try {
    const pid = adb('shell', 'pidof', '-s', appId);
    adb('forward', 'tcp:9223', `localabstract:webview_devtools_remote_${pid}`);
    browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 1000 });
    page = browser.contexts().flatMap(context => context.pages())[0];
  } catch { await new Promise(resolve => setTimeout(resolve, 250)); }
}
assert.ok(page, 'Android debug WebView must be available');
page.setDefaultTimeout(15000);
const saved = await page.evaluate(async () => ({
  native: (await window.Capacitor.Plugins.Preferences.get({ key: 'ccs-connect-auth' })).value,
  web: localStorage.getItem('ccs-connect-auth'),
  pin: localStorage.getItem('ccs-indoor-current-location'),
  url: location.href,
}));
const userId = '11111111-1111-4111-8111-111111111111';
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'native-floor@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Native Floor Test', role: 'student', status: 'approved' }, created_at: '2026-01-01T00:00:00Z' };
const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const session = { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'local-fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
const context = page.context();
await context.routeWebSocket(/.*/, socket => socket.close());
const backendFixture = route => route.fulfill({ json: route.request().url().includes('/profiles') ? { id: userId, full_name: 'Native Floor Test', role: 'student', status: 'approved' } : route.request().url().includes('/auth/') ? user : [] });
await context.route('**/auth/v1/**', backendFixture);
await context.route('**/rest/v1/**', backendFixture);
try {
  await page.evaluate(async value => {
    await window.Capacitor.Plugins.Preferences.set({ key: 'ccs-connect-auth', value });
    localStorage.setItem('ccs-connect-auth', value);
  }, JSON.stringify(session));
  await page.goto(`https://localhost${roomMapPath('room-501')}`);
  await page.getByRole('heading', { name: 'Indoor Map Navigation' }).waitFor({ timeout: 30000 });
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  assert.equal(await page.getByRole('button', { name: '5th Floor', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  await page.getByText('Point your camera at a room QR code.').waitFor({ timeout: 30000 });
  await page.waitForFunction(() => { const video = document.querySelector('video'); return video?.videoWidth > 0 && video.srcObject?.getTracks().some(track => track.readyState === 'live'); });
  await page.evaluate(() => { window.nativeQrTracks = document.querySelector('video').srcObject.getTracks(); });
  await mkdir('artifacts/room-qr', { recursive: true });
  // Native camera surfaces can stall CDP screenshots; capture the emulator display instead.
  await writeFile('artifacts/room-qr/android-camera.png', execFileSync(adbPath, ['exec-out', 'screencap', '-p'], { windowsHide: true }));
  await page.getByRole('button', { name: 'Close Scanner' }).click();
  await page.waitForFunction(() => window.nativeQrTracks.every(track => track.readyState === 'ended'), null, { polling: 100 });
  console.log('PASS Android WebView: selected 5th floor, actual emulator camera preview, close releases tracks.');

  await page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  await page.getByText('Point your camera at a room QR code.').waitFor();
  await page.evaluate(() => {
    window.nativeVisibilityEvents = [];
    document.addEventListener('visibilitychange', () => window.nativeVisibilityEvents.push(document.hidden));
  });
  await page.evaluate(() => { window.nativeQrTracks = document.querySelector('video').srcObject.getTracks(); });
  // Start an opaque activity and wait for it to be displayed. On some emulator
  // launchers Home only pauses the camera activity without actually stopping it.
  adb('shell', 'am', 'start', '-W', '-a', 'android.settings.SETTINGS');
  // Android can suspend CDP/JS timers in the background. Assert cleanup after return.
  // Allow the opaque activity transition to finish and Activity.onStop to fire.
  await new Promise(resolve => setTimeout(resolve, 1500));
  adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
  await page.waitForFunction(() => window.nativeQrTracks.every(track => track.readyState === 'ended'), null, { polling: 100 });
  await page.getByRole('button', { name: 'Resume Camera' }).waitFor();
  await page.getByRole('button', { name: 'Resume Camera' }).click();
  await page.getByText('Point your camera at a room QR code.').waitFor();
  await page.waitForTimeout(400);
  assert.equal(await page.locator('video').evaluate(video => video.srcObject?.getTracks().some(track => track.readyState === 'live')), true);
  await page.getByRole('button', { name: 'Choose Floor Manually' }).click();
  console.log('PASS Android: background releases camera, explicit resume works, manual fallback remains available.');

  // Keep the actual native camera checks above; simulate frames only for deterministic room decoding.
  await page.evaluate(() => {
    window.originalQrGetUserMedia = navigator.mediaDevices.getUserMedia;
    window.roomQrTracks = [];
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 640;
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.src = window.roomQrImage;
      await image.decode();
      const stream = canvas.captureStream(10);
      window.roomQrTracks.push(...stream.getTracks());
      const paint = () => {
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 640, 640);
        ctx.drawImage(image, 100, 100, 440, 440);
        if (stream.getTracks().some(track => track.readyState === 'live')) requestAnimationFrame(paint);
      };
      paint();
      return stream;
    } });
  });
  for (const room of ROOM_CHECKPOINTS) {
    const image = await QRCode.toDataURL(roomMapPath(room.id), { width: 440, margin: 4 });
    await page.evaluate(image => { window.roomQrImage = image; }, image);
    await page.getByRole('button', { name: 'Scan QR', exact: true }).click();
    await page.waitForURL(url => url.searchParams.get('room') === room.id);
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    await page.getByRole('button', { name: room.floorId + ' Floor', exact: true }).and(page.locator('[aria-pressed="true"]')).waitFor();
    await page.waitForFunction(name => [...document.querySelectorAll('svg g[role="button"]')].some(el => el.getAttribute('aria-label') === name && el.querySelector('rect[stroke-width="5"]')), room.name);
    await page.waitForFunction(name => [...document.querySelectorAll('svg g[role="button"]')].some(el => {
      if (el.getAttribute('aria-label') !== name) return false;
      const room = el.querySelector('rect').getBoundingClientRect();
      const viewport = el.closest('section').getBoundingClientRect();
      return Math.abs(room.x + room.width / 2 - (viewport.x + viewport.width / 2)) < 32 &&
        Math.abs(room.y + room.height / 2 - (viewport.y + viewport.height / 2)) < 32;
    }), room.name);
    await page.waitForFunction(() => window.roomQrTracks.every(track => track.readyState === 'ended'));
  }
  assert.equal(await page.evaluate(() => localStorage.getItem('ccs-indoor-current-location')), saved.pin);
  console.log('PASS Android packaged WebView: all 11 room QR decodes, correct floors/highlights, camera cleanup, and preserved location pin.');
} catch (error) {
  console.log('Native failure state:', await page.evaluate(() => ({ path: location.pathname, hidden: document.hidden, status: document.querySelector('.floor-qr-status')?.textContent, visibility: window.nativeVisibilityEvents, video: [...document.querySelectorAll('video')].map(v => ({ ready: v.readyState, width: v.videoWidth, tracks: v.srcObject?.getTracks().map(t => t.readyState) })) })).catch(() => 'WebView unavailable'));
  throw error;
} finally {
  await page.evaluate(async saved => {
    if (window.originalQrGetUserMedia) Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: window.originalQrGetUserMedia });
    const preferences = window.Capacitor.Plugins.Preferences;
    if (saved.native === null) await preferences.remove({ key: 'ccs-connect-auth' });
    else await preferences.set({ key: 'ccs-connect-auth', value: saved.native });
    for (const [key, value] of [['ccs-connect-auth', saved.web], ['ccs-indoor-current-location', saved.pin]]) {
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    }
  }, saved);
  await context.unroute('**/auth/v1/**', backendFixture);
  await context.unroute('**/rest/v1/**', backendFixture);
  await page.goto(saved.url).catch(() => {});
  await browser.close();
  adb('forward', '--remove', 'tcp:9223');
  if (!originallyGranted) adb('shell', 'pm', 'revoke', appId, permission);
  console.log('Native QR verification cleanup complete: original storage and camera permission restored.');
}
