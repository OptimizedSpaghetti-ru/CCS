// Uses optional external Playwright; all authentication sessions are local fixtures.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.CCS_PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.CCS_SPLASH_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const splashSelector = '[data-startup-splash]';
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const page = await browser.newPage({ viewport });
    const mediaRequests = [];
    page.on('request', r => { if (/\.mp4|splash-poster/.test(r.url())) mediaRequests.push(r.url()); });
    await page.goto(baseURL);
    await page.locator(splashSelector).waitFor();
    assert.equal(await page.locator(`${splashSelector} [data-animated-splash]`).count(), 1);
    assert.equal(await page.locator('video, .splash-title').count(), 0);
    await page.getByRole('button', { name: 'Log In', exact: true }).waitFor();
    await page.locator(splashSelector).waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Log In', exact: true }).click();
    await page.waitForURL('**/login');
    assert.equal(await page.locator(splashSelector).count(), 0);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    assert.equal(await page.locator(splashSelector).count(), 0);
    await page.reload();
    await page.locator(splashSelector).waitFor();
    await page.waitForURL(new URL('/login', baseURL).href);
    await page.locator(splashSelector).waitFor({ state: 'detached' });
    assert.deepEqual(mediaRequests, []);
    console.log(`PASS ${viewport.width}px: vector startup, no neon/video requests, welcome, navigation/resume without replay, reload replays`);
    await page.close();
  }

  const tokenPart = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const userId = '11111111-1111-4111-8111-111111111111';
  const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'splash-test@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Splash Test', role: 'student', status: 'approved' }, created_at: '2026-01-01T00:00:00Z' };
  const session = { access_token: `${tokenPart({ alg: 'HS256', typ: 'JWT' })}.${tokenPart({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'local-fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
  for (const status of ['approved', 'pending']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(s => localStorage.setItem('ccs-connect-auth', JSON.stringify(s)), session);
    await context.route('**/auth/v1/**', r => r.fulfill({ json: user }));
    await context.route('**/rest/v1/**', async r => {
      const profile = r.request().url().includes('/profiles');
      if (profile) await new Promise(resolve => setTimeout(resolve, 4000));
      await r.fulfill({ json: profile ? { id: userId, full_name: 'Splash Test', role: 'student', status } : [] });
    });
    const page = await context.newPage();
    await page.goto(baseURL);
    await page.waitForFunction(() => document.querySelector('[data-startup-splash]')?.dataset.playbackComplete === 'true');
    assert.equal(await page.locator(splashSelector).count(), 1, 'Hold final artwork until auth initialization finishes');
    assert.equal(await page.getByRole('button', { name: 'Log In', exact: true }).count(), 0);
    await page.waitForURL(`**/${status === 'approved' ? 'app/home' : 'pending-approval'}`);
    await page.locator(splashSelector).waitFor({ state: 'detached' });
    assert.ok(await page.evaluate(() => localStorage.getItem('ccs-connect-auth')), 'Keep persistent session');
    console.log(`PASS: delayed ${status} session, correct destination, no welcome flicker, persistent login`);
    await context.close();
  }

  const resume = await browser.newPage();
  await resume.goto(baseURL);
  await resume.locator('[data-animated-splash]').waitFor();
  await resume.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const before = await resume.locator('[data-animated-splash]').evaluate(async el => {
    const animations = el.getAnimations({ subtree: true });
    await Promise.all(animations.map(a => a.ready));
    return animations.map(a => a.currentTime);
  });
  await resume.waitForTimeout(400);
  const after = await resume.locator('[data-animated-splash]').evaluate(el => el.getAnimations({ subtree: true }).map(a => ({ time: a.currentTime, state: a.playState })));
  assert.ok(after.every((a, i) => a.state === 'paused' && Math.abs(a.time - before[i]) < 1));
  await resume.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await resume.locator(splashSelector).waitFor({ state: 'detached' });
  console.log('PASS: interrupted playback pauses in background and resumes without restarting');
  await resume.close();

  const brokenAnimation = await browser.newPage();
  await brokenAnimation.addInitScript(() => { Element.prototype.animate = () => { throw new Error('Animation failure fixture'); }; });
  await brokenAnimation.goto(baseURL);
  await brokenAnimation.getByRole('button', { name: 'Log In', exact: true }).waitFor();
  await brokenAnimation.locator(splashSelector).waitFor({ state: 'detached' });
  console.log('PASS: animation failure falls back without blocking authentication/navigation');
  await brokenAnimation.close();

  const authFailure = await browser.newPage();
  await authFailure.route('**/src/lib/supabase.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nsupabase.auth.getSession = async () => { throw new Error('Session initialization failure fixture'); };` });
  });
  await authFailure.goto(baseURL);
  await authFailure.getByRole('button', { name: 'Retry startup', exact: true }).waitFor();
  assert.equal(await authFailure.locator(splashSelector).count(), 1);
  assert.equal(await authFailure.getByRole('button', { name: 'Log In', exact: true }).count(), 0);
  console.log('PASS: rejected session initialization retains final splash with recovery instead of forcing login');
  await authFailure.close();

  const recovery = await browser.newPage();
  await recovery.goto(new URL('/reset-password', baseURL).href);
  await recovery.locator(splashSelector).waitFor({ state: 'detached' });
  assert.equal(new URL(recovery.url()).pathname, '/reset-password');
  console.log('PASS: password-recovery route remains intact');
  await recovery.close();

  const offline = await browser.newPage();
  await offline.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
  await offline.goto(baseURL);
  await offline.locator('[data-animated-splash] img').waitFor();
  assert.equal(await offline.locator('[data-animated-splash] img').evaluate(i => i.complete && i.naturalWidth > 0), true);
  await offline.getByRole('button', { name: 'Log In', exact: true }).waitFor();
  await offline.locator(splashSelector).waitFor({ state: 'detached' });
  console.log('PASS: animation and logged-out startup work with external network requests blocked');
  await offline.close();
} finally { await browser.close(); }
