// Emulator-only verification of the installed debug APK. Preserve existing auth/pin state.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { checkRoomInteractions, checkGestures, checkTouchSlop } from './lib/indoor-room-interaction-checks.mjs';

const adbPath = process.env.CCS_ADB || path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const adb = (...args) => execFileSync(adbPath, args, { encoding: 'utf8', windowsHide: true }).trim();
assert.match(adb('get-serialno'), /^emulator-/, 'Native map verification must run only on a test emulator');
const appId = 'com.ccs.connect';
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
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'native-map@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Native Map Test', role: 'student', status: 'approved' }, created_at: '2026-01-01T00:00:00Z' };
const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const session = { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'local-fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
const context = page.context();
await context.routeWebSocket(/.*/, socket => socket.close());
const backendFixture = route => route.fulfill({ json: route.request().url().includes('/profiles') ? { id: user.id, full_name: 'Native Map Test', role: 'student', status: 'approved' } : route.request().url().includes('/auth/') ? user : [] });
await context.route('**/auth/v1/**', backendFixture);
await context.route('**/rest/v1/**', backendFixture);
try {
  await page.evaluate(async value => {
    await window.Capacitor.Plugins.Preferences.set({ key: 'ccs-connect-auth', value });
    localStorage.setItem('ccs-connect-auth', value);
  }, JSON.stringify(session));
  await page.goto('https://localhost/app/map?view=indoor');
  await page.getByRole('heading', { name: 'Indoor Map Navigation' }).waitFor({ timeout: 30000 });
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  const client = await context.newCDPSession(page);
  const touch = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((point, id) => ({ ...point, id })) });
  const result = await checkRoomInteractions(page, 'touch', { tap: async (x, y) => {
    await touch('touchStart', [{ x, y }]);
    await touch('touchEnd', []);
  } });
  await mkdir('artifacts/room-interactions', { recursive: true });
  await writeFile('artifacts/room-interactions/android-results.json', JSON.stringify(result, null, 2));
  assert.equal(result.failures.length, 0, 'all native WebView room faces and edges must select correctly');
  console.log(`PASS Android WebView: ${result.count} room-face/edge taps across ${result.rooms} rooms on ${result.floors} floors.`);

  // Use actual WebView bounds to map CSS coordinates to OS-level input pixels.
  const dumpPath = '/data/local/tmp/ccs-map-interaction-window.xml';
  adb('shell', 'uiautomator', 'dump', dumpPath);
  const xml = adb('shell', 'cat', dumpPath);
  const node = xml.match(/<node\b[^>]*class="android\.webkit\.WebView"[^>]*>/)?.[0];
  const bounds = node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  assert.ok(bounds, 'actual native WebView bounds must be available');
  const [, left, top, right] = bounds.map(Number);
  const width = await page.evaluate(() => innerWidth);
  const pixelScale = (right - left) / width;
  const native = await checkRoomInteractions(page, 'touch', { centersOnly: true, tap: async (x, y) => {
    adb('shell', 'input', 'tap', String(Math.round(left + x * pixelScale)), String(Math.round(top + y * pixelScale)));
  } });
  await writeFile('artifacts/room-interactions/android-adb-results.json', JSON.stringify(native, null, 2));
  assert.equal(native.failures.length, 0, 'actual Android system taps must select every room');
  console.log(`PASS Android system input: all ${native.count} room centers selected with ADB taps.`);
  await checkTouchSlop(page, touch);
  await checkGestures(page, { touch });
  await client.detach();
  assert.equal(await page.evaluate(() => localStorage.getItem('ccs-indoor-current-location')), saved.pin);
  await page.screenshot({ path: 'artifacts/room-interactions/android-gestures.png' });
} finally {
  await page.evaluate(async saved => {
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
  console.log('Native map verification cleanup complete: original auth, location pin, and URL restored.');
}
