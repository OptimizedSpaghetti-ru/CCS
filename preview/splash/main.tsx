import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatedSplashScreen, SPLASH_DURATION_MS } from '../../src/standalone/splash/AnimatedSplashScreen';
import './preview.css';

function Preview() {
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [replay, setReplay] = useState(0);
  const [time, setTime] = useState<number>();
  const [status, setStatus] = useState('Loading reference');
  const [ready, setReady] = useState(false);
  const [referenceError, setReferenceError] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [blend, setBlend] = useState(0.5);

  function playBoth() {
    if (video.current) {
      video.current.currentTime = 0;
      void video.current.play().catch(() => setReferenceError(true));
    }
    setTime(undefined);
    setReplay(value => value + 1);
    setStatus('Playing');
    setReady(true);
  }

  useEffect(() => {
    // Mount the code timeline only after the original can play and the logo is decoded.
    const logo = new Image();
    logo.src = '/branding/school-logo.png';
    let disposed = false;
    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      try { await logo.decode(); } catch { /* The image remains accessible via its label. */ }
      if (!disposed) playBoth();
    };
    const reference = video.current!;
    const fail = () => { setReferenceError(true); void start(); };
    reference.addEventListener('canplay', start, { once: true });
    reference.addEventListener('error', fail, { once: true });
    if (reference.readyState >= 3) void start();
    return () => { disposed = true; reference.removeEventListener('canplay', start); reference.removeEventListener('error', fail); };
  }, []);

  function seek(value: number) {
    video.current?.pause();
    if (video.current && Number.isFinite(video.current.duration)) video.current.currentTime = Math.min(value, video.current.duration);
    setTime(value * 1000);
    setStatus('Paused for comparison');
  }

  return <main>
    <header><h1>Splash animation preview</h1><p>Standalone review · application startup is unchanged</p></header>
    <section className="preview-controls" aria-label="Preview controls">
      <button onClick={playBoth} disabled={!ready}>Replay both</button>
      <button onClick={() => { void stage.current?.requestFullscreen().catch(() => setFullscreenError(true)); }}>Full screen</button>
      <label><input type="checkbox" checked={overlay} onChange={e => setOverlay(e.target.checked)} /> Overlay comparison</label>
      <span role="status">{status}</span>
      <div className="timeline"><label htmlFor="timestamp">Compare timestamp</label><input id="timestamp" type="range" min="0" max={SPLASH_DURATION_MS / 1000} step="0.001" value={(time ?? 0) / 1000} onChange={e => seek(Number(e.target.value))} /><output>{time === undefined ? 'Playback' : `${(time / 1000).toFixed(3)} s`}</output></div>
      {overlay && <label className="timeline">Original opacity<input type="range" min="0" max="1" step="0.01" value={blend} onChange={e => setBlend(Number(e.target.value))} /></label>}
    </section>
    {referenceError && <p role="alert">Original video could not play. The code preview is still available; reload to retry the video.</p>}
    {fullscreenError && <p role="alert">Full screen is unavailable in this browser. Use the preview panels below.</p>}
    <div ref={stage} className={`comparison ${overlay ? 'comparison-overlay' : ''}`}>
      <figure><figcaption>Code · React / SVG</figcaption><div className="phone-stage">{ready && <AnimatedSplashScreen replayKey={replay} timeMs={time} onComplete={() => setStatus('Finished')} />}</div></figure>
      <figure className="reference" style={overlay ? { opacity: blend } : undefined}><figcaption>Original · MP4</figcaption><div className="phone-stage"><video ref={video} src="/videos/ccs-connect-splash.mp4" muted playsInline preload="auto" aria-label="Original splash video for comparison only" /></div></figure>
    </div>
    <footer>Drag the timestamp to pause both versions at the same moment. The original framing is 9:16; the logo is at 45.6% of frame height, as in the video.</footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><Preview /></React.StrictMode>);
