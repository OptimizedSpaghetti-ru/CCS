import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Clock,
  Bell,
  MessageSquare,
  Users,
  Megaphone,
  Calendar,
  AlertCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";

function Toggle({
  value,
  onChange,
  large,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  large?: boolean;
}) {
  const w = large ? 56 : 44;
  const h = large ? 32 : 26;
  const dotSize = large ? 26 : 20;
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        background: value ? g.button : "rgba(139,115,85,0.3)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.25s",
        flexShrink: 0,
        boxShadow: value ? shadow.button : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: (h - dotSize) / 2,
          left: value ? w - dotSize - (h - dotSize) / 2 : (h - dotSize) / 2,
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: c.white,
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          transition: "left 0.25s",
        }}
      />
    </div>
  );
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function NotificationSettings() {
  const navigate = useNavigate();
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [settings, setSettings] = useState({
    directMessages: true,
    groupMentions: true,
    announcements: true,
    scheduleChanges: false,
    systemAlerts: true,
  });
  const [quietHours, setQuietHours] = useState(true);
  const [quietFrom, setQuietFrom] = useState("10:00 PM");
  const [quietTo, setQuietTo] = useState("6:00 AM");
  const [activeDays, setActiveDays] = useState([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ]);
  const [sound, setSound] = useState("Chime");

  const toggle = (k: keyof typeof settings) => (v: boolean) =>
    setSettings((prev) => ({ ...prev, [k]: v }));
  const toggleDay = (day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const categories = [
    {
      key: "directMessages",
      icon: <MessageSquare size={18} color={c.baseRed} />,
      label: "Direct Messages",
      desc: "When someone messages you",
    },
    {
      key: "groupMentions",
      icon: <Users size={18} color={c.baseRed} />,
      label: "Group Mentions",
      desc: "When you're mentioned in a group",
    },
    {
      key: "announcements",
      icon: <Megaphone size={18} color={c.baseRed} />,
      label: "Announcements",
      desc: "Important campus announcements",
    },
    {
      key: "scheduleChanges",
      icon: <Calendar size={18} color={c.baseRed} />,
      label: "Schedule Changes",
      desc: "Class and event updates",
    },
    {
      key: "systemAlerts",
      icon: <AlertCircle size={18} color={c.baseRed} />,
      label: "System Alerts",
      desc: "App and account notifications",
    },
  ] as const;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: c.creamLight,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: g.header,
          padding: "12px 16px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate("/app/notifications")}
          style={{
            background: "rgba(255,240,196,0.15)",
            border: "none",
            borderRadius: 8,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={18} color={c.cream} />
        </button>
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 20,
            fontWeight: 700,
            color: c.cream,
            margin: 0,
          }}
        >
          Notification Settings
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Master Toggle */}
        <div
          style={{
            background: masterEnabled ? g.header : c.white,
            borderRadius: 16,
            padding: "16px",
            boxShadow: shadow.card,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 14,
            transition: "background 0.3s",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "rgba(255,240,196,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bell size={24} color={masterEnabled ? c.cream : c.baseRed} />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 15,
                fontWeight: 700,
                color: masterEnabled ? c.cream : c.darkBrown,
                margin: 0,
              }}
            >
              Enable All Notifications
            </p>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                color: masterEnabled ? c.warmGrayLight : c.warmGray,
                margin: "2px 0 0",
              }}
            >
              {masterEnabled
                ? "Notifications are active"
                : "All notifications are paused"}
            </p>
          </div>
          <Toggle value={masterEnabled} onChange={setMasterEnabled} large />
        </div>

        {/* Per-category toggles */}
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            fontWeight: 700,
            color: c.warmGray,
            textTransform: "uppercase",
            letterSpacing: 1,
            margin: "0 0 10px",
          }}
        >
          Categories
        </p>
        <div
          style={{
            background: c.white,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: shadow.card,
            marginBottom: 20,
            opacity: masterEnabled ? 1 : 0.5,
          }}
        >
          {categories.map(({ key, icon, label, desc }, i) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderBottom:
                  i < categories.length - 1
                    ? "1px solid rgba(139,115,85,0.08)"
                    : "none",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  width: 28,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
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
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    color: c.warmGray,
                    margin: "2px 0 0",
                    fontStyle: "italic",
                  }}
                >
                  {desc}
                </p>
              </div>
              <Toggle
                value={masterEnabled && settings[key]}
                onChange={(v) => {
                  if (masterEnabled) toggle(key)(v);
                }}
              />
            </div>
          ))}
        </div>

        {/* Quiet Hours */}
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            fontWeight: 700,
            color: c.warmGray,
            textTransform: "uppercase",
            letterSpacing: 1,
            margin: "0 0 10px",
          }}
        >
          Quiet Hours
        </p>
        <div
          style={{
            background: c.white,
            borderRadius: 16,
            padding: "16px",
            boxShadow: shadow.card,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: quietHours ? 14 : 0,
            }}
          >
            <Clock size={20} color={c.baseRed} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  fontWeight: 600,
                  color: c.darkBrown,
                  margin: 0,
                }}
              >
                Enable Quiet Hours
              </p>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  margin: "2px 0 0",
                }}
              >
                Mute all notifications during set hours
              </p>
            </div>
            <Toggle value={quietHours} onChange={setQuietHours} />
          </div>

          {quietHours && (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "From", value: quietFrom, set: setQuietFrom },
                  { label: "To", value: quietTo, set: setQuietTo },
                ].map((t) => (
                  <div key={t.label} style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        fontWeight: 600,
                        color: c.warmGray,
                        margin: "0 0 5px",
                      }}
                    >
                      {t.label}
                    </p>
                    <select
                      value={t.value}
                      onChange={(e) => t.set(e.target.value)}
                      style={{
                        width: "100%",
                        height: 40,
                        background: c.creamLight,
                        border: `1.5px solid rgba(139,115,85,0.2)`,
                        borderRadius: 9,
                        padding: "0 10px",
                        fontFamily: fonts.ui,
                        fontSize: 13,
                        color: c.darkBrown,
                        cursor: "pointer",
                      }}
                    >
                      {[
                        "8:00 PM",
                        "9:00 PM",
                        "10:00 PM",
                        "11:00 PM",
                        "12:00 AM",
                      ].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                      {["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Day selector */}
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.warmGray,
                  margin: "0 0 8px",
                }}
              >
                Active Days
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      flex: 1,
                      height: 34,
                      background: activeDays.includes(day)
                        ? g.button
                        : c.creamLight,
                      border: `1.5px solid ${activeDays.includes(day) ? "transparent" : "rgba(139,115,85,0.2)"}`,
                      borderRadius: 8,
                      fontFamily: fonts.ui,
                      fontSize: 10,
                      fontWeight: 700,
                      color: activeDays.includes(day) ? c.cream : c.warmGray,
                      cursor: "pointer",
                    }}
                  >
                    {day.slice(0, 1)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sound picker */}
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            fontWeight: 700,
            color: c.warmGray,
            textTransform: "uppercase",
            letterSpacing: 1,
            margin: "0 0 10px",
          }}
        >
          Notification Sound
        </p>
        <div
          style={{
            background: c.white,
            borderRadius: 16,
            padding: "14px 16px",
            boxShadow: shadow.card,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Chime", "Bell", "Ping", "Soft", "None"].map((s) => (
              <button
                key={s}
                onClick={() => setSound(s)}
                style={{
                  padding: "8px 16px",
                  background: sound === s ? g.button : c.creamLight,
                  border: `1.5px solid ${sound === s ? "transparent" : "rgba(139,115,85,0.2)"}`,
                  borderRadius: 20,
                  fontFamily: fonts.ui,
                  fontSize: 13,
                  fontWeight: 600,
                  color: sound === s ? c.cream : c.darkBrown,
                  cursor: "pointer",
                  boxShadow: sound === s ? shadow.button : "none",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {s === "None" ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  {s}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
