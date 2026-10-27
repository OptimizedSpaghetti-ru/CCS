// Exercise real browser hit-testing at projected screen coordinates.
// Authentication/backend responses are local fixtures; no production data is modified.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { indoorFloorConfigs } from '../src/data/indoorMapData.js';



const baseURL = process.env.CCS_MAP_URL || 'http://127.0.0.1:5175';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'map-test@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Map Test', role: 'student', status: 'approved' }, created_at: '2026-01-01T00:00:00Z' };
const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const session = { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'local-fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };

try {
  for (const input of ['mouse', 'touch', 'narrow-touch']) {
    const context = await browser.newContext({ viewport: input === 'mouse' ? { width: 1440, height: 1100 } : { width: input === 'touch' ? 390 : 320, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await context.routeWebSocket(/.*/, socket => socket.close());
    await context.addInitScript(session => localStorage.setItem('ccs-connect-auth', JSON.stringify(session)), session);
    await context.route('**/auth/v1/**', route => route.fulfill({ json: user }));
    await context.route('**/rest/v1/**', route => route.fulfill({ json: route.request().url().includes('/profiles') ? { id: user.id, full_name: 'Map Test', role: 'student', status: 'approved' } : [] }));
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseURL}/app/map?view=indoor`);
    await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
    const activate = locator => input === 'mouse' ? locator.click() : locator.tap();
    const mark = page.getByRole('button', { name: 'Mark Arrived and Set as Start Point', exact: true });
    const navigate = page.getByRole('button', { name: 'Navigate to Selected Area', exact: true });
    const pin = () => page.evaluate(() => JSON.parse(localStorage.getItem('ccs-indoor-current-location')));
    const assertPin = async (floorId, room) => {
      const value = await pin();
      assert.equal(value.floorId, floorId);
      assert.equal(value.x, room.x + room.w / 2);
      assert.equal(value.y, room.y + room.h / 2);
    };
    const first = indoorFloorConfigs['1st'].rooms.find(room => room.id === 'pt-lecture');
    await page.getByLabel('Choose room or area').selectOption(first.id);
    assert.equal(await mark.count(), 1);
    assert.equal(await mark.textContent(), '');
    assert.equal(await page.locator('[data-guidance-step]').count(), 0);
    await activate(mark);
    await assertPin('1st', first);
    assert.equal(await page.locator('[data-guidance-step]').count(), 0);
    // The newly persisted start must survive a reload.
    await page.reload();
    await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
    await assertPin('1st', first);
    await activate(page.getByRole('button', { name: '3rd Floor', exact: true }));
    const target = indoorFloorConfigs['3rd'].rooms.find(room => room.type === 'room');
    await page.getByLabel('Choose room or area').selectOption(target.id);
    await activate(navigate);
    await page.locator('[data-guidance-step]').first().waitFor();
    // Select a different room during a route: the button must use selection, not the old destination.
    await page.getByLabel('Choose room or area').selectOption(first.id);
    const row = await mark.evaluate(el => {
      const parent = el.parentElement;
      return { count: parent.querySelectorAll('button').length, width: el.offsetWidth, height: el.offsetHeight, overflow: parent.scrollWidth > parent.clientWidth, color: getComputedStyle(el).backgroundColor };
    });
    assert.equal(row.count, 3);
    assert.equal(row.width, 44);
    assert.equal(row.height, 44);
    assert.equal(row.overflow, false, 'action row must fit on narrow screens');
    assert.equal(row.color, 'rgb(29, 78, 216)');
    await mark.scrollIntoViewIfNeeded();
    await mkdir('artifacts/mark-arrived', { recursive: true });
    await page.screenshot({ path: `artifacts/mark-arrived/${input}.png` });
    await activate(mark);
    await assertPin('1st', first);
    assert.equal(await page.locator('[data-guidance-step]').count(), 0, 'marking arrival clears the old route');
    // Set a start point directly on another floor, without starting another route.
    await activate(page.getByRole('button', { name: '3rd Floor', exact: true }));
    await page.getByLabel('Choose room or area').selectOption(target.id);
    await activate(mark);
    await assertPin('3rd', target);
    await activate(page.getByRole('button', { name: '1st Floor', exact: true }));
    await page.getByLabel('Choose room or area').selectOption(first.id);
    await activate(navigate);
    await page.locator('[data-guidance-step="start-cross-floor"]').waitFor();
    assert.equal(await page.getByRole('button', { name: '3rd Floor', exact: true }).getAttribute('aria-pressed'), 'true', 'next route starts on the marked floor');
    console.log(`PASS ${input}: direct arrival, persistence, selected-room semantics, route cleanup, new route origin, and compact accessible layout.`);
    assert.deepEqual(errors, [], 'map interactions must not throw browser errors');
    await context.close();
  }
  console.log('PASS Mark Arrived behavior and responsive layout.');
} finally {
  await browser.close();
}
