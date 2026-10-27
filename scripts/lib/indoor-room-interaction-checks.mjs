import assert from 'node:assert/strict';
import { indoorFloorConfigs } from '../../src/data/indoorMapData.js';

export async function checkRoomInteractions(page, input, { tap = (x, y) => page.touchscreen.tap(x, y), screenshot, centersOnly = false } = {}) {
  const failures = [];
  let count = 0;
  let roomCount = 0;
  let floorCount = 0;
  for (const floor of Object.values(indoorFloorConfigs).filter(floor => !process.env.CCS_MAP_FLOORS || process.env.CCS_MAP_FLOORS.split(',').includes(floor.id))) {
    await page.getByRole('button', { name: floor.label, exact: true }).click();
    const svg = page.locator(`svg[aria-label="${floor.label} Saint Benedict Hall indoor map"]`);
    await svg.waitFor();
    await svg.evaluate(el => el.closest('section').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(550);
    const before = await svg.evaluate(el => el.closest('section').firstElementChild.style.transform);
    const coveredRooms = new Set();
    for (let index = 0; index < floor.rooms.length; index++) {
      const room = floor.rooms[index];
      const depth = Math.max(8, Math.min(room.h3d, 28));
      const probes = [
        ['center', room.x + room.w / 2, room.y + room.h / 2],
        ['left edge', room.x + room.w * 0.08, room.y + room.h / 2],
        ['right edge', room.x + room.w * 0.92, room.y + room.h / 2],
        ['upper edge', room.x + room.w / 2, room.y + room.h * 0.08],
        ['lower edge', room.x + room.w / 2, room.y + room.h * 0.92],
        ['roof', room.x + room.w / 2 + depth / 2, room.y - depth / 2],
        ['side', room.x + room.w + depth / 2, room.y + room.h / 2 - depth / 2],
      ];
      for (const [face, localX, localY] of centersOnly ? probes.slice(0, 1) : probes) {
        // Commit the reset before inspecting paint: its selection stroke can
        // genuinely cover part of an adjacent room at this scale.
        await svg.evaluate((el, index) => {
          const groups = [...el.querySelectorAll('g[role="button"]')];
          groups[(index + 1) % groups.length].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }, index);
        const point = await svg.evaluate((el, { index, localX, localY }) => {
          const groups = [...el.querySelectorAll('g[role="button"]')];
          // Independently check the visible SVG paint, excluding transparent hitboxes.
          // A room part genuinely covered by another room's paint is not visible.
          const ownerAt = (x, y) => groups.findLastIndex(group => [...group.children].some(shape =>
            ['rect', 'polygon'].includes(shape.tagName) &&
              (shape.isPointInFill(new DOMPoint(x, y)) || shape.isPointInStroke(new DOMPoint(x, y)))));
          // Shared subpixel paint/antialiasing borders have no unique owner.
          // Keep probes inside a visible face, away from a neighboring stroke.
          if ([[0, 0], [-2, 0], [2, 0], [0, -2], [0, 2]].some(([dx, dy]) => ownerAt(localX + dx, localY + dy) !== index)) return null;
          const probe = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          probe.setAttribute('cx', String(localX));
          probe.setAttribute('cy', String(localY));
          probe.setAttribute('r', '0.01');
          probe.style.pointerEvents = 'none';
          el.append(probe);
          const bounds = probe.getBoundingClientRect();
          const x = bounds.x + bounds.width / 2;
          const y = bounds.y + bounds.height / 2;
          probe.remove();
          const viewport = el.closest('section').getBoundingClientRect();
          if (!(x > viewport.left && x < viewport.right && y > viewport.top && y < viewport.bottom && x > 0 && y > 0 && x < innerWidth && y < innerHeight)) return null;
          const target = document.elementFromPoint(x, y);
          return { x, y, target: target ? `${target.tagName} ${target.closest('g[role="button"]')?.getAttribute('aria-label') ?? target.getAttribute('aria-label') ?? ''}` : null };
        }, { index, localX, localY });
        if (!point) continue;
        if (input === 'mouse') await page.mouse.click(point.x, point.y);
        else await tap(point.x, point.y);
        const result = await svg.evaluate(el => [...el.querySelectorAll('g[role="button"]')].findIndex(group => group.getAttribute('aria-pressed') === 'true'));
        count++;
        coveredRooms.add(room.id);
        if (result !== index) failures.push({ input, floor: floor.id, room: room.id, name: room.name, face, selected: floor.rooms[result]?.id, ...point });
      }
    }
    const after = await svg.evaluate(el => el.closest('section').firstElementChild.style.transform);
    assert.equal(coveredRooms.size, floor.rooms.length, 'every room must have a visible default-view test point');
    roomCount += coveredRooms.size;
    floorCount++;
    if (after !== before) failures.push({ input, floor: floor.id, issue: 'room taps moved the map', before, after });
    if (screenshot) await screenshot(page, `${input}-${floor.id}`);
    console.log(`Checked ${input}: ${floor.label}, ${floor.rooms.length} rooms.`);
  }
  return { count, rooms: roomCount, floors: floorCount, failures };
}

export async function checkGestures(page, { touch } = {}) {
  await page.getByRole('button', { name: '1st Floor', exact: true }).click();
  const svg = page.locator('svg[aria-label="1st Floor Saint Benedict Hall indoor map"]');
  await svg.waitFor();
  await svg.evaluate(el => el.closest('section').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(550);
  const viewport = svg.locator('xpath=ancestor::section[1]');
  const transform = () => viewport.locator(':scope > div').first().evaluate(el => el.style.transform);
  const selected = () => svg.evaluate(el => [...el.querySelectorAll('g[role="button"]')].findIndex(group => group.getAttribute('aria-pressed') === 'true'));
  const box = await viewport.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const before = await transform();
  const roomBefore = await selected();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 45, y + 25, { steps: 8 });
  await page.mouse.up();
  assert.notEqual(await transform(), before, 'mouse drag still pans');
  assert.equal(await selected(), roomBefore, 'dragging must not select the release room');
  await page.waitForTimeout(180);
  const previousRotation = await svg.evaluate(el => el.parentElement.parentElement.style.transform);
  await page.mouse.move(x, y);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(x + 40, y + 20, { steps: 8 });
  await page.mouse.up({ button: 'right' });
  assert.notEqual(await svg.evaluate(el => el.parentElement.parentElement.style.transform), previousRotation, 'mouse rotation remains functional');
  if (touch) {
    const beforeDrag = await transform();
    const roomBeforeDrag = await selected();
    await touch('touchStart', [{ x, y }]);
    await touch('touchMove', [{ x: x + 30, y: y + 15 }]);
    await touch('touchEnd', []);
    assert.notEqual(await transform(), beforeDrag, 'one-finger drag still pans');
    assert.equal(await selected(), roomBeforeDrag, 'touch drag must not select the release room');
    await page.waitForTimeout(180);
    const beforePinch = await transform();
    await touch('touchStart', [{ x: x - 30, y }, { x: x + 30, y }]);
    await touch('touchMove', [{ x: x - 55, y }, { x: x + 55, y }]);
    await touch('touchEnd', []);
    assert.notEqual(await transform(), beforePinch, 'two-finger pinch still zooms');
    assert.equal(await selected(), roomBeforeDrag, 'pinch release must not select a room');
  }
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Navigate to Selected Area', exact: true }).click();
  await page.getByRole('button', { name: 'Clear navigation route' }).waitFor();
  await page.getByRole('button', { name: 'Clear navigation route' }).click();
  console.log('PASS existing pan, rotation, pinch, and navigation controls.');
}

export async function checkTouchSlop(page, touch) {
  await page.getByRole('button', { name: '1st Floor', exact: true }).click();
  const svg = page.locator('svg[aria-label="1st Floor Saint Benedict Hall indoor map"]');
  await svg.waitFor();
  await page.getByLabel('Choose room or area').selectOption('entrance');
  await svg.evaluate(el => el.closest('section').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(550);
  const point = await svg.evaluate(el => {
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    probe.setAttribute('cx', '150');
    probe.setAttribute('cy', '100');
    probe.setAttribute('r', '0.01');
    probe.style.pointerEvents = 'none';
    el.append(probe);
    const box = probe.getBoundingClientRect();
    probe.remove();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  });
  const before = await svg.evaluate(el => el.closest('section').firstElementChild.style.transform);
  await touch('touchStart', [point]);
  await touch('touchMove', [{ x: point.x + 1.5, y: point.y + 0.75 }]);
  await touch('touchEnd', []);
  await page.waitForTimeout(80);
  assert.equal(await page.getByLabel('Choose room or area').inputValue(), 'pt-lecture', 'a slightly unsteady tap must still select the distant room');
  assert.equal(await svg.evaluate(el => el.closest('section').firstElementChild.style.transform), before, 'tap jitter must not pan the map');
  console.log('PASS slight touch jitter selects the room without panning.');
}
