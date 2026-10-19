// Loaded only by the optional browser verification script.
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatedSplashScreen } from '../../src/standalone/splash/AnimatedSplashScreen';

export async function verifyLifecycle() {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;width:108px;height:192px;left:-1000px';
  document.body.append(host);
  const root = createRoot(host);
  let calls = 0;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  root.render(<StrictMode><AnimatedSplashScreen onComplete={() => { calls++; }} /></StrictMode>);
  await delay(1850);
  const once = calls;
  root.render(<StrictMode><AnimatedSplashScreen replayKey={1} onComplete={() => { calls++; }} /></StrictMode>);
  await delay(100);
  root.unmount();
  const runningAfterUnmount = host.getAnimations({ subtree: true }).length;
  await delay(1600);
  host.remove();
  return { once, afterUnmount: calls, runningAfterUnmount };
}
