// Emulator-only verification of the installed debug APK. Preserve existing auth/pin state.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { checkGestures } from './lib/indoor-room-interaction-checks.mjs';

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
  await page.evaluate(() => { window.__refreshCount = 0; window.addEventListener('ccs:refresh', () => window.__refreshCount++); });
  const pull = async (selector) => {
    await page.evaluate(selector => {
      window.scrollTo(0, 0);
      const target = document.querySelector(selector);
      window.__pullTarget = target;
      const send = (type, y) => target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target, clientX: 180, clientY: y })] }));
      send('touchstart', 120);
    }, selector);
    await page.waitForTimeout(50);
    const prevented = await page.evaluate(() => !window.__pullTarget.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: window.__pullTarget, clientX: 180, clientY: 460 })] })));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.__pullTarget.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [] })));
    await page.waitForTimeout(450);
    return prevented;
  };
  assert.equal(await pull('.app-container'), false, 'Indoor map pull must not be intercepted');
  assert.equal(await page.evaluate(() => window.__refreshCount), 0);
  await checkGestures(page, { touch });
  await page.getByRole('button', { name: 'Outdoor Map', exact: true }).click();
  await page.locator('.leaflet-container').waitFor();
  assert.equal(await pull('.app-container'), false, 'Outdoor map pull must not be intercepted');
  assert.equal(await page.evaluate(() => window.__refreshCount), 0);
  const map = page.locator('.leaflet-container');
  const box = await map.boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const transform = () => page.locator('.leaflet-map-pane').evaluate(el => el.style.transform);
  const before = await transform();
  await touch('touchStart', [{ x, y }]);
  for (let i = 1; i <= 8; i++) await touch('touchMove', [{ x: x + i * 6, y: y + i * 12 }]);
  await touch('touchEnd', []);
  await page.waitForTimeout(500);
  assert.notEqual(await transform(), before, 'Outdoor touch pan remains functional');
  assert.equal(await page.evaluate(() => window.__refreshCount), 0);
  // Navigate without reloading to prove the route subscription re-enables refresh.
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.waitForURL('**/app/home');
  await page.waitForTimeout(600);
  await pull('.app-container');
  await page.waitForFunction(() => window.__refreshCount === 1, null, { timeout: 15000 });
  assert.equal(await page.evaluate(() => window.__refreshCount), 1, 'Home pull still refreshes');
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await page.waitForURL('**/app/map');
  await page.waitForTimeout(600);
  await pull('.app-container');
  assert.equal(await page.evaluate(() => window.__refreshCount), 1, 'Returning to Maps disables refresh again');
  await mkdir('artifacts/map-refresh', { recursive: true });
  await writeFile('artifacts/map-refresh/android-results.json', JSON.stringify({ indoorRefreshBlocked: true, outdoorRefreshBlocked: true, indoorGestures: true, outdoorPan: true, homeRefresh: true, returnToMap: true }, null, 2));
  console.log('PASS Android Maps: no pull interception or refresh in either mode; map gestures and Home refresh preserved.');
  await client.detach();
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

