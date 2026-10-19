import { useId, useLayoutEffect, useRef } from 'react';
import './AnimatedSplashScreen.css';

export const SPLASH_DURATION_MS = 1560;

export interface AnimatedSplashScreenProps {
  onComplete?: () => void;
  /** Change to start a fresh playback without remounting the component. */
  replayKey?: number;
  /** Optional deterministic inspection time. Omit for normal, once-only playback. */
  timeMs?: number;
  logoSrc?: string;
  className?: string;
}

function arc(radius: number, start: number, end: number) {
  const point = (angle: number) => [Math.cos(angle * Math.PI / 180) * radius, Math.sin(angle * Math.PI / 180) * radius];
  const a = point(start), b = point(end);
  return `M${a[0]},${a[1]} A${radius},${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${b[0]},${b[1]}`;
}

/** No routing, auth, video, canvas, or application-state dependencies. */
export function AnimatedSplashScreen({ onComplete, replayKey = 0, timeMs, logoSrc = '/branding/school-logo.png', className = '' }: AnimatedSplashScreenProps) {
  const root = useRef<HTMLDivElement>(null);
  const instanceId = useId();
  const id = (name: string) => `${instanceId}-${name}`;
  const paint = (name: string) => `url(#${id(name)})`;
  const callback = useRef(onComplete);
  const animations = useRef<Animation[]>([]);
  callback.current = onComplete;

  useLayoutEffect(() => {
    const el = root.current!;
    const options: KeyframeAnimationOptions = { duration: SPLASH_DURATION_MS, fill: 'both', easing: 'linear' };
    const created: Animation[] = [];
    const animate = (selector: string, frames: Keyframe[]) => {
      el.querySelectorAll<SVGElement | HTMLElement>(selector).forEach(node => created.push(node.animate(frames, options)));
    };
    const turn = (degrees: number): Keyframe[] => [
      { transform: 'rotate(0deg)', offset: 0 },
      { transform: 'rotate(0deg)', offset: 0.13 },
      { transform: `rotate(${degrees * 0.035}deg)`, offset: 0.26 },
      { transform: `rotate(${degrees * 0.16}deg)`, offset: 0.39 },
      { transform: `rotate(${degrees * 0.34}deg)`, offset: 0.52 },
      { transform: `rotate(${degrees * 0.55}deg)`, offset: 0.65 },
      { transform: `rotate(${degrees * 0.77}deg)`, offset: 0.78 },
      { transform: `rotate(${degrees}deg)`, offset: 1 },
    ];
    // Tracked on the original 320px-radius arc at three-frame intervals.
    const primaryAngles = [0, 3, 10, 22, 37, 52, 67, 88, 112, 135, 166, 176, 193, 208, 216];
    animate('.splash-ring-primary', [
      ...primaryAngles.map((angle, index) => ({ transform: `rotate(${angle}deg)`, offset: index * 100 / SPLASH_DURATION_MS })),
      { transform: 'rotate(240deg)', offset: 1 },
    ]);
    animate('.splash-ring-secondary', turn(-310));
    animate('.splash-ring-outer', turn(185));
    animate('.splash-ring-inner', turn(-240));
    animate('.splash-effects', [
      { opacity: 1, offset: 0 }, { opacity: 1, offset: 0.81 },
      { opacity: 0.65, offset: 0.865 }, { opacity: 0, offset: 0.94 }, { opacity: 0, offset: 1 },
    ]);
    animate('.splash-lighting', [
      { opacity: 0.08, offset: 0 }, { opacity: 0.35, offset: 0.2 },
      { opacity: 0.9, offset: 0.55 }, { opacity: 1, offset: 1 },
    ]);
    animate('.splash-flares', [
      { opacity: 0.05, offset: 0 }, { opacity: 0.15, offset: 0.18 },
      { opacity: 0.7, offset: 0.42 }, { opacity: 1, offset: 0.7 }, { opacity: 1, offset: 1 },
    ]);
    // All layers share one timeline origin, including under React StrictMode.
    const start = document.timeline.currentTime;
    created.forEach(animation => { animation.startTime = start; });
    animations.current = created;
    let disposed = false;
    void created[0].finished.then(() => { if (!disposed) callback.current?.(); }).catch(() => {});
    return () => {
      disposed = true;
      created.forEach(animation => animation.cancel());
      animations.current = [];
    };
  }, [replayKey]);

  useLayoutEffect(() => {
    if (timeMs === undefined) return;
    animations.current.forEach(animation => {
      animation.pause();
      animation.currentTime = Math.max(0, Math.min(SPLASH_DURATION_MS, timeMs));
    });
  }, [timeMs, replayKey]);

  return <div ref={root} className={`animated-splash ${className}`} data-animated-splash role="img" aria-label="OLFU College of Computer Studies splash animation">
    <svg className="splash-art" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id('background')} x2="0.12" y2="1">
          <stop stopColor="#50131c" /><stop offset="0.45" stopColor="#3c0c10" /><stop offset="1" stopColor="#270605" />
        </linearGradient>
        <linearGradient id={id('warmth')} x2="0.2" y2="1">
          <stop stopColor="#5a1b20" /><stop offset="0.55" stopColor="#4c1715" /><stop offset="1" stopColor="#330b0b" />
        </linearGradient>
        <linearGradient id={id('pink')} x1="0" y1="0" x2="1" y2="0.7">
          <stop stopColor="#a75a64" /><stop offset="0.5" stopColor="#dc8d95" /><stop offset="1" stopColor="#f5b6bd" />
        </linearGradient>
        <radialGradient id={id('flare')}>
          <stop stopColor="#fff3dc" /><stop offset="0.09" stopColor="#ffe3d5" /><stop offset="0.24" stopColor="#f9858e" stopOpacity="0.85" /><stop offset="0.55" stopColor="#db344e" stopOpacity="0.22" /><stop offset="1" stopColor="#d52b46" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('core')}>
          <stop stopColor="#fff7ed" /><stop offset="0.22" stopColor="#ffd8cb" stopOpacity="0.8" /><stop offset="1" stopColor="#f07b80" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path fill={paint('background')} d="M0 0H1080V1920H0Z" />
      <path className="splash-lighting" fill={paint('warmth')} d="M0 0H1080V1920H0Z" />
      <g fill="#a35a55" opacity="0.014">
        <path d="M0 0H420L600 690 175 365Z" /><path d="M1080 175L735 445 1080 705Z" />
        <path d="M0 1000L462 1265 160 1510Z" /><path d="M1080 1225L782 1170 960 1600Z" />
        <path d="M0 1730L266 1775 100 1920H0Z" /><path d="M560 0H790L712 290Z" />
      </g>
      <g transform="translate(540 876)" className="splash-effects" fill="none">
        <g className="splash-ring-primary splash-rotor">
          <circle r="324" stroke="#ca7f86" strokeWidth="1.7" opacity="0.55" />
          <path d={`${arc(320, -147, -100)} ${arc(320, 33, 80)}`} stroke={paint('pink')} strokeWidth="22" />
          <path d={`${arc(320, -170, -100)} ${arc(320, 10, 80)}`} stroke={paint('pink')} strokeWidth="24" opacity="0.14" />
          <path d={`${arc(296, -145, -32)} ${arc(296, 35, 145)}`} stroke={paint('pink')} strokeWidth="5" opacity="0.55" />
          <g className="splash-flares">
            <path d={`${arc(294, -137, -81)} ${arc(294, 43, 99)}`} stroke="#f0bbb1" strokeWidth="2" />
            {[-111, 69].map(a => <g key={a} transform={`rotate(${a}) translate(296 0)`}>
              <circle r="51" fill={paint('flare')} /><ellipse rx="5" ry="32" fill={paint('core')} />
            </g>)}
          </g>
        </g>
        <g className="splash-ring-secondary splash-rotor">
          <path d={`${arc(346, -172, -73)} ${arc(346, 4, 105)} ${arc(346, 121, 162)}`} stroke="#bf7b81" strokeWidth="1.5" opacity="0.55" />
          <path d={`${arc(359, -82, -10)} ${arc(359, 52, 128)}`} stroke="#b76b74" opacity="0.3" />
          <path d={`${arc(337, -80, -24)} ${arc(337, 99, 158)}`} stroke="#e19ea1" strokeWidth="1.6" opacity="0.7" />
          {[-82, -24, 99, 158].map(a => <circle key={a} cx={337 * Math.cos(a * Math.PI / 180)} cy={337 * Math.sin(a * Math.PI / 180)} r="3" fill="#efb8b6" />)}
        </g>
        <g className="splash-ring-outer splash-rotor">
          <path d={`${arc(391, -155, -91)} ${arc(391, -10, 63)} ${arc(391, 90, 163)}`} stroke="#c48b8a" strokeWidth="1.4" opacity="0.6" />
          <path d={`${arc(376, -171, -68)} ${arc(376, 19, 115)}`} stroke="#d9989b" strokeWidth="1" opacity="0.45" />
          <path d={`${arc(405, -117, -83)} ${arc(405, 65, 99)}`} stroke="#cb888b" strokeWidth="2.5" strokeDasharray="2 13" opacity="0.52" />
          {[-155, -91, 63, 90, 163].map(a => <g key={a} transform={`rotate(${a}) translate(391 0)`}>
            <circle r="2.6" fill="#f0bfc0" /><circle r="10" fill={paint('core')} />
          </g>)}
          <g className="splash-flares">
            {[-94, 85, 176].map(a => <g key={a} transform={`rotate(${a}) translate(390 0)`}>
              <circle r="40" fill={paint('flare')} /><ellipse rx="4" ry="32" fill={paint('core')} />
            </g>)}
          </g>
        </g>
        <g className="splash-ring-inner splash-rotor">
          <path d={`${arc(272, -176, -88)} ${arc(272, -5, 83)} ${arc(282, 101, 158)}`} stroke="#c28180" strokeWidth="1" opacity="0.32" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 47.3) * Math.PI / 180, r = 276 + (i % 6) * 23;
            return <circle key={i} cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={i % 4 === 0 ? 2 : 1} fill="#edb8b3" opacity={0.2 + (i % 3) * 0.15} />;
          })}
        </g>
      </g>
    </svg>
    <div className="splash-logo-plane"><img src={logoSrc} alt="" draggable={false} decoding="sync" /></div>
  </div>;
}
