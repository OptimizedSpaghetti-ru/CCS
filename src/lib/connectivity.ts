import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';

type Snapshot = { offline: boolean; checking: boolean };
let snapshot: Snapshot = { offline: !navigator.onLine, checking: false };
const listeners = new Set<() => void>();
let inFlight: Promise<boolean> | null = null;
let nativeDisconnected = false;
let activeProbe: AbortController | null = null;
let outageVersion = 0;

function update(next: Partial<Snapshot>) {
  const value = { ...snapshot, ...next };
  if (value.offline === snapshot.offline && value.checking === snapshot.checking) return;
  if (value.offline && !snapshot.offline) outageVersion++;
  snapshot = value;
  listeners.forEach(listener => listener());
}

export const connectivity = {
  getSnapshot: () => snapshot,
  isOffline: () => snapshot.offline,
  getOutageVersion: () => outageVersion,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  check(): Promise<boolean> {
    if (inFlight) return inFlight;
    update({ checking: true });
    const controller = new AbortController();
    activeProbe = controller;
    const timer = setTimeout(() => controller.abort(), 6000);
    // Two independent destinations separate a backend outage from lost internet.
    // Android's localhost is bundled content and must never be used as reachability evidence.
    const targets = [
      { url: `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, mode: 'cors' as RequestMode },
      { url: Capacitor.isNativePlatform() ? 'https://www.gstatic.com/generate_204' : `${location.origin}/connectivity.txt`, mode: Capacitor.isNativePlatform() ? 'no-cors' as RequestMode : 'same-origin' as RequestMode },
    ];
    inFlight = (async () => {
      try {
        const results = await Promise.all(targets.map(async target => {
          try {
            // Any HTTP response proves reachability, including 401/429/500.
            await fetch(`${target.url}?ccs_probe=${Date.now()}`, { mode: target.mode, cache: 'no-store', credentials: 'omit', signal: controller.signal });
            return 'reachable';
          } catch (error) {
            return controller.signal.aborted ? 'timeout' : error instanceof TypeError ? 'network-error' : 'unknown';
          }
        }));
        if (results.includes('reachable')) update({ offline: false });
        else if (!navigator.onLine || nativeDisconnected || results.every(result => result === 'network-error')) update({ offline: true });
        // Timeouts alone are not proof of an outage; retain the previous state.
        return !snapshot.offline;
      } finally {
        clearTimeout(timer);
        activeProbe = null;
        inFlight = null;
        update({ checking: false });
      }
    })();
    return inFlight;
  },
  waitUntilOnline(signal?: AbortSignal | null): Promise<void> {
    if (signal?.aborted) return Promise.reject(signal.reason);
    if (!snapshot.offline) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const cleanup = () => { unsubscribe(); signal?.removeEventListener('abort', abort); };
      const abort = () => { cleanup(); reject(signal?.reason); };
      const unsubscribe = connectivity.subscribe(() => {
        if (!snapshot.offline) { cleanup(); resolve(); }
      });
      signal?.addEventListener('abort', abort, { once: true });
    });
  },
  start() {
    let stopped = false;
    let nativeListener: PluginListenerHandle | undefined;
    const check = () => { void connectivity.check(); };
    const offline = () => { update({ offline: true }); check(); };
    const visible = () => { if (!document.hidden) check(); };
    window.addEventListener('online', check);
    window.addEventListener('offline', offline);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', visible);
    // Poll while visible to cover silent loss of internet with Wi-Fi still connected.
    const timer = window.setInterval(() => { if (!document.hidden) check(); }, 15_000);
    if (Capacitor.isNativePlatform()) {
      const statusChanged = (status: { connected: boolean }) => {
        if (stopped) return;
        nativeDisconnected = !status.connected;
        if (!status.connected) update({ offline: true });
        check();
      };
      void Network.addListener('networkStatusChange', statusChanged).then(handle => {
        if (stopped) void handle.remove(); else nativeListener = handle;
      }).catch(check);
      void Network.getStatus().then(statusChanged).catch(check);
    }
    check();
    return () => {
      stopped = true;
      clearInterval(timer);
      activeProbe?.abort();
      void nativeListener?.remove();
      window.removeEventListener('online', check);
      window.removeEventListener('offline', offline);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', visible);
    };
  },
};
