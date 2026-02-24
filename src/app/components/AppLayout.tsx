import { Outlet } from "react-router";
import { BottomNav } from "./BottomNav";
import { ToastOverlay } from "./ToastOverlay";
import { c } from "../theme";

export function AppLayout() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
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
          minHeight: "100vh",
          paddingBottom: 70,
        }}
      >
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
