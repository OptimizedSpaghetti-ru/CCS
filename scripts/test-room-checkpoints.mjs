import assert from 'node:assert/strict';
import { test } from 'node:test';
import buildingMapData from '../src/data/buildingMapData.js';
import { readFile } from 'node:fs/promises';

const contract = await import('../src/lib/room-checkpoints.ts').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
const destinations = [
  ['comp-lab-1', '1st', 'Computer Lab 1'],
  ['comp-lab-2', '1st', 'Computer Lab 2'],
  ['comp-lab-3', '1st', 'Computer Lab 3'],
  ['computer-lab-4', '2nd', 'Computer Lab 4'],
  ['computer-lab-5', '5th', 'Computer Lab 5'],
  ['soci', '1st', 'EMC Laboratory'],
  ['ccs-office', '2nd', 'College of Computer Studies Office'],
  ['it-ojt-room', '2nd', 'IT / OJT Room'],
  ['tamaraw-library', '2nd', 'Tamaraw Library'],
  ...['501', '502', '503', '504', '505'].map(number => [`room-${number}`, '5th', `Room ${number}`]),
];

test('QR destinations include all existing rooms and three additional locations on their real floors', () => {
  assert.ok(Array.isArray(contract.ROOM_CHECKPOINTS), 'room QR catalogue must exist');
  assert.equal(contract.ROOM_CHECKPOINTS.length, 14);
  assert.deepEqual(contract.ROOM_CHECKPOINTS.map(room => room.id).sort(), destinations.map(([id]) => id).sort());
  for (const [id, floorId, name] of destinations) {
    assert.deepEqual(contract.ROOM_CHECKPOINTS.find(room => room.id === id), { id, floorId, name });
  }
});

test('each stable room payload resolves to its room and canonical floor on web and native origins', () => {
  assert.equal(typeof contract.parseRoomCheckpoint, 'function');
  for (const [id, floorId, name] of destinations) {
    const expected = { id, floorId, name };
    const path = contract.roomMapPath(id);
    assert.equal(path, `/app/map?view=indoor&room=${id}`);
    for (const origin of ['https://ccs.example', 'https://localhost']) {
      assert.deepEqual(contract.parseRoomCheckpoint(path, origin), expected);
      assert.deepEqual(contract.parseRoomCheckpoint(`${origin}${path}`, origin), expected);
      assert.deepEqual(contract.roomFromSearch(new URL(path, origin).search), expected);
    }
  }
});

test('unsupported, floor-only, foreign, duplicated, and malformed codes cannot select a room', () => {
  assert.equal(typeof contract.parseRoomCheckpoint, 'function');
  for (const input of [
    '', 'hello', 'room-501', 'javascript:alert(1)', '/app/map?view=indoor&floor=5th',
    '/app/map?view=indoor&room=room-506-a', '/app/map?view=indoor&room=mac-lab',
    '/app/map?view=indoor&room=chemistry-lab',
    '/app/map?view=indoor&room=pt-lab', '/app/map?view=indoor&room=psychology-lab',
    '/app/map?view=indoor&room=entrance', '/app/map?view=indoor&room=__proto__',
    '/app/map?view=indoor&room=room-501&room=room-502',
    '/app/map?view=indoor&view=indoor&room=room-501',
    '/app/map?view=indoor&room=room-501&floor=1st',
    '/app/map?view=indoor&room=room-501&next=https://evil.example',
    '/app/map?view=outdoor&room=room-501', '/app/map?room=room-501',
    '/app/map?view=indoor&room=room-501#redirect',
    '/app/home?view=indoor&room=room-501', '/app/other/../map?view=indoor&room=room-501',
    '//evil.example/app/map?view=indoor&room=room-501',
    'https://evil.example/app/map?view=indoor&room=room-501',
  ]) assert.equal(contract.parseRoomCheckpoint(input, 'https://ccs.example'), null, input);
  for (const input of ['?view=indoor&room=room-999', '?view=indoor&room=room-501&floor=1st', '?room=room-501&room=room-502']) {
    assert.equal(contract.roomFromSearch(input), null, input);
  }
  assert.throws(() => contract.roomMapPath('room-506-a'), /unsupported/i);
});

test('EMC metadata is renamed without moving or resizing the existing room', () => {
  const emc = buildingMapData['1st-floor'].find(room => room.id === 'soci');
  assert.equal(emc.name, 'EMC Laboratory');
  assert.equal(emc.category, 'lab');
  assert.equal(emc.description, 'EMC Laboratory in Saint Benedict Hall');
  assert.deepEqual([emc.x, emc.y, emc.width, emc.height], [422, 240, 110, 90]);
  assert.ok(!JSON.stringify(buildingMapData).match(/soci and|co-curricular office/i));
});

test('room destinations survive login or approval exactly once, with safe storage failure', async () => {
  const auth = await import('../src/lib/floor-checkpoints.ts');
  assert.equal(typeof auth.rememberMapCheckpoint, 'function');
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  auth.rememberMapCheckpoint('?view=indoor&room=soci', storage);
  assert.equal(auth.consumeMapCheckpoint(storage), '/app/map?view=indoor&room=soci');
  assert.equal(auth.consumeMapCheckpoint(storage), null);
  auth.rememberMapCheckpoint('?view=indoor&room=room-501&floor=1st', storage);
  assert.equal(auth.consumeMapCheckpoint(storage), null);
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => auth.rememberMapCheckpoint('?view=indoor&room=room-501', blocked));
  assert.equal(auth.consumeMapCheckpoint(blocked), null);
});

test('web hosting permits the same-origin room scanner camera', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const policy = config.headers.flatMap(rule => rule.headers).find(header => header.key === 'Permissions-Policy').value;
  assert.match(policy, /camera=\(self\)/);
  assert.match(policy, /microphone=\(\)/);
});
