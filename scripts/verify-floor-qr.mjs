// Local browser fixtures only. No real accounts, database mutations, or camera images leave the browser.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import QRCode from 'qrcode';
import { indoorFloorConfigs } from '../src/data/indoorMapData.js';
import { FLOOR_CHECKPOINTS, floorMapPath } from '../src/lib/floor-checkpoints.ts';
import { ROOM_CHECKPOINTS, roomMapPath } from '../src/lib/room-checkpoints.ts';

const baseURL = process.env.CCS_QR_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const userId = '11111111-1111-4111-8111-111111111111';
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'floor-test@example.invalid', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Floor Test', role: 'student', status: 'approved' }, created_at: '2026-01-01T00:00:00Z' };
const tokenPart = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const session = { access_token: `${tokenPart({ alg: 'HS256', typ: 'JWT' })}.${tokenPart({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.fixture`, refresh_token: 'local-fixture', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
let activePage;

async function fixture({ authenticated = true, status = 'approved', viewport = { width: 390, height: 844 }, camera = 'stream' } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await context.routeWebSocket(/.*/, socket => socket.close());
  await context.addInitScript(({ authenticated, session, camera }) => {
    if (authenticated) localStorage.setItem('ccs-connect-auth', JSON.stringify(session));
    window.qrStreams = [];
    window.qrTracks = [];
    window.qrPayloadImage = '';
    // Simulate only the camera boundary. QR recognition runs against real video frames.
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      if (camera === 'denied') throw new DOMException('Permission denied', 'NotAllowedError');
      if (camera === 'missing') throw new DOMException('No camera', 'NotFoundError');
      if (camera === 'busy') throw new DOMException('Camera in use', 'NotReadableError');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 640;
      const ctx = canvas.getContext('2d');
      const image = new Image();
      let source = '';
      const paint = () => {
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 640, 640);
        if (window.qrPayloadImage !== source) { source = window.qrPayloadImage; image.src = source; }
        if (image.complete && image.naturalWidth) ctx.drawImage(image, 100, 100, 440, 440);
        if (stream.getVideoTracks()[0]?.readyState === 'live') requestAnimationFrame(paint);
      };
      const stream = canvas.captureStream(10);
      window.qrStreams.push(stream);
      window.qrTracks.push(...stream.getTracks());
      paint();
      if (camera === 'delayed') await new Promise(resolve => { window.resolveQrCamera = resolve; });
      return stream;
    } });
    if (camera === 'unsupported') Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: undefined });
  }, { authenticated, session, camera });
  let profileStatus = status;
  await context.route('**/auth/v1/**', route => route.fulfill({ json: route.request().url().includes('/token') ? session : user }));
  await context.route('**/rest/v1/**', route => route.fulfill({ json: route.request().url().includes('/profiles') ? { id: userId, full_name: 'Floor Test', role: 'student', status: profileStatus } : [] }));
  const page = await context.newPage();
  activePage = page;
  page.on('console', message => { if (['warning', 'error'].includes(message.type()) && process.env.CCS_QR_DEBUG) console.log(message.type(), message.text()); });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, errors, approve: () => { profileStatus = 'approved'; } };
}

async function openMap(page, path = '/app/map?view=indoor') {
  await page.goto(`${baseURL}${path}`);
  await page.getByRole('heading', { name: 'Indoor Map Navigation' }).waitFor();
  await page.locator('[data-startup-splash]').waitFor({ state: 'detached' });
}
async function showPayload(page, text) {
  const image = text ? await QRCode.toDataURL(text, { width: 440, margin: 4, errorCorrectionLevel: 'M' }) : '';
  await page.evaluate(value => { window.qrPayloadImage = value; }, image);
}
async function assertCameraStopped(page) {
  await page.waitForFunction(() => window.qrTracks.length > 0 && window.qrTracks.every(track => track.readyState === 'ended'));
}
async function expectFloor(page, floor) {
  await page.getByRole('button', { name: `${floor} Floor`, exact: true }).and(page.locator('[aria-pressed="true"]')).waitFor();
}

async function expectRoom(page, room) {
  await expectFloor(page, room.floorId);
  const shape = page.locator('svg[aria-label]').getByRole('button', { name: room.name, exact: true });
  await shape.waitFor();
  await page.waitForFunction(name => [...document.querySelectorAll('svg g[role="button"]')].some(el => el.getAttribute('aria-label') === name && el.querySelector('rect[stroke-width="5"]')), room.name);
  await page.waitForFunction(name => [...document.querySelectorAll('svg g[role="button"]')].some(el => {
    if (el.getAttribute('aria-label') !== name) return false;
    const room = el.querySelector('rect').getBoundingClientRect();
    const viewport = el.closest('section').getBoundingClientRect();
    return Math.abs(room.x + room.width / 2 - (viewport.x + viewport.width / 2)) < 32 &&
      Math.abs(room.y + room.height / 2 - (viewport.y + viewport.height / 2)) < 32;
  }), room.name);
  assert.equal(new URL(page.url()).searchParams.get('room'), room.id);
  const geometry = indoorFloorConfigs[room.floorId].rooms.find(item => item.id === room.id);
  const expectedPin = { floorId: room.floorId, x: geometry.x + geometry.w / 2, y: geometry.y + geometry.h / 2, heading: 0 };
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('ccs-indoor-current-location'))), expectedPin, 'room QR automatically persists Mark Arrived');
  const marker = page.locator('svg[aria-label] g').filter({ has: page.locator(':scope > circle[fill="#1D4ED8"][r="13"]') });
  assert.equal(await marker.getAttribute('transform'), `translate(${expectedPin.x} ${expectedPin.y}) rotate(-90)`, 'blue pin moves immediately, before Navigate');
}

try {
  const f = await fixture();
  await openMap(f.page, roomMapPath('room-505'));
  await expectRoom(f.page, ROOM_CHECKPOINTS.find(room => room.id === 'room-505'));
  console.log('PASS room deep-link floor selection and visible room highlight');
  const mapSwitcher = f.page.getByRole('button', { name: 'Indoor Map', exact: true }).locator('..');
  assert.equal(await mapSwitcher.getByRole('button').count(), 2, 'the top map switch contains only Outdoor Map and Indoor Map');
  assert.equal(await f.page.getByRole('region', { name: 'Floor picker', exact: true }).getByRole('button', { name: 'Scan QR', exact: true }).count(), 1, 'scan action belongs with indoor floor controls');
  await f.page.getByRole('button', { name: 'Outdoor Map', exact: true }).click();
  assert.equal(await f.page.getByRole('button', { name: 'Scan QR', exact: true }).count(), 0, 'outdoor map does not show the indoor QR action');
  await f.page.getByRole('button', { name: 'Indoor Map', exact: true }).click();
  await f.page.getByRole('button', { name: 'Scan QR', exact: true }).waitFor();
  console.log('PASS two-button map switch and QR action inside the indoor floor picker');
  await f.page.getByRole('button', { name: 'Navigate to Selected Area', exact: true }).click();
  await f.page.getByRole('button', { name: 'Clear navigation route' }).waitFor();
  for (const room of ROOM_CHECKPOINTS) {
    await showPayload(f.page, roomMapPath(room.id));
    await f.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
    await f.page.getByRole('dialog', { name: 'Scan QR' }).waitFor({ state: 'detached' });
    await expectRoom(f.page, room);
    await f.page.getByRole('status').filter({ hasText: `Showing ${room.name}` }).waitFor();
    await assertCameraStopped(f.page);
    assert.equal(await f.page.getByRole('button', { name: 'Clear navigation route' }).count(), 0);
  }
  const storedPin = await f.page.evaluate(() => localStorage.getItem('ccs-indoor-current-location'));
  // New navigation starts from the last scanned room, without pressing Mark Arrived.
  const destination = ROOM_CHECKPOINTS.find(room => room.id === 'room-502');
  await f.page.getByRole('button', { name: `${destination.floorId} Floor`, exact: true }).click();
  await f.page.getByLabel('Choose room or area').selectOption(destination.id);
  await f.page.getByRole('button', { name: 'Navigate to Selected Area', exact: true }).click();
  const pin = JSON.parse(storedPin);
  const route = f.page.locator('[data-navigation-route] path[stroke-dasharray]');
  await route.waitFor();
  assert.ok((await route.getAttribute('d')).startsWith(`M ${pin.x} ${pin.y} L `), 'next route uses scanned room as its origin');
  console.log('PASS all 14 room camera-frame decodes, automatic arrival, blue pin, persisted origin, next route, highlight, and cleanup');
  for (const floor of [...FLOOR_CHECKPOINTS, FLOOR_CHECKPOINTS[4]]) {
    // Exercise old relative payloads and same-origin absolute links, including repeat scans.
    await showPayload(f.page, floor.id === '2nd' ? `${baseURL}${floorMapPath(floor.id)}` : floorMapPath(floor.id));
    await f.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
    await f.page.getByRole('dialog').waitFor({ state: 'detached' });
    await expectFloor(f.page, floor.id);
    assert.equal(new URL(f.page.url()).searchParams.has('room'), false, 'floor scans clear the room target');
    await assertCameraStopped(f.page);
    assert.equal(await f.page.getByRole('button', { name: 'Clear navigation route' }).count(), 0);
  }
  assert.equal(await f.page.evaluate(() => localStorage.getItem('ccs-indoor-current-location')), storedPin);
  console.log('PASS all five legacy floor codes, repeated scans, room-to-floor switching, and preserved location pin');


  await f.page.getByRole('button', { name: '1st Floor', exact: true }).click();
  await expectFloor(f.page, '1st');
  // Scanning the same link twice must still apply after a manual change.
  await showPayload(f.page, roomMapPath('room-501'));
  await f.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  await f.page.getByRole('dialog').waitFor({ state: 'detached' });
  await expectFloor(f.page, '5th');
  await expectRoom(f.page, ROOM_CHECKPOINTS.find(room => room.id === 'room-501'));
  console.log('PASS manual floor switching and rescanning the same room');

  await f.page.getByLabel('Search indoor rooms and facilities').fill('EMC');
  await f.page.getByRole('button', { name: 'EMC Laboratory 1st Floor', exact: true }).click();
  await expectFloor(f.page, '1st');
  await f.page.getByLabel('Filter rooms by category').selectOption('computer-lab');
  const emc = f.page.locator('svg').getByRole('button', { name: 'EMC Laboratory', exact: true });
  await f.page.waitForFunction(() => [...document.querySelectorAll('svg g[role="button"]')].some(el => el.getAttribute('aria-label') === 'EMC Laboratory' && getComputedStyle(el).opacity === '1'));
  assert.equal(await emc.locator('rect').first().getAttribute('stroke-width'), '5');
  await f.page.getByLabel('Filter rooms by category').selectOption('all');
  console.log('PASS renamed EMC search, laboratory filtering, and selection');

  // Exercise the existing gesture handlers against their rendered transforms.
  const viewport = f.page.locator('.ccs-indoor-map section').filter({ has: f.page.locator('svg[aria-label]') }).last();
  const transform = () => viewport.locator(':scope > div').first().evaluate(el => el.style.transform);
  const beforePan = await transform();
  await viewport.dispatchEvent('mousedown', { button: 0, clientX: 150, clientY: 150 });
  await viewport.dispatchEvent('mousemove', { buttons: 1, clientX: 190, clientY: 175 });
  await viewport.dispatchEvent('mouseup');
  assert.notEqual(await transform(), beforePan, 'drag-to-pan remains functional');
  const beforeZoom = await transform();
  await viewport.evaluate(el => {
    const fire = (type, points) => el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: points.map(([x, y], identifier) => new Touch({ identifier, target: el, clientX: x, clientY: y })) }));
    fire('touchstart', [[100,100],[200,100]]);
    fire('touchmove', [[80,100],[220,100]]);
    fire('touchend', []);
  });
  assert.notEqual(await transform(), beforeZoom, 'pinch-to-zoom remains functional');
  assert.equal(await f.page.getByRole('group', { name: 'Choose floor' }).getByRole('button').count(), 5);
  console.log('PASS drag-to-pan, pinch-to-zoom, and all five manual floor buttons');

  await showPayload(f.page, 'https://evil.example/app/map?view=indoor&floor=2nd');
  await f.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  await f.page.getByRole('alert').filter({ hasText: 'not a supported CCS Connect code' }).waitFor();
  assert.equal(new URL(f.page.url()).pathname, '/app/map');
  await showPayload(f.page, '/app/map?view=indoor&room=room-506-a');
  await f.page.getByRole('alert').filter({ hasText: 'not a supported CCS Connect code' }).waitFor();
  await showPayload(f.page, roomMapPath('computer-lab-4'));
  await f.page.getByRole('dialog').waitFor({ state: 'detached' });
  await expectFloor(f.page, '2nd');
  console.log('PASS invalid QR rejection followed by valid recovery');

  await showPayload(f.page, '');
  await f.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  await f.page.getByText('Point your camera at a floor or room QR code.').waitFor();
  await f.page.keyboard.press('Escape');
  await assertCameraStopped(f.page);
  await f.page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
  assert.equal(await f.page.getByRole('button', { name: 'Scan QR', exact: true }).evaluate(el => document.activeElement === el), true, 'closing the scanner restores keyboard focus to its action');
  await f.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  await f.page.getByText('Point your camera at a floor or room QR code.').waitFor();
  await f.page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await assertCameraStopped(f.page);
  await f.page.getByRole('button', { name: 'Resume Camera' }).waitFor();
  await f.page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await f.page.getByRole('button', { name: 'Resume Camera' }).click();
  await f.page.getByText('Point your camera at a floor or room QR code.').waitFor();
  // The previous scanner must never release the replacement stream via stale cleanup.
  await f.page.waitForTimeout(400);
  assert.equal(await f.page.locator('video').evaluate(video => video.srcObject?.getTracks().some(track => track.readyState === 'live') ?? false), true, 'fast resume keeps the replacement camera stream alive');
  await f.page.getByRole('button', { name: 'Choose Floor Manually' }).click();
  await assertCameraStopped(f.page);
  assert.deepEqual(f.errors, []);
  console.log('PASS close, background pause, explicit resume, and manual fallback');

  await mkdir('artifacts/room-qr', { recursive: true });
  await f.page.screenshot({ path: 'artifacts/room-qr/map-mobile.png', fullPage: true });
  await f.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  await f.page.getByText('Point your camera at a floor or room QR code.').waitFor();
  await f.page.screenshot({ path: 'artifacts/room-qr/scanner-mobile.png', fullPage: true });
  await f.context.close();

  for (const camera of ['denied', 'missing', 'busy', 'unsupported', 'delayed']) {
    const c = await fixture({ camera, viewport: { width: 1440, height: 1000 } });
    await openMap(c.page);
    await c.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
    if (camera === 'delayed') {
      await c.page.waitForFunction(() => typeof window.resolveQrCamera === 'function');
      await c.page.getByRole('button', { name: 'Close Scanner' }).click();
      await c.page.evaluate(() => window.resolveQrCamera());
      await assertCameraStopped(c.page);
    } else {
      await c.page.getByRole('button', { name: 'Retry Camera' }).waitFor();
      await c.page.getByRole('alert').waitFor();
      const expected = { denied: /Camera access was denied/, missing: /No camera was found/, busy: /in use by another app/, unsupported: /HTTPS/ };
      assert.match(await c.page.getByRole('alert').innerText(), expected[camera]);
      await c.page.screenshot({ path: `artifacts/room-qr/scanner-${camera}-desktop.png`, fullPage: true });
      await c.page.getByRole('button', { name: 'Choose Floor Manually' }).click();
      await c.page.getByRole('button', { name: '3rd Floor', exact: true }).click();
      await expectFloor(c.page, '3rd');
    }
    assert.deepEqual(c.errors, []);
    await c.context.close();
    console.log(`PASS ${camera} camera recovery`);
  }


  const desktop = await fixture({ viewport: { width: 1440, height: 1000 } });
  await openMap(desktop.page, roomMapPath('soci'));
  await expectRoom(desktop.page, ROOM_CHECKPOINTS.find(room => room.id === 'soci'));
  await showPayload(desktop.page, roomMapPath('room-502'));
  await desktop.page.getByRole('button', { name: 'Scan QR', exact: true }).click();
  await desktop.page.waitForURL(url => url.searchParams.get('room') === 'room-502');
  await expectRoom(desktop.page, ROOM_CHECKPOINTS.find(room => room.id === 'room-502'));
  await desktop.page.screenshot({ path: 'artifacts/room-qr/map-desktop.png', fullPage: true });
  assert.deepEqual(desktop.errors, []);
  await desktop.context.close();
  console.log('PASS desktop room link and camera-frame scan');

  const auth = await fixture({ authenticated: false });
  await auth.page.goto(`${baseURL}${roomMapPath('soci')}`);
  await auth.page.waitForURL('**/login');
  await auth.page.getByPlaceholder('Enter your email').fill(user.email);
  await auth.page.getByPlaceholder('Enter your password').fill('local-fixture-only');
  await auth.page.getByRole('button', { name: 'Log In', exact: true }).click();
  await auth.page.getByRole('heading', { name: 'Indoor Map Navigation' }).waitFor();
  await expectRoom(auth.page, ROOM_CHECKPOINTS.find(room => room.id === 'soci'));
  assert.deepEqual(auth.errors, []);
  await auth.context.close();
  console.log('PASS logged-out room link through login');

  const pending = await fixture({ status: 'pending' });
  await pending.page.goto(`${baseURL}${roomMapPath('room-501')}`);
  await pending.page.waitForURL('**/pending-approval');
  assert.equal(await pending.page.getByRole('heading', { name: 'Indoor Map Navigation' }).count(), 0);
  pending.approve();
  await pending.page.getByRole('heading', { name: 'Indoor Map Navigation' }).waitFor();
  await expectRoom(pending.page, ROOM_CHECKPOINTS.find(room => room.id === 'room-501'));
  assert.deepEqual(pending.errors, []);
  await pending.context.close();
  console.log('PASS pending approval retains room without bypassing guard');
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    console.log('Failure diagnostics:', await activePage.evaluate(() => ({
      url: location.pathname + location.search,
      selectedRooms: [...document.querySelectorAll('svg g[role="button"][aria-pressed="true"]')].map(el => ({
        name: el.getAttribute('aria-label'),
        room: el.querySelector('rect').getBoundingClientRect().toJSON(),
        viewport: el.closest('section').getBoundingClientRect().toJSON(),
        transform: el.closest('section').firstElementChild.style.transform,
      })),
      status: document.querySelector('.floor-qr-status')?.textContent,
      message: document.querySelector('.floor-qr-error')?.textContent,
      video: [...document.querySelectorAll('video')].map(v => ({ width: v.videoWidth, height: v.videoHeight, paused: v.paused, ready: v.readyState })),
      tracks: window.qrStreams?.map(s => s.getTracks().map(t => ({ state: t.readyState, muted: t.muted }))),
    })).catch(() => ({ unavailable: 'page navigated during failure capture' })));
    await mkdir('artifacts/room-qr', { recursive: true });
    await activePage.screenshot({ path: 'artifacts/room-qr/failure.png', fullPage: true }).catch(() => {});
  }
  throw error;
} finally {
  await browser.close();
}
