import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const { chromium } = await import(process.env.CCS_PLAYWRIGHT_MODULE || 'playwright');
const adbPath = process.env.CCS_ADB || path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const adb = (...args) => execFileSync(adbPath, args, { encoding: 'utf8', windowsHide: true }).trim();
assert.match(adb('get-serialno'), /^emulator-/, 'Only change network state on the test emulator');
const wifi = adb('shell', 'settings', 'get', 'global', 'wifi_on') !== '0';
const mobile = adb('shell', 'settings', 'get', 'global', 'mobile_data') !== '0';
const network = (wifiEnabled, dataEnabled) => {
  adb('shell', 'svc', 'wifi', wifiEnabled ? 'enable' : 'disable');
  adb('shell', 'svc', 'data', dataEnabled ? 'enable' : 'disable');
};
async function connect() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const pid = adb('shell', 'pidof', '-s', 'com.ccs.connect');
      adb('forward', 'tcp:9223', `localabstract:webview_devtools_remote_${pid}`);
      const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 1000 });
      const page = browser.contexts().flatMap(context => context.pages())[0];
      if (page) return { browser, page };
      await browser.close();
    } catch { /* WebView is still launching. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Debug Android WebView did not start');
}
let connection = await connect();
const saved = await connection.page.evaluate(async () => ({
  native: (await window.Capacitor.Plugins.Preferences.get({ key: 'ccs-connect-auth' })).value,
  web: localStorage.getItem('ccs-connect-auth'),
}));
try {
  network(true, true);
  await connection.page.evaluate(async () => {
    await window.Capacitor.Plugins.Preferences.remove({ key: 'ccs-connect-auth' });
    localStorage.removeItem('ccs-connect-auth');
  });
  await connection.page.goto('https://localhost/login');
  await connection.page.locator('[data-startup-splash]').waitFor({ state: 'detached', timeout: 30000 });
  await connection.page.locator('input').first().fill('native-offline-draft@example.invalid');
  network(false, false);
  let screen = connection.page.getByRole('dialog', { name: 'No Internet Connection' });
  await screen.waitFor({ timeout: 30000 });
  assert.equal(await connection.page.evaluate(async () => (await window.Capacitor.Plugins.Network.getStatus()).connected), false);
  await connection.page.getByRole('button', { name: 'Retry Connection', exact: true }).click();
  await connection.page.getByRole('button', { name: 'Retry Connection', exact: true }).waitFor();
  assert.ok(await screen.isVisible());
  await connection.page.screenshot({ path: 'artifacts/offline/android.png' });
  network(true, false);
  await screen.waitFor({ state: 'detached', timeout: 45000 });
  assert.equal(await connection.page.locator('input').first().inputValue(), 'native-offline-draft@example.invalid');
  console.log('PASS Android: Wi-Fi/data disabled, native disconnected status, Retry offline, automatic Wi-Fi recovery and mounted draft');

  // Emulated mobile data handoff; never claims a physical carrier test.
  network(false, true);
  await connection.page.waitForFunction(async () => (await window.Capacitor.Plugins.Network.getStatus()).connected, undefined, { timeout: 30000 });
  await screen.waitFor({ state: 'detached', timeout: 45000 });
  assert.equal(await connection.page.locator('input').first().inputValue(), 'native-offline-draft@example.invalid');
  console.log('PASS Android: emulated Wi-Fi to mobile-data handoff retains page and input');

  network(false, false);
  await screen.waitFor({ timeout: 30000 });
  await connection.page.reload();
  await screen.waitFor({ timeout: 30000 });
  adb('shell', 'am', 'force-stop', 'com.ccs.connect');
  adb('shell', 'am', 'start', '-n', 'com.ccs.connect/.MainActivity');
  connection = await connect();
  screen = connection.page.getByRole('dialog', { name: 'No Internet Connection' });
  await screen.waitFor({ timeout: 30000 });
  network(true, true);
  await screen.waitFor({ state: 'detached', timeout: 45000 });
  await connection.page.locator('[data-startup-splash]').waitFor({ state: 'detached', timeout: 30000 });
  console.log('PASS Android: offline WebView refresh, cold launch without internet, automatic startup recovery');
} finally {
  network(wifi, mobile);
  await connection.page.evaluate(async saved => {
    if (saved.native) await window.Capacitor.Plugins.Preferences.set({ key: 'ccs-connect-auth', value: saved.native });
    else await window.Capacitor.Plugins.Preferences.remove({ key: 'ccs-connect-auth' });
    if (saved.web) localStorage.setItem('ccs-connect-auth', saved.web); else localStorage.removeItem('ccs-connect-auth');
  }, saved).catch(() => {});
  await connection.browser.close();
}
