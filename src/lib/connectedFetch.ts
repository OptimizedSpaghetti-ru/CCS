export interface ConnectivityMonitor {
  isOffline: () => boolean;
  check: () => Promise<boolean>;
  waitUntilOnline: (signal?: AbortSignal | null) => Promise<void>;
  getOutageVersion?: () => number;
}

/** Bound each transport attempt. Only safe reads can be replayed after an outage. */
export function createConnectedFetch(
  monitor: ConnectivityMonitor,
  transport: typeof fetch = globalThis.fetch.bind(globalThis),
  timeoutMs = 30_000,
): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : null;
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    const safe = method === 'GET' || method === 'HEAD';
    const signal = init?.signal ?? request?.signal;
    const attempt = async () => {
      const controller = new AbortController();
      const abort = () => controller.abort(signal?.reason);
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => controller.abort(new DOMException('The request timed out. Please try again.', 'TimeoutError')), timeoutMs);
      try {
        // Consume the body within the deadline too, so a stalled response cannot hang JSON parsing.
        const response = await transport(input, { ...init, signal: controller.signal });
        if (method === 'HEAD' || response.status === 204 || response.status === 304) return response;
        const body = await response.arrayBuffer();
        return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
      }
    };
    if (safe && monitor.isOffline()) await monitor.waitUntilOnline(signal);
    const outageVersion = monitor.getOutageVersion?.();
    try {
      return await attempt();
    } catch (error) {
      if (signal?.aborted) throw error;
      const online = await monitor.check();
      const interruptedByOutage = outageVersion !== undefined && outageVersion !== monitor.getOutageVersion?.();
      if (!safe || (online && !interruptedByOutage)) throw error;
      // Keep the original consumer mounted and resolve its read after recovery.
      // No request is running during this wait; the offline screen supplies recovery UI.
      await monitor.waitUntilOnline(signal);
      return attempt();
    }
  };
}
