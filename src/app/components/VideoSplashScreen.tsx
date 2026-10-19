import { useEffect, useRef, useState } from "react";

interface VideoSplashScreenProps {
  readyToReveal: boolean;
  onPlaybackComplete: () => void;
  onDismiss: () => void;
  src?: string;
}

/** One mounted instance plays once; background resumes keep the current position. */
export function VideoSplashScreen({
  readyToReveal,
  onPlaybackComplete,
  onDismiss,
  src = "/videos/ccs-connect-splash.mp4",
}: VideoSplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const video = videoRef.current!;
    let finished = false;
    let disposed = false;
    let watchdog: number | undefined;
    let lastPosition = 0;
    const finish = () => {
      if (finished || disposed) return;
      finished = true;
      window.clearTimeout(watchdog);
      video.pause();
      onPlaybackComplete();
    };
    // Only a loading/stall fallback, never the normal playback duration.
    const watchProgress = () => {
      window.clearTimeout(watchdog);
      if (!finished && !document.hidden) {
        watchdog = window.setTimeout(finish, 15_000);
      }
    };
    const play = () => {
      if (finished || disposed || document.hidden) return;
      video.muted = true;
      void video.play().catch(() => {
        if (!document.hidden) finish();
      });
      watchProgress();
    };
    const timeUpdated = () => {
      if (video.currentTime <= lastPosition) return;
      lastPosition = video.currentTime;
      watchProgress();
    };
    const visibilityChanged = () => {
      if (document.hidden) {
        window.clearTimeout(watchdog);
        video.pause();
      } else {
        play();
      }
    };
    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    video.addEventListener("timeupdate", timeUpdated);
    document.addEventListener("visibilitychange", visibilityChanged);
    play();
    return () => {
      disposed = true;
      window.clearTimeout(watchdog);
      document.removeEventListener("visibilitychange", visibilityChanged);
      video.removeEventListener("ended", finish);
      video.removeEventListener("error", finish);
      video.removeEventListener("timeupdate", timeUpdated);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, onPlaybackComplete]);

  useEffect(() => {
    if (!readyToReveal) return;
    // Let the destination paint underneath before beginning the fade.
    const frame = requestAnimationFrame(() => setFading(true));
    return () => cancelAnimationFrame(frame);
  }, [readyToReveal]);

  useEffect(() => {
    if (!fading) return;
    // Cleanup fallback if transitionend is suppressed by a background WebView.
    const timeout = window.setTimeout(onDismiss, 350);
    return () => window.clearTimeout(timeout);
  }, [fading, onDismiss]);

  return (
    <div
      aria-label="CCS Connect starting"
      role="status"
      onTransitionEnd={(event) => {
        if (fading && event.target === event.currentTarget) onDismiss();
      }}
      style={{
        position: "fixed", inset: 0, zIndex: 2147483647,
        background: "#501814 url('/videos/ccs-connect-splash-poster.jpg') center / cover no-repeat",
        opacity: fading ? 0 : 1, transition: "opacity 250ms ease-out",
        overflow: "hidden", touchAction: "none",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster="/videos/ccs-connect-splash-poster.jpg"
        autoPlay muted playsInline preload="auto"
        controls={false} loop={false} disablePictureInPicture
        aria-hidden="true"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
