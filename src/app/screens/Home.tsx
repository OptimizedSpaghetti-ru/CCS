import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  MessageSquare,
  Map,
  Bell,
  BookOpen,
  ChevronRight,
  Megaphone,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

function QuickAction({
  icon,
  label,
  path,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  path: string;
  color: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      className="hover-lift"
      onClick={() => navigate(path)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: c.white,
        borderRadius: 14,
        padding: "16px 8px",
        border: "none",
        cursor: "pointer",
        boxShadow: shadow.card,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <span
        style={{
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 600,
          color: c.darkBrown,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

export function Home() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState<
    { id: string; title: string; body: string; time: string; type: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      /* recent notifications shown as announcements */
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, title, body, type, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (notifs) {
        setAnnouncements(
          notifs.map((n: any) => ({
            id: n.id,
            title: n.title ?? "",
            body: n.body ?? "",
            time: timeAgo(n.created_at),
            type:
              n.type === "announcement"
                ? "urgent"
                : n.type === "event"
                  ? "warning"
                  : "info",
          })),
        );
      }
    })();
  }, [currentUser.id]);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: c.creamLight }}>
      {/* Hero Header */}
      <div
        style={{
          background: g.header,
          padding: "0 20px 28px",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,240,196,0.06)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255,240,196,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                color: c.warmGrayLight,
                margin: "0 0 4px",
              }}
            >
              {getGreeting()}
            </p>
            <h1
              style={{
                fontFamily: fonts.display,
                fontSize: 22,
                fontWeight: 700,
                color: c.cream,
                margin: "0 0 2px",
              }}
            >
              {currentUser.name.split(" ")[0]}
            </h1>
            <p
              style={{
                fontFamily: fonts.mono,
                fontSize: 11,
                color: `${c.warmGrayLight}90`,
                margin: 0,
              }}
            >
              {currentUser.role === "admin"
                ? "Administrator"
                : currentUser.role === "faculty"
                  ? "Faculty"
                  : currentUser.identifier}
            </p>
          </div>
          <button
            className="hover-press"
            onClick={() => navigate("/app/profile")}
            aria-label="Open profile"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,240,196,0.15)",
              border: `2px solid ${c.cream}50`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              overflow: "hidden",
            }}
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontFamily: fonts.display,
                  fontSize: 16,
                  fontWeight: 700,
                  color: c.cream,
                }}
              >
                {currentUser.initials}
              </span>
            )}
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 12,
              fontWeight: 600,
              color: c.warmGray,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              margin: "0 0 10px",
            }}
          >
            Quick Actions
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <QuickAction
              icon={<MessageSquare size={20} />}
              label="Message"
              path="/app/messages"
              color={c.baseRed}
            />
            <QuickAction
              icon={<Map size={20} />}
              label="Navigate"
              path="/app/map"
              color="#1D4ED8"
            />
            <QuickAction
              icon={<Bell size={20} />}
              label="Alerts"
              path="/app/notifications"
              color="#D97706"
            />
            {currentUser.role === "student" && (
              <QuickAction
                icon={<BookOpen size={20} />}
                label="Courses"
                path="/app/profile"
                color="#059669"
              />
            )}
            {currentUser.role === "admin" && (
              <QuickAction
                icon={<BookOpen size={20} />}
                label="Admin"
                path="/app/admin"
                color="#059669"
              />
            )}
            {currentUser.role === "faculty" && (
              <QuickAction
                icon={<BookOpen size={20} />}
                label="Profile"
                path="/app/profile"
                color="#059669"
              />
            )}
          </div>
        </motion.div>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: c.warmGray,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                margin: 0,
              }}
            >
              Announcements
            </p>
            <button
              className="hover-press"
              onClick={() => navigate("/app/notifications")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: c.baseRed,
              }}
            >
              <span
                style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 500 }}
              >
                See all
              </span>
              <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {announcements.length === 0 ? (
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No announcements yet
              </p>
            ) : (
              announcements.map((ann) => (
                <div
                  className="hover-lift"
                  key={ann.id}
                  style={{
                    background: c.white,
                    borderRadius: 12,
                    padding: "12px 14px",
                    boxShadow: shadow.card,
                    borderLeft: `3px solid ${ann.type === "urgent" ? c.baseRed : ann.type === "warning" ? "#D97706" : "#1D4ED8"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <Megaphone
                      size={16}
                      color={
                        ann.type === "urgent"
                          ? c.baseRed
                          : ann.type === "warning"
                            ? "#D97706"
                            : "#1D4ED8"
                      }
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontFamily: fonts.ui,
                          fontSize: 13,
                          fontWeight: 600,
                          color: c.darkBrown,
                          margin: 0,
                        }}
                      >
                        {ann.title}
                      </p>
                      <p
                        style={{
                          fontFamily: fonts.ui,
                          fontSize: 12,
                          color: c.warmGray,
                          margin: "3px 0 0",
                          lineHeight: 1.4,
                        }}
                      >
                        {ann.body}
                      </p>
                      <p
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: 10,
                          color: c.warmGrayLight,
                          margin: "4px 0 0",
                        }}
                      >
                        {ann.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
