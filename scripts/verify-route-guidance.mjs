// Exercise real browser hit-testing at projected screen coordinates.
// Authentication/backend responses are local fixtures; no production data is modified.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { checkGestures } from './lib/indoor-room-interaction-checks.mjs';

import { checkRouteGuidance } from './lib/route-guidance-checks.mjs';

const baseURL = process.env.CCS_MAP_URL || 'http://127.0.0.1:5175';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'map-test@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Map Test', role: 'student', status: 'approved' }, created_at: '2026-01-01T00:00:00Z' };
const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const session = { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'local-fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };

try {
  for (const input of ['mouse', 'touch']) {
    const context = await browser.newContext({ viewport: input === 'touch' ? { width: 390, height: 844 } : { width: 1440, height: 1100 }, hasTouch: true, reducedMotion: 'reduce' });
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
    await checkRouteGuidance(page, input);
    await page.getByRole('button', { name: '1st Floor', exact: true }).click();
    await page.getByLabel('Choose room or area').selectOption('pt-lecture');
    const client = await context.newCDPSession(page);
    const touch = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((point, id) => ({ ...point, id })) });
    await checkGestures(page, { touch });
    await client.detach();
    await mkdir('artifacts/route-guidance', { recursive: true });
    await page.screenshot({ path: `artifacts/route-guidance/web-${input}.png`, fullPage: true });
    assert.deepEqual(errors, [], 'map interactions must not throw browser errors');
    await context.close();
  }
  console.log('PASS web route guidance and existing map gestures.');
} finally {
  await browser.close();
}
