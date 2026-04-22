import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Outlet, useLocation } from "react-router";
import { BottomNav } from "./BottomNav";
import { ToastOverlay } from "./ToastOverlay";

const SWIPE_REFRESH_MIN_DISTANCE = 130;
const SWIPE_REFRESH_MAX_HORIZONTAL_DRIFT = 90;
const SWIPE_REFRESH_MAX_DURATION_MS = 700;
const SWIPE_REFRESH_BOTTOM_START_ZONE = 120;

type SwipeState = {
  active: boolean;
  eligible: boolean;
  startX: number;
  startY: number;
  startedAt: number;
};

export function AppLayout() {
  const location = useLocation();
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const swipeStateRef = useRef<SwipeState>({
    active: false,
    eligible: false,
    startX: 0,
    startY: 0,
    startedAt: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      window.location.reload();
    }, 180);
  }, [isRefreshing]);

  useEffect(() => {
    const root = layoutRef.current;
    if (!root || !("ontouchstart" in window)) {
      return;
    }

    const resetSwipeState = () => {
      swipeStateRef.current = {
        active: false,
        eligible: false,
        startX: 0,
        startY: 0,
        startedAt: 0,
      };
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isRefreshing || event.touches.length !== 1) {
        resetSwipeState();
        return;
      }

      const touch = event.touches[0];
      const startFromBottom =
        touch.clientY >= window.innerHeight - SWIPE_REFRESH_BOTTOM_START_ZONE;

      swipeStateRef.current = {
        active: true,
        eligible: startFromBottom,
        startX: touch.clientX,
        startY: touch.clientY,
        startedAt: Date.now(),
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      const swipe = swipeStateRef.current;
      if (!swipe.active || !swipe.eligible || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - swipe.startX);
      const deltaY = touch.clientY - swipe.startY;

      if (deltaX > SWIPE_REFRESH_MAX_HORIZONTAL_DRIFT || deltaY > 24) {
        swipeStateRef.current.eligible = false;
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const swipe = swipeStateRef.current;
      if (
        !swipe.active ||
        !swipe.eligible ||
        event.changedTouches.length !== 1
      ) {
        resetSwipeState();
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - swipe.startX);
      const deltaY = touch.clientY - swipe.startY;
      const elapsed = Date.now() - swipe.startedAt;

      const isValidSwipeUp =
        deltaY <= -SWIPE_REFRESH_MIN_DISTANCE &&
        deltaX <= SWIPE_REFRESH_MAX_HORIZONTAL_DRIFT &&
        elapsed <= SWIPE_REFRESH_MAX_DURATION_MS;

      resetSwipeState();

      if (isValidSwipeUp) {
        triggerRefresh();
      }
    };

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", resetSwipeState, { passive: true });

    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", resetSwipeState);
    };
  }, [isRefreshing, triggerRefresh]);

  return (
    <div
      ref={layoutRef}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "var(--app-container-bg, #FFFBEF)",
        position: "relative",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {isRefreshing && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "calc(82px + env(safe-area-inset-bottom, 0px))",
            background: "rgba(62, 7, 3, 0.94)",
            color: "#FFF0C4",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.2,
            padding: "7px 12px",
            zIndex: 250,
            pointerEvents: "none",
          }}
        >
          Refreshing data...
        </div>
      )}
      <ToastOverlay />
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          minHeight: "100dvh",
          paddingBottom: "calc(74px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.992 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
