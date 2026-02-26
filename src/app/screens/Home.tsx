import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  MessageSquare,
  Map,
  Bell,
  BookOpen,
  ChevronRight,
  Calendar,
  Megaphone,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
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

function StatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: c.white,
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: shadow.card,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        }}
      >
        <span style={{ color: c.baseRed }}>{icon}</span>
        <span
          style={{
            fontFamily: fonts.ui,
            fontSize: 10,
            color: c.warmGray,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          fontFamily: fonts.display,
          fontSize: 20,
          fontWeight: 700,
          color: c.darkBrown,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}

const announcements = [
  {
    id: 1,
    title: "Enrollment for 2nd Semester",
    body: "Online enrollment begins March 3–10. Check your portal for details.",
    time: "2h ago",
    type: "urgent",
  },
  {
    id: 2,
    title: "IT Capstone Defense Schedule",
    body: "Final defense schedules are now posted in the CCS bulletin.",
    time: "5h ago",
    type: "info",
  },
  {
    id: 3,
    title: "Lab Maintenance — Room 302",
    body: "Computer Lab 302 will be unavailable Feb 25–26 for maintenance.",
    time: "1d ago",
    type: "warning",
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "BSCS 3-A Software Engineering",
    time: "8:00 AM",
    room: "Room 302, Tech Bldg",
    type: "class",
  },
  {
    id: 2,
    title: "Data Structures Lab",
    time: "1:00 PM",
    room: "Lab 204, ICT Bldg",
    type: "lab",
  },
  {
    id: 3,
    title: "CCS Student Council Meeting",
    time: "4:00 PM",
    room: "Function Hall",
    type: "event",
  },
];

export function Home() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const handleDemoToast = () => {
    showToast({
      type: "message",
      title: "Prof. Santos messaged you",
      preview: "Please check the updated capstone requirements...",
      time: "now",
    });
  };

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
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
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
              Good morning,
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
              {currentUser.id}
            </p>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,240,196,0.15)",
              border: `2px solid ${c.cream}50`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: fonts.display,
                fontSize: 16,
                fontWeight: 700,
                color: c.cream,
              }}
            >
              JC
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {[
            {
              label: "Unread",
              value: "3",
              bg: "rgba(255,240,196,0.15)",
              color: c.cream,
            },
            {
              label: "GWA",
              value: "1.75",
              bg: "rgba(255,240,196,0.10)",
              color: c.cream,
            },
            {
              label: "Units",
              value: "21",
              bg: "rgba(255,240,196,0.10)",
              color: c.cream,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: s.bg,
                borderRadius: 10,
                padding: "8px 10px",
                textAlign: "center",
                border: "1px solid rgba(255,240,196,0.15)",
              }}
            >
              <p
                style={{
                  fontFamily: fonts.display,
                  fontSize: 18,
                  fontWeight: 700,
                  color: s.color,
                  margin: 0,
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 10,
                  color: `${c.warmGrayLight}90`,
                  margin: 0,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
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
            <QuickAction
              icon={<BookOpen size={20} />}
              label="Courses"
              path="/app/profile"
              color="#059669"
            />
          </div>
        </motion.div>

        {/* Toast Demo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={handleDemoToast}
            style={{
              width: "100%",
              background: `linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)`,
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(29,78,216,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bell size={18} color={c.white} />
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 13,
                    fontWeight: 600,
                    color: c.white,
                    margin: 0,
                  }}
                >
                  Demo Toast Notification
                </p>
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.75)",
                    margin: 0,
                  }}
                >
                  Tap to trigger a slide-in toast
                </p>
              </div>
            </div>
            <ChevronRight size={16} color={c.white} />
          </button>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
              Today's Schedule
            </p>
            <button
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
                View all
              </span>
              <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  background: c.white,
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: shadow.card,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background:
                      event.type === "class"
                        ? `${c.baseRed}18`
                        : event.type === "lab"
                          ? "#1D4ED818"
                          : "#D9770618",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Calendar
                    size={18}
                    color={
                      event.type === "class"
                        ? c.baseRed
                        : event.type === "lab"
                          ? "#1D4ED8"
                          : "#D97706"
                    }
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      fontWeight: 600,
                      color: c.darkBrown,
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.title}
                  </p>
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 11,
                      color: c.warmGray,
                      margin: "2px 0 0",
                    }}
                  >
                    {event.time} · {event.room}
                  </p>
                </div>
                <div
                  style={{
                    background:
                      event.type === "class"
                        ? `${c.baseRed}15`
                        : event.type === "lab"
                          ? "#1D4ED815"
                          : "#D9770615",
                    borderRadius: 20,
                    padding: "3px 8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 10,
                      fontWeight: 600,
                      color:
                        event.type === "class"
                          ? c.baseRed
                          : event.type === "lab"
                            ? "#1D4ED8"
                            : "#D97706",
                    }}
                  >
                    {event.type}
                  </span>
                </div>
              </div>
            ))}
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
            {announcements.map((ann) => (
              <div
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
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
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
            ))}
          </div>
        </motion.div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
