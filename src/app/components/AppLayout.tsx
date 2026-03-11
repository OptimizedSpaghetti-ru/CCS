import { AnimatePresence, motion } from "motion/react";
import { Outlet, useLocation } from "react-router";
import { BottomNav } from "./BottomNav";
import { ToastOverlay } from "./ToastOverlay";
import { c } from "../theme";

export function AppLayout() {
  const location = useLocation();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: c.creamLight,
        position: "relative",
        overflow: "hidden",
        width: "100%",
      }}
    >
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
