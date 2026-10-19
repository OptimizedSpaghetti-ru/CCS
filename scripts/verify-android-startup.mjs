// Run against a booted debug emulator after installing the debug APK.
// Never uses a real account. Saves/restores both native and web session storage.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
const { chromium } = await import(process.env.CCS_PLAYWRIGHT_MODULE || 'playwright');
const adbPath = process.env.CCS_ADB || path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const adb = (...args) => execFileSync(adbPath, args, { encoding: 'utf8', windowsHide: true }).trim();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const appId = 'com.ccs.connect';

async function connect() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const pid = adb('shell', 'pidof', '-s', appId);
      if (pid) {
        adb('forward', 'tcp:9223', `localabstract:webview_devtools_remote_${pid}`);
        const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 1000 });
        let page = browser.contexts().flatMap(c => c.pages())[0];
        if (!page) page = await browser.contexts()[0].waitForEvent('page', { timeout: 1000 });
        return { browser, page };
      }
    } catch { /* The WebView debugging socket may still be starting. */ }
    await delay(100);
  }
  throw new Error('Android debug WebView did not become available');
}

async function coldLaunch() {
  adb('shell', 'am', 'force-stop', appId);
  adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
  return connect();
}

let connection = await connect();
const saved = await connection.page.evaluate(async () => ({
  native: (await window.Capacitor.Plugins.Preferences.get({ key: 'ccs-connect-auth' })).value,
  web: localStorage.getItem('ccs-connect-auth'),
}));
const wifi = adb('shell', 'settings', 'get', 'global', 'wifi_on');
const data = adb('shell', 'settings', 'get', 'global', 'mobile_data');

async function writeSession(value) {
  await connection.page.evaluate(async value => {
    const prefs = window.Capacitor.Plugins.Preferences;
    if (value === null) { await prefs.remove({ key: 'ccs-connect-auth' }); localStorage.removeItem('ccs-connect-auth'); }
    else { await prefs.set({ key: 'ccs-connect-auth', value }); localStorage.setItem('ccs-connect-auth', value); }
  }, value);
}

try {
  // Keep synthetic tokens entirely offline, including during native cold launches.
  adb('shell', 'svc', 'wifi', 'disable');
  adb('shell', 'svc', 'data', 'disable');
  await writeSession(null);
  await connection.browser.close();
  connection = await coldLaunch();
  const page = connection.page;
  const sawColdSplash = await page.locator('[data-startup-splash]').count() > 0;
  await page.getByRole('button', { name: 'Log In', exact: true }).waitFor({ timeout: 15000 });
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  assert.equal(await page.locator('video, .splash-title').count(), 0);
  console.log(`PASS: offline logged-out Android cold launch reaches welcome; animation observed=${sawColdSplash}`);

  // Reload in the same real WebView to observe all geometry and the full timeline.
  if (process.env.CCS_ANDROID_SCREENSHOT) {
    // Capture immediately after React mounts; separate CDP round trips can be
    // slower than the entire 1.56s sequence on a software-rendered emulator.
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const el = document.querySelector('[data-animated-splash]');
        const animations = el?.getAnimations({ subtree: true }) || [];
        if (!animations.length) return;
        observer.disconnect();
        animations.forEach(a => a.pause());
        void Promise.all(animations.map(a => a.ready)).then(() => {
          animations.forEach(a => { a.currentTime = 500; });
          window.__splashInspectionReady = true;
        });
      });
      observer.observe(document, { childList: true, subtree: true });
    });
  }
  await page.reload();
  if (process.env.CCS_ANDROID_SCREENSHOT) await page.waitForFunction(() => window.__splashInspectionReady);
  await page.locator('[data-animated-splash]').waitFor();
  assert.equal(await page.locator('[data-animated-splash] img').evaluate(i => i.complete && i.naturalWidth === 498), true);
  assert.equal(await page.locator('.splash-effects').evaluate(el => el.getAnimations({ subtree: true }).length > 0), true);
  if (process.env.CCS_ANDROID_SCREENSHOT) {
    writeFileSync(process.env.CCS_ANDROID_SCREENSHOT, execFileSync(adbPath, ['exec-out', 'screencap', '-p'], { windowsHide: true }));
    await page.locator('[data-animated-splash]').evaluate(el => el.getAnimations({ subtree: true }).forEach(a => a.play()));
  }
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  assert.equal(await page.locator('video, .splash-title').count(), 0);
  const launchTime = await page.evaluate(() => performance.timeOrigin);
  adb('shell', 'input', 'keyevent', '3');
  adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
  for (let i = 0; i < 10; i++) {
    assert.equal(await page.locator('[data-startup-splash]').count(), 0);
    assert.equal(await page.evaluate(() => performance.timeOrigin), launchTime);
    await delay(100);
  }
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await page.waitForURL('**/login');
  assert.equal(await page.locator('[data-startup-splash]').count(), 0);
  console.log('PASS: real Android WebView vector playback, local logo, navigation and background/resume without replay or document reload');

  const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const uid = '11111111-1111-4111-8111-111111111111';
  const session = { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'offline-fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: uid, aud: 'authenticated', role: 'authenticated', email: 'native-fixture@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Native Splash Fixture', role: 'student', status: 'approved' }, created_at: '2026-01-01T00:00:00Z' } };
  await writeSession(JSON.stringify(session));
  await connection.browser.close();
  connection = await coldLaunch();
  await connection.page.waitForURL('**/app/home', { timeout: 20000 });
  await connection.page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  assert.ok(await connection.page.evaluate(async () => (await window.Capacitor.Plugins.Preferences.get({ key: 'ccs-connect-auth' })).value));
  console.log('PASS: offline Android cold launch restores synthetic approved session from native Preferences to Home without login prompt');
} finally {
  try {
    if (connection.page.isClosed()) connection = await connect();
    await connection.page.evaluate(async saved => {
      const prefs = window.Capacitor.Plugins.Preferences;
      if (saved.native === null) await prefs.remove({ key: 'ccs-connect-auth' });
      else await prefs.set({ key: 'ccs-connect-auth', value: saved.native });
      if (saved.web === null) localStorage.removeItem('ccs-connect-auth');
      else localStorage.setItem('ccs-connect-auth', saved.web);
    }, saved);
    // Reload while still offline so the synthetic session leaves in-memory state.
    await connection.page.reload();
  } finally {
    if (wifi === '1') adb('shell', 'svc', 'wifi', 'enable');
    if (data === '1') adb('shell', 'svc', 'data', 'enable');
    await connection.browser.close();
    adb('forward', '--remove', 'tcp:9223');
  }
}
