import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { connectivity } from '../../lib/connectivity';
import './OfflineBoundary.css';

export function OfflineBoundary({ children }: { children: ReactNode }) {
  const { offline, checking } = useSyncExternalStore(connectivity.subscribe, connectivity.getSnapshot);
  const content = useRef<HTMLDivElement>(null);
  const retry = useRef<HTMLButtonElement>(null);
  useEffect(() => connectivity.start(), []);
  useEffect(() => {
    if (!offline) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    content.current?.setAttribute('inert', '');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    retry.current?.focus();
    return () => {
      content.current?.removeAttribute('inert');
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [offline]);
  return <>
    <div ref={content} aria-hidden={offline || undefined}>{children}</div>
    {offline && <section className="offline-screen" role="dialog" aria-modal="true" aria-labelledby="offline-title" aria-describedby="offline-description">
      <div className="offline-content">
        <div className="offline-icon"><WifiOff size={48} strokeWidth={1.5} aria-hidden="true" /></div>
        <h1 id="offline-title">No Internet Connection</h1>
        <p id="offline-description">Please check your internet connection and try again.</p>
        <button ref={retry} type="button" className="offline-retry" aria-disabled={checking} onClick={() => { if (!checking) void connectivity.check(); }}>
          <RefreshCw size={18} aria-hidden="true" />
          {checking ? 'Checking connection…' : 'Retry Connection'}
        </button>
        <p className="offline-status" role="status" aria-live="polite">{checking ? 'Checking your connection.' : 'We’ll reconnect automatically when you’re back online.'}</p>
      </div>
    </section>}
  </>;
}
