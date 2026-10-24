import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createConnectedFetch } from '../src/lib/connectedFetch.ts';

function fixture(fetcher, overrides = {}) {
  let online = true;
  let checks = 0;
  const monitor = {
    isOffline: () => !online,
    check: async () => { checks++; return online; },
    waitUntilOnline: async () => { online = true; },
    ...overrides,
  };
  return { fetch: createConnectedFetch(monitor, fetcher, 20), checks: () => checks };
}

test('HTTP server/auth errors remain responses and do not trigger offline checks', async () => {
  for (const status of [401, 403, 429, 500, 503]) {
    const f = fixture(async () => new Response('', { status }));
    assert.equal((await f.fetch('https://example.test')).status, status);
    assert.equal(f.checks(), 0);
  }
});
test('interrupted read is retried once after confirmed offline recovery', async () => {
  let calls = 0, waits = 0;
  const f = fixture(async () => { if (++calls === 1) throw new TypeError('Failed to fetch'); return new Response('ok'); }, {
    check: async () => false, waitUntilOnline: async () => { waits++; },
  });
  assert.equal(await (await f.fetch('https://example.test')).text(), 'ok');
  assert.equal(calls, 2);
  assert.equal(waits, 1);
});
test('mutations are never replayed, even after a transport failure', async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; throw new TypeError('Failed to fetch'); }, { check: async () => false });
  await assert.rejects(f.fetch('https://example.test', { method: 'POST', body: 'draft' }));
  assert.equal(calls, 1);
});
test('caller cancellation does not diagnose an outage', async () => {
  const controller = new AbortController(); controller.abort();
  const f = fixture(async (_url, init) => { throw init.signal.reason; });
  await assert.rejects(f.fetch('https://example.test', { signal: controller.signal }));
  assert.equal(f.checks(), 0);
});
test('slow online request times out without an offline retry', async () => {
  const f = fixture((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
  }));
  await assert.rejects(f.fetch('https://example.test'), { name: 'TimeoutError' });
  assert.equal(f.checks(), 1);
});
test('failed retry is bounded', async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; throw new TypeError('Failed to fetch'); }, { check: async () => false });
  await assert.rejects(f.fetch('https://example.test'));
  assert.equal(calls, 2);
});
test('abort during recovery wait rejects and never issues a retry', async () => {
  const controller = new AbortController();
  let calls = 0;
  const f = fixture(async () => { calls++; throw new TypeError('Failed to fetch'); }, {
    check: async () => false,
    waitUntilOnline: signal => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      controller.abort();
    }),
  });
  await assert.rejects(f.fetch('https://example.test', { signal: controller.signal }));
  assert.equal(calls, 1);
});
test('known offline reads wait before issuing any network request', async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; return new Response('ok'); }, {
    isOffline: () => true,
    waitUntilOnline: async () => { assert.equal(calls, 0); },
  });
  assert.equal(await (await f.fetch('https://example.test')).text(), 'ok');
  assert.equal(calls, 1);
});
test('read interrupted by a brief outage retries even if connectivity already recovered', async () => {
  let version = 0, calls = 0;
  const f = fixture(async () => {
    if (++calls === 1) { version++; throw new TypeError('Failed to fetch'); }
    return new Response('recovered');
  }, { getOutageVersion: () => version });
  assert.equal(await (await f.fetch('https://example.test')).text(), 'recovered');
  assert.equal(calls, 2);
});
