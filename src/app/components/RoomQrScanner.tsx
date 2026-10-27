import { useEffect, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, RotateCcw, X } from "lucide-react";
import type QrScanner from "qr-scanner";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { parseRoomCheckpoint, type RoomCheckpoint } from "../../lib/room-checkpoints";
import { parseFloorCheckpoint, type FloorId } from "../../lib/floor-checkpoints";
import { c, fonts } from "../theme";
import "./FloorQrScanner.css";

function cameraError(error: unknown): string {
  const detail = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (/requires HTTPS/.test(detail)) return "Camera access requires HTTPS or a supported Android app. Choose your floor manually.";
  if (/NotAllowed|PermissionDenied|permission|denied/i.test(detail)) {
    return "Camera access was denied. Allow camera access in your browser or Android app settings, then retry.";
  }
  if (/NotFound|DevicesNotFound|camera not found|no camera/i.test(detail)) {
    return "No camera was found. Connect a camera or choose your floor manually.";
  }
  if (/NotReadable|TrackStart|in use/i.test(detail)) {
    return "The camera is unavailable or in use by another app. Close the other app and retry.";
  }
  return "Unable to start the camera. Check camera access and retry, or choose your floor manually.";
}

export function RoomQrScanner({ onRoom, onFloor, onClose, onManual, onReturnFocus }: {
  onRoom: (room: RoomCheckpoint) => void;
  onFloor: (floor: FloorId) => void;
  onClose: () => void;
  onManual: () => void;
  onReturnFocus: () => void;
}) {
  // Dialog portals mount after their parent effect. Start only once the actual video exists.
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"starting" | "scanning" | "error" | "paused">("starting");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!video) return;
    let disposed = false;
    let handled = false;
    let stream: MediaStream | null = null;
    let engine: Awaited<ReturnType<typeof QrScanner.createQrEngine>> | null = null;
    let timer: number | undefined;
    let nativeListener: PluginListenerHandle | undefined;
    const releaseEngine = (value: typeof engine) => {
      if (typeof Worker !== "undefined" && value instanceof Worker) value.terminate();
    };
    const stop = () => {
      disposed = true;
      void nativeListener?.remove();
      nativeListener = undefined;
      window.clearTimeout(timer);
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
      releaseEngine(engine);
      engine = null;
      video.pause();
      video.srcObject = null;
    };
    const pause = () => {
      if (disposed) return;
      stop();
      setStatus("paused");
      setMessage("");
    };
    const visibility = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pause);
    if (Capacitor.isNativePlatform()) {
      // Android WebViews need Activity lifecycle events; document.hidden may never change.
      // appStateChange uses onStop, so the permission dialog does not cancel initialization.
      void App.addListener("appStateChange", ({ isActive }) => { if (!isActive) pause(); }).then(listener => {
        if (disposed) void listener.remove();
        else nativeListener = listener;
      });
    }
    setMessage("");
    setStatus("starting");

    const start = async () => {
      try {
        if (document.hidden) { pause(); return; }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access requires HTTPS or a supported Android app. Choose your floor manually.");
        }
        const { default: Scanner } = await import("qr-scanner");
        if (disposed) return;
        // Own the stream: preserve permission errors and avoid library instance timers
        // releasing a replacement stream after a quick pause/resume.
        const nextStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
        if (disposed) { nextStream.getTracks().forEach(track => track.stop()); return; }
        stream = nextStream;
        video.srcObject = stream;
        await video.play();
        if (disposed) return;
        const nextEngine = await Scanner.createQrEngine();
        if (disposed) { releaseEngine(nextEngine); return; }
        engine = nextEngine;
        setStatus("scanning");
        const scan = async () => {
          if (disposed || handled || document.hidden) return;
          try {
            const result = await Scanner.scanImage(video, { qrEngine: nextEngine, returnDetailedScanResult: true });
            if (disposed || handled || document.hidden) return;
            const room = parseRoomCheckpoint(result.data, window.location.origin);
            const floor = room ? null : parseFloorCheckpoint(result.data, window.location.origin);
            if (!room && !floor) {
              setMessage("This is not a supported CCS Connect code. Scan a floor or supported room QR code for Saint Benedict Hall.");
            } else {
              handled = true;
              stop();
              if (room) onRoom(room);
              else if (floor) onFloor(floor);
              return;
            }
          } catch {
            // A camera frame without a readable QR code is expected; try the next frame.
          }
          if (!disposed && !handled) timer = window.setTimeout(() => { void scan(); }, 125);
        };
        void scan();
      } catch (error) {
        if (disposed) return;
        stop();
        setStatus("error");
        setMessage(cameraError(error));
      }
    };
    void start();
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pause);
      stop();
    };
  }, [attempt, onRoom, onFloor, video]);

  const style = {
    "--floor-qr-surface": c.white,
    "--floor-qr-text": c.darkBrown,
    "--floor-qr-accent": c.baseRed,
    "--floor-qr-button-text": c.cream,
    fontFamily: fonts.ui,
  } as CSSProperties;

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="floor-qr-overlay" />
        <Dialog.Content className="floor-qr-dialog" style={style} onCloseAutoFocus={event => { event.preventDefault(); onReturnFocus(); }}>
          <div className="floor-qr-heading">
            <Dialog.Title>Scan QR</Dialog.Title>
            <Dialog.Close className="floor-qr-close" aria-label="Close Scanner"><X size={22} /></Dialog.Close>
          </div>
          <Dialog.Description className="floor-qr-description">
            Scan a floor code (1F–5F) or a supported room code in Saint Benedict Hall. Room codes open the correct floor and highlight the room.
          </Dialog.Description>
          <div className="floor-qr-preview" aria-busy={status === "starting"}>
            <video ref={setVideo} muted playsInline aria-label="Floor and room QR camera preview" />
            {status !== "scanning" && <div className="floor-qr-camera-state"><Camera size={36} aria-hidden="true" /></div>}
          </div>
          <p className="floor-qr-status" role="status">
            {status === "starting" ? "Starting camera…" : status === "scanning" ? "Point your camera at a floor or room QR code." : status === "paused" ? "Camera paused while CCS Connect was in the background." : "Camera could not start."}
          </p>
          {message && <p className="floor-qr-error" role="alert">{message}</p>}
          {(status === "error" || status === "paused") && (
            <button className="floor-qr-retry" type="button" onClick={() => setAttempt(value => value + 1)}>
              <RotateCcw size={18} aria-hidden="true" />{status === "paused" ? "Resume Camera" : "Retry Camera"}
            </button>
          )}
          <button className="floor-qr-manual" type="button" onClick={onManual}>Choose Floor Manually</button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
