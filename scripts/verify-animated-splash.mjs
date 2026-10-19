// Optional external Playwright installation; no application dependency added.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.CCS_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    await page.goto(process.env.CCS_ANIMATED_SPLASH_URL || 'http://127.0.0.1:5174/');
    await page.getByRole('heading', { name: 'Splash animation preview' }).waitFor();
    await page.getByRole('status').filter({ hasText: 'Finished' }).waitFor();
    assert.equal(await page.locator('[data-animated-splash] video').count(), 0);
    assert.equal(await page.locator('[data-animated-splash] img').evaluate(i => i.complete && i.naturalWidth === 498 && i.naturalHeight === 501), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole('button', { name: 'Replay both' }).click();
    await page.getByRole('status').filter({ hasText: 'Playing' }).waitFor();
    await page.getByRole('status').filter({ hasText: 'Finished' }).waitFor();
    await page.getByLabel('Compare timestamp').fill('0.5');
    await page.getByLabel('Compare timestamp').dispatchEvent('input');
    await page.waitForTimeout(150);
    const time = await page.locator('video').evaluate(v => v.currentTime);
    assert.ok(Math.abs(time - 0.5) < 0.04, `Reference seek: ${time}`);
    const animations = await page.locator('[data-animated-splash]').evaluate(el => el.getAnimations({ subtree: true }).map(a => ({ time: a.currentTime, state: a.playState })));
    assert.ok(animations.length >= 5);
    assert.ok(animations.every(a => a.state === 'paused' && Math.abs(a.time - 500) < 1));
    await page.getByLabel('Compare timestamp').fill('1.56');
    await page.getByLabel('Compare timestamp').dispatchEvent('input');
    assert.equal(await page.locator('.splash-effects').evaluate(el => getComputedStyle(el).opacity), '0');
    assert.equal(await page.locator('[data-animated-splash] img').evaluate(el => getComputedStyle(el).opacity), '1');
    await page.getByLabel('Overlay comparison').check();
    await page.getByLabel('Original opacity').fill('0.25');
    assert.equal(await page.locator('.reference').evaluate(el => getComputedStyle(el).opacity), '0.25');
    await page.getByLabel('Overlay comparison').uncheck();
    await page.getByRole('button', { name: 'Full screen', exact: true }).click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    assert.equal(await page.locator('.reference').isVisible(), false);
    const size = await page.locator('.phone-stage').first().boundingBox();
    assert.ok(Math.abs(size.width / size.height - 9 / 16) < 0.002);
    await page.evaluate(() => document.exitFullscreen());
    assert.ok(!requests.some(url => /supabase|auth\/v1|rest\/v1/.test(url)), 'Preview must never initialize backend/auth');
    assert.deepEqual(errors, []);
    if (viewport.width === 1440) {
      const lifecycle = await page.evaluate(async () => {
        const fixture = await import('/lifecycle.fixture.tsx');
        return fixture.verifyLifecycle();
      });
      assert.deepEqual(lifecycle, { once: 1, afterUnmount: 1, runningAfterUnmount: 0 });
      console.log('PASS: StrictMode callback fires once; unmount cancels playback and callback');
    }
    console.log(`PASS ${viewport.width}px: autoplay, completion, replay, synchronized seek, final logo, no auth requests or overflow`);
    await page.close();
  }
} finally { await browser.close(); }
