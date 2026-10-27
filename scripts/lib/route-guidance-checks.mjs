import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { indoorFloorConfigs } from '../../src/data/indoorMapData.js';

export async function checkRouteGuidance(page, input = 'mouse', { tap } = {}) {
  const activate = async locator => input === 'touch' ? (tap ? tap(locator) : locator.tap()) : locator.click();
  for (const floorId of ['1st', '3rd']) {
    const floor = indoorFloorConfigs[floorId];
    await activate(page.getByRole('button', { name: floor.label, exact: true }));
    const room = floor.rooms.find(room => room.type === 'room');
    await page.getByLabel('Choose room or area').selectOption(room.id);
    await activate(page.getByRole('button', { name: 'Navigate to Selected Area', exact: true }));
    const steps = page.locator('[data-guidance-step]');
    await steps.first().waitFor();
    const ids = await steps.evaluateAll(els => els.map(el => el.dataset.guidanceStep));
    assert.equal(ids.length, floorId === '1st' ? 3 : 5);
    const expectedFloor = id => ['exit-transition', 'arrive-cross-floor'].includes(id) ? floor.label : '1st Floor';
    const polylineByFloor = new Map();
    // Jump backwards and forwards, repeat the same step, and visit every instruction.
    for (const index of [ids.length - 1, 0, 1, ...ids.map((_, i) => i), 0, ids.length - 1]) {
      const id = ids[index];
      const step = page.locator(`[data-guidance-step="${id}"]`);
      await activate(step);
      await page.waitForTimeout(650);
      assert.equal(await step.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('[data-guidance-step][aria-pressed="true"]').count(), 1);
      const svg = page.locator(`svg[aria-label="${expectedFloor(id)} Saint Benedict Hall indoor map"]`);
      await svg.waitFor();
      const marker = svg.locator(`[data-guidance-waypoint="${id}"]`);
      await marker.waitFor();
      const position = await marker.evaluate(el => {
        const box = el.getBoundingClientRect();
        const viewport = el.closest('section').getBoundingClientRect();
        return { x: box.x + box.width / 2 - (viewport.x + viewport.width / 2), y: box.y + box.height / 2 - (viewport.y + viewport.height / 2) };
      });
      assert.ok(Math.abs(position.x) < 32 && Math.abs(position.y) < 32, `${id} focuses waypoint near camera center: ${JSON.stringify(position)}`);
      const segment = await svg.locator('[data-guidance-segment] polyline').getAttribute('points');
      assert.ok(segment.split(' ').length >= 2);
      const route = await svg.locator('g.pointer-events-none > path').first().getAttribute('d');
      if (polylineByFloor.has(expectedFloor(id))) assert.equal(route, polylineByFloor.get(expectedFloor(id)), 'step selection must preserve the calculated route');
      polylineByFloor.set(expectedFloor(id), route);
      assert.deepEqual(await steps.evaluateAll(els => els.map(el => el.dataset.guidanceStep)), ids);
    }
    // Native buttons provide keyboard activation as well as pointer/touch activation.
    if (input === 'mouse') {
      await steps.first().focus();
      await page.keyboard.press('Enter');
      assert.equal(await steps.first().getAttribute('aria-pressed'), 'true');
    }
    if (input === 'mouse') {
      await mkdir('artifacts/route-guidance', { recursive: true });
      await page.screenshot({ path: `artifacts/route-guidance/selected-${input}-${floorId}.png`, fullPage: true });
    }
    await activate(page.getByRole('button', { name: 'Clear navigation route', exact: true }));
    assert.equal(await steps.count(), 0);
    assert.equal(await page.locator('[data-guidance-segment]').count(), 0);
    console.log(`PASS ${input}: ${floorId} route guidance shortcuts.`);
  }
  console.log(`PASS ${input}: every same-floor and cross-floor guidance step, arbitrary ordering, camera centering, segment highlight, route stability, and cleanup.`);
}
