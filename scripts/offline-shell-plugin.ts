import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/** Precache public shell only. API responses, auth tokens and user data never enter this cache. */
export function offlineShellPlugin(): Plugin {
  return {
    name: 'ccs-offline-shell',
    apply: 'build',
    generateBundle(_options, bundle) {
      const publicFiles = readdirSync('public', { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => '/' + path.relative('public', path.join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
        .filter(file => file !== '/connectivity.txt' && !file.endsWith('.mp4'));
      const assets = ['/', '/index.html', ...Object.keys(bundle).map(file => '/' + file), ...publicFiles];
      const version = createHash('sha256').update(JSON.stringify(assets)).update(String(Date.now())).digest('hex').slice(0, 16);
      const source = `
const CACHE = 'ccs-shell-${version}';
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
// New workers wait for existing tabs to close, avoiding a mixed-version application.
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ccs-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname === '/connectivity.txt') return;
  if (request.mode === 'navigate') {
    // Route callbacks retain their original URL; only public HTML comes from the cache.
    event.respondWith(caches.open(CACHE).then(cache => cache.match('/index.html')).then(shell => shell || fetch(request)));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname)).then(asset => asset || fetch(request)));
  }
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
