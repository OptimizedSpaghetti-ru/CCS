import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { WifiOff } from 'lucide-react';
import { connectivity } from '../../lib/connectivity';
import './OfflineBoundary.css';

export function OfflineBoundary({ children }: { children: ReactNode }) {
  const { offline } = useSyncExternalStore(connectivity.subscribe, connectivity.getSnapshot);
  const banner = useRef<HTMLElement>(null);
  useEffect(() => connectivity.start(), []);
  useEffect(() => {
    if (!offline) return;
    let frame = 0;
    const observed = new Set<Element>();
    const measure = () => {
      let bottom = 0;
      document.querySelectorAll('[data-offline-bottom-anchor]').forEach(control => {
        if (!observed.has(control)) { observed.add(control); resize.observe(control); }
        const rect = control.getBoundingClientRect();
        if (rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight) bottom = Math.max(bottom, innerHeight - rect.top);
      });
      observed.forEach(control => { if (!control.isConnected) { resize.unobserve(control); observed.delete(control); } });
      banner.current?.style.setProperty('--offline-bottom', bottom ? `${bottom}px` : 'env(safe-area-inset-bottom, 0px)');
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    measure();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutations.disconnect(); window.removeEventListener('resize', schedule); };
  }, [offline]);
  return <>
    {children}
    {offline && <section ref={banner} className="offline-banner" role="status" aria-live="polite" aria-atomic="true">
      <div className="offline-icon"><WifiOff size={27} strokeWidth={1.8} aria-hidden="true" /></div>
      <div className="offline-copy">
        <p className="offline-title">You're offline</p>
        <p className="offline-description">Please check your internet connection.</p>
      </div>
    </section>}
  </>;
}
