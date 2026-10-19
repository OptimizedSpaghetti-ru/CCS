import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatedSplashScreen } from '../../standalone/splash/AnimatedSplashScreen';
import './StartupSplashScreen.css';

class AnimationBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() {
    return this.state.failed
      ? <div className="animated-splash startup-static"><div className="splash-logo-plane"><img src="/branding/school-logo.png" alt="School logo" /></div></div>
      : this.props.children;
  }
}

interface StartupSplashScreenProps {
  readyToReveal: boolean;
  onPlaybackComplete: () => void;
  onDismiss: () => void;
  initializationError?: string | null;
}

/** Launch-only wrapper; the reference animation itself is left unchanged. */
export function StartupSplashScreen({ readyToReveal, onPlaybackComplete, onDismiss, initializationError }: StartupSplashScreenProps) {
  const root = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const [complete, setComplete] = useState(false);
  const [fading, setFading] = useState(false);
  const [slowInitialization, setSlowInitialization] = useState(false);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setComplete(true);
    onPlaybackComplete();
  }, [onPlaybackComplete]);

  useEffect(() => {
    let paused: Animation[] = [];
    let watchdog: number | undefined;
    const visibilityChanged = () => {
      window.clearTimeout(watchdog);
      if (document.hidden) {
        paused = root.current!.getAnimations({ subtree: true }).filter(a => a.playState === 'running');
        paused.forEach(a => a.pause());
      } else if (!finished.current) {
        paused.forEach(a => { if (a.playState === 'paused') a.play(); });
        paused = [];
        // Failure fallback only; normal completion comes from the animation.
        watchdog = window.setTimeout(finish, 8000);
      }
    };
    visibilityChanged();
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      window.clearTimeout(watchdog);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [finish]);

  useEffect(() => {
    if (!complete || readyToReveal) return;
    const timer = window.setTimeout(() => setSlowInitialization(true), 15000);
    return () => window.clearTimeout(timer);
  }, [complete, readyToReveal]);

  useEffect(() => {
    if (!readyToReveal) return;
    // Paint the resolved destination beneath the entire splash before fading.
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setFading(true));
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame); };
  }, [readyToReveal]);

  useEffect(() => {
    if (!fading) return;
    const timeout = window.setTimeout(onDismiss, 350);
    return () => window.clearTimeout(timeout);
  }, [fading, onDismiss]);

  return <div ref={root} className={`startup-splash${fading ? ' startup-splash-fading' : ''}`}
    data-startup-splash data-playback-complete={complete} aria-label="CCS Connect starting" role="status"
    onTransitionEnd={event => {
      if (fading && event.target === event.currentTarget && event.propertyName === 'opacity') onDismiss();
    }}>
    <AnimationBoundary onFailure={finish}><AnimatedSplashScreen onComplete={finish} /></AnimationBoundary>
    {complete && !readyToReveal && (initializationError || slowInitialization) && <div className="startup-recovery">
      <p>{initializationError ? 'Your session could not be restored. Please check your connection and retry.' : 'Restoring your session is taking longer than usual. You can wait or retry.'}</p>
      <button onClick={() => window.location.reload()}>Retry startup</button>
    </div>}
  </div>;
}
