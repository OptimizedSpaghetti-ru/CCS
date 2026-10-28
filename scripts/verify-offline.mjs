import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const { chromium } = await import(process.env.CCS_PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.CCS_OFFLINE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
mkdirSync('artifacts/offline', { recursive: true });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(`${baseURL}/login`);
    await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    });
    const input = page.locator('input').first();
    await input.fill('offline-draft@example.invalid');
    await context.setOffline(true);
    const screen = page.locator('.offline-banner');
    await screen.waitFor();
    await input.fill('offline-draft@example.invalid');
    assert.equal(await screen.getByRole('button').count(), 0);
    assert.ok(await screen.isVisible());
    assert.equal(await input.inputValue(), 'offline-draft@example.invalid');
    assert.equal(await page.locator('[inert]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `artifacts/offline/web-${viewport.width}.png` });
    await context.setOffline(false);
    await screen.waitFor({ state: 'detached', timeout: 25000 });
    assert.equal(await input.inputValue(), 'offline-draft@example.invalid');
    assert.ok(page.url().endsWith('/login'));
    await context.setOffline(true);
    await screen.waitFor();
    await page.reload();
    await screen.waitFor();
    assert.ok(page.url().endsWith('/login'));
    await context.setOffline(false);
    await screen.waitFor({ state: 'detached', timeout: 25000 });
    await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
    await page.locator('input').first().waitFor();
    assert.ok(page.url().endsWith('/login'));
    // A second offline navigation also uses the shell and preserves the requested route.
    await context.setOffline(true);
    await page.goto(`${baseURL}/register`);
    await screen.waitFor();
    await context.setOffline(false);
    await screen.waitFor({ state: 'detached', timeout: 25000 });
    await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
    assert.ok(page.url().endsWith('/register'));
    console.log(`PASS ${viewport.width}px: offline banner, interactive offline draft, mounted draft, automatic recovery, cached offline reload/open and route preservation`);
    await context.close();
  }

  const tokenPart = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const userId = '11111111-1111-4111-8111-111111111111';
  const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'offline-test@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Offline Test', role: 'student', status: 'approved' }, created_at: '2026-01-01T00:00:00Z' };
  const session = { access_token: `${tokenPart({ alg: 'HS256', typ: 'JWT' })}.${tokenPart({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'local-fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
  const context = await browser.newContext();
  await context.addInitScript(session => localStorage.setItem('ccs-connect-auth', JSON.stringify(session)), session);
  let profileReads = 0;
  await context.route('**/auth/v1/user*', route => route.fulfill({ json: user }));
  await context.route('**/rest/v1/**', async route => {
    const profile = route.request().url().includes('/profiles');
    if (profile && ++profileReads === 1) {
      await context.setOffline(true);
      await route.abort('internetdisconnected');
    } else await route.fulfill({ json: profile ? { id: userId, full_name: 'Offline Test', role: 'student', status: 'approved' } : [] });
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/app/messages/compose`);
  const screen = page.locator('.offline-banner');
  await screen.waitFor();
  assert.ok(await page.evaluate(() => localStorage.getItem('ccs-connect-auth')));
  await context.setOffline(false);
  await screen.waitFor({ state: 'detached', timeout: 25000 });
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  assert.ok(page.url().endsWith('/app/messages/compose'));
  assert.ok(profileReads >= 2);
  assert.ok(await page.evaluate(() => localStorage.getItem('ccs-connect-auth')));
  console.log('PASS: interrupted Supabase profile read recovers, authenticated deep link and stored session preserved');
  await page.goto(`${baseURL}/app/home`);
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  await page.locator('[data-offline-bottom-anchor]').waitFor();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const before = await page.locator('[data-offline-bottom-anchor]').boundingBox();
    await context.setOffline(true);
    await screen.waitFor();
    for (const dark of [false, true]) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
      await page.waitForTimeout(100);
      const banner = await screen.boundingBox();
      const nav = await page.locator('[data-offline-bottom-anchor]').boundingBox();
      assert.ok(Math.abs(banner.y + banner.height - nav.y) < 2);
      assert.deepEqual(nav, before);
      assert.equal(await page.locator('[data-offline-bottom-anchor] button').count(), 5);
      await page.screenshot({ path: `artifacts/offline/banner-${width}-${dark ? 'dark' : 'light'}.png` });
    }
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.waitForURL('**/app/profile');
    assert.equal(await screen.count(), 1);
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await page.waitForURL('**/app/home');
    await context.setOffline(false);
    await screen.waitFor({ state: 'detached', timeout: 25000 });
  }
  console.log('PASS: light/dark banner, 320/390/1440px, unchanged nav geometry, five buttons and offline route navigation');
  await context.close();

  const probeContext = await browser.newContext();
  let probeMode = 'server-error';
  await probeContext.route(/\/auth\/v1\/health\?|\/connectivity\.txt\?/, async route => {
    if (probeMode === 'network-error') await route.abort('failed');
    else if (probeMode === 'slow') {
      await new Promise(resolve => setTimeout(resolve, 7000));
      await route.fulfill({ status: 200, body: 'ok', headers: { 'Access-Control-Allow-Origin': '*' } }).catch(() => {});
    } else await route.fulfill({ status: 503, body: 'Service unavailable', headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  const probePage = await probeContext.newPage();
  await probePage.goto(`${baseURL}/login`);
  await probePage.locator('[data-startup-splash]').waitFor({ state: 'detached' });
  assert.equal(await probePage.locator('.offline-banner').count(), 0);
  probeMode = 'network-error';
  await probePage.evaluate(() => window.dispatchEvent(new Event('focus')));
  await probePage.locator('.offline-banner').waitFor();
  assert.equal(await probePage.evaluate(() => navigator.onLine), true);
  probeMode = 'server-error';
  await probePage.evaluate(() => window.dispatchEvent(new Event('online')));
  await probePage.locator('.offline-banner').waitFor({ state: 'detached' });
  probeMode = 'slow';
  await probePage.evaluate(() => window.dispatchEvent(new Event('focus')));
  await probePage.waitForTimeout(7500);
  assert.equal(await probePage.locator('.offline-banner').count(), 0);
  console.log('PASS: actual transport failures with navigator.onLine=true show offline; HTTP 503 and slow probes do not');
  await probeContext.close();
} finally { await browser.close(); }
