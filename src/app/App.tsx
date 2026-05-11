import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider, useApp } from "./context/AppContext";

function AppShell() {
  const { themePreference, refreshAppData } = useApp();
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const canPullRef = useRef(false);
  const isNativeMobile = Capacitor.isNativePlatform();

  const triggerRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshAppData();
      setRefreshNonce((value) => value + 1);
    } finally {
      window.setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 220);
    }
  };

  return (
    <div
      className="app-container"
      onTouchStart={(event) => {
        if (!isNativeMobile || event.touches.length !== 1) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest("input, textarea, select, button")) return;

        const scrollTop =
          document.scrollingElement?.scrollTop ?? document.documentElement.scrollTop;
        canPullRef.current = scrollTop <= 0;
        touchStartYRef.current = event.touches[0].clientY;
      }}
      onTouchMove={(event) => {
        if (!isNativeMobile || !canPullRef.current || touchStartYRef.current === null) {
          return;
        }

        const delta = event.touches[0].clientY - touchStartYRef.current;
        if (delta <= 0) {
          setPullDistance(0);
          return;
        }

        if (delta > 8) {
          event.preventDefault();
        }
        setPullDistance(Math.min(74, Math.pow(delta, 0.82)));
      }}
      onTouchEnd={() => {
        if (!isNativeMobile || !canPullRef.current) return;
        const shouldRefresh = pullDistance > 54;
        touchStartYRef.current = null;
        canPullRef.current = false;

        if (shouldRefresh) {
          triggerRefresh();
        } else {
          setPullDistance(0);
        }
      }}
      onTouchCancel={() => {
        touchStartYRef.current = null;
        canPullRef.current = false;
        if (!isRefreshing) setPullDistance(0);
      }}
    >
      {isNativeMobile && (pullDistance > 0 || isRefreshing) && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            zIndex: 9999,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(255, 251, 239, 0.96)",
            border: "1px solid rgba(102, 11, 5, 0.16)",
            boxShadow: "0 10px 24px rgba(62, 7, 3, 0.16)",
            display: "grid",
            placeItems: "center",
            transform: `translate(-50%, ${isRefreshing ? 10 : pullDistance - 34}px)`,
            opacity: isRefreshing ? 1 : Math.min(1, pullDistance / 44),
            transition: isRefreshing ? "transform 0.18s ease, opacity 0.18s ease" : "none",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              width: 17,
              height: 17,
              borderRadius: "50%",
              border: "3px solid rgba(140, 16, 7, 0.22)",
              borderTopColor: "#8C1007",
              transform: `rotate(${pullDistance * 5}deg)`,
              animation: isRefreshing ? "ccs-refresh-spin 0.8s linear infinite" : "none",
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes ccs-refresh-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <RouterProvider key={`${themePreference}-${refreshNonce}`} router={router} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
