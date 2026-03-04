import { useNavigate, useLocation } from "react-router";
import { MessageSquare, Map, Home, Bell, User, Shield } from "lucide-react";
import { c, shadow, fonts } from "../theme";
import { useApp } from "../context/AppContext";

type Tab = {
  icon: typeof Home;
  label: string;
  path: string;
};

const studentTabs: Tab[] = [
  { icon: MessageSquare, label: "Messages", path: "/app/messages" },
  { icon: Map, label: "Map", path: "/app/map" },
  { icon: Home, label: "Home", path: "/app/home" },
  { icon: Bell, label: "Notifs", path: "/app/notifications" },
  { icon: User, label: "Profile", path: "/app/profile" },
];

const facultyTabs: Tab[] = [
  { icon: MessageSquare, label: "Messages", path: "/app/messages" },
  { icon: Map, label: "Map", path: "/app/map" },
  { icon: Home, label: "Home", path: "/app/home" },
  { icon: Bell, label: "Notifs", path: "/app/notifications" },
  { icon: User, label: "Profile", path: "/app/profile" },
];

const adminTabs: Tab[] = [
  { icon: Home, label: "Home", path: "/app/home" },
  { icon: Shield, label: "Admin", path: "/app/admin" },
  { icon: MessageSquare, label: "Messages", path: "/app/messages" },
  { icon: Bell, label: "Notifs", path: "/app/notifications" },
  { icon: User, label: "Profile", path: "/app/profile" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadMessages, unreadNotifications, currentUser } = useApp();

  const tabs =
    currentUser.role === "admin"
      ? adminTabs
      : currentUser.role === "faculty"
        ? facultyTabs
        : studentTabs;

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        zIndex: 100,
        background: c.white,
        borderRadius: "24px 24px 0 0",
        boxShadow: shadow.nav,
        display: "flex",
        alignItems: "center",
        padding: "8px 0 6px",
        flexShrink: 0,
        borderTop: `1px solid rgba(139,115,85,0.15)`,
      }}
    >
      {tabs.map(({ icon: Icon, label, path }) => {
        const active = isActive(path);
        const badge =
          path === "/app/messages"
            ? unreadMessages
            : path === "/app/notifications"
              ? unreadNotifications
              : 0;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              position: "relative",
            }}
          >
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: c.baseRed,
                }}
              />
            )}
            <div style={{ position: "relative" }}>
              <Icon
                size={22}
                color={active ? c.baseRed : c.warmGray}
                strokeWidth={active ? 2.5 : 1.8}
              />
              {badge > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    background: c.baseRed,
                    color: c.white,
                    borderRadius: "50%",
                    width: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.ui,
                    fontSize: 9,
                    fontWeight: 700,
                    border: `2px solid ${c.white}`,
                  }}
                >
                  {badge}
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: fonts.ui,
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                color: active ? c.baseRed : c.warmGray,
                letterSpacing: "-0.1px",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
