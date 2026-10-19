# Standalone splash preview

From the repository root:

```powershell
node node_modules/vite/bin/vite.js --config preview/splash/vite.config.ts
```

Open http://127.0.0.1:5174/. This is a separate development server, with its own HTML entry; it does not import the application, router, session provider, or Supabase. The normal application build does not include the preview page. Production startup now uses this same unchanged animation through a separate launch wrapper; see `docs/ANIMATED_SPLASH.md`. Stop the preview server with Ctrl+C.

Replay restarts both versions. The timestamp slider pauses and seeks both timelines. Overlay comparison and original-opacity adjustment expose alignment differences. Full screen shows the animation alone (or the overlay when enabled); press Escape to exit.

## Reusable component

`src/standalone/splash/AnimatedSplashScreen.tsx` and its adjacent CSS are independent of the preview. One instance plays once, holds its final logo, and calls optional `onComplete` once. A changed `replayKey` restarts it. `timeMs` is an optional inspection control; omit it for playback. The parent must provide explicit width and height. `logoSrc` defaults to the existing `/branding/school-logo.png`. Cancellation on unmount prevents late completion callbacks.

Animation resources use the Web Animations API, transforms and opacity, with SVG geometry and gradients. The original MP4 appears exclusively in the comparison panel. No extracted frame is used in the component. Container units require a modern browser/WebView (Chromium 105+). Android emulator playback has been checked; physical-device performance and sustained 60 FPS have not been measured.

## Reference measurements and fidelity

- Existing reference: `public/videos/ccs-connect-splash.mp4`, 1080 × 1920, 30 FPS, container duration 1.56 seconds, 46 decoded video frames. All decoded frames were inspected in a contact sheet, with larger timestamp comparisons.
- Artwork center: approximately (540, 876), 45.625% down the frame. Preserving this slightly raised video placement takes precedence over moving the logo to the viewport midpoint. SVG cover scaling preserves the composition without stretching; full-screen preview retains 9:16 framing.
- Logo: original unmodified `public/branding/school-logo.png`, **498 × 501**, rendered about 450px wide in source coordinates. Its text and proportions differ slightly from the baked video logo. No higher-resolution source was found. Rings and background are vectors; the logo remains raster and cannot gain native detail beyond the supplied asset.
- Main ring: approximately 320px radius, 22px stroke; fine rings span roughly 272–405px. Clockwise main-arc motion was tracked every three reference frames. Other rings counterrotate or advance independently.
- Ring opacity holds until approximately 1.26s, then fades by approximately 1.47s. The logo stays visible through 1.56s and afterward. The component does not fade away or navigate.

This is a close reference-based recreation, **not a pixel-identical match**. The source contains baked motion blur, bloom, optical streaks, compression texture and particle motion for which the original editable effect parameters are unavailable. SVG radial highlights and layered arcs approximate those effects without expensive animated blur filters. Fine-ring trajectories, tiny particles, polygon boundaries and background lighting are estimates. CSS/SVG can model these effects, but the MP4 alone cannot recover their exact original parameters. The source logo artwork also differs slightly from the available PNG; the original asset is preserved rather than redrawn.

## Checks

No additional dependencies are needed for the animation or preview.

```powershell
node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --module esnext --moduleResolution bundler --target es2022 --lib es2022,dom --skipLibCheck preview/splash/env.d.ts src/standalone/splash/AnimatedSplashScreen.tsx preview/splash/main.tsx preview/splash/lifecycle.fixture.tsx preview/splash/vite.config.ts
npm.cmd run build
```

Optional browser verification uses an existing external Playwright installation:

```powershell
$env:CCS_PLAYWRIGHT_MODULE='file:///absolute/path/to/playwright/index.mjs'
node scripts/verify-animated-splash.mjs
```

This checks desktop/mobile playback, replay, paused timeline alignment, final effects/ logo opacity, image loading, horizontal overflow, absence of backend/auth requests, completion under React StrictMode, and unmount cleanup. Browser checks do not establish Android device performance or identical visual fidelity.
