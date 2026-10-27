import assert from 'node:assert/strict';
import { test } from 'node:test';

const contract = await import('../src/lib/floor-checkpoints.ts').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const floors = ['1st', '2nd', '3rd', '4th', '5th'];

test('each of the five floor QR payloads selects only its intended floor', () => {
  assert.equal(typeof contract.parseFloorCheckpoint, 'function', 'floor QR validation must exist');
  assert.deepEqual(contract.FLOOR_CHECKPOINTS.map(floor => floor.id), floors);
  for (const floor of floors) {
    const path = contract.floorMapPath(floor);
    assert.equal(path, `/app/map?view=indoor&floor=${floor}`);
    assert.equal(contract.parseFloorCheckpoint(path, 'https://ccs.example'), floor);
    assert.equal(contract.parseFloorCheckpoint(`https://ccs.example${path}`, 'https://ccs.example'), floor);
    assert.equal(contract.floorFromSearch(new URL(path, 'https://ccs.example').search), floor);
  }
});

test('unrelated, foreign, ambiguous, or malformed QR payloads cannot select a floor', () => {
  assert.equal(typeof contract.parseFloorCheckpoint, 'function');
  for (const input of ['', '3', 'hello', 'javascript:alert(1)', '//evil.example/app/map?view=indoor&floor=1st',
    'https://evil.example/app/map?view=indoor&floor=1st', '/app/home?view=indoor&floor=1st',
    '/app/map?floor=1st', '/app/map?view=outdoor&floor=1st', '/app/map?view=indoor&floor=6th',
    '/app/map?view=indoor&floor=1st&floor=2nd', '/app/map?view=indoor&floor=1st&next=https://evil.example',
    '/app/map?view=indoor&floor=1st#room', '/app/map?view=indoor&view=indoor&floor=1st',
    '/app/other/../map?view=indoor&floor=1st']) {
    assert.equal(contract.parseFloorCheckpoint(input, 'https://ccs.example'), null, input);
  }
  for (const search of ['?floor=6th', '?floor=1st&floor=2nd', '?floor=1', '?floor=']) {
    assert.equal(contract.floorFromSearch(search), null, search);
  }
});

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('a requested floor survives auth handoff once without storing an arbitrary redirect', () => {
  assert.equal(typeof contract.rememberMapCheckpoint, 'function');
  const storage = memoryStorage();
  contract.rememberMapCheckpoint('?view=indoor&floor=4th', storage);
  assert.equal(contract.consumeMapCheckpoint(storage), '/app/map?view=indoor&floor=4th');
  assert.equal(contract.consumeMapCheckpoint(storage), null);
  contract.rememberMapCheckpoint('?floor=evil', storage);
  assert.equal(contract.consumeMapCheckpoint(storage), null);
});

test('blocked session storage never breaks map access or auth', () => {
  assert.equal(typeof contract.rememberMapCheckpoint, 'function');
  const storage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => contract.rememberMapCheckpoint('?floor=2nd', storage));
  assert.equal(contract.consumeMapCheckpoint(storage), null);
});
