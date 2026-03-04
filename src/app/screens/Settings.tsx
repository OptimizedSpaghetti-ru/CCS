import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  KeyRound,
  Mail,
  BadgeCheck,
  Bell,
  MessageSquare,
  Megaphone,
  Volume2,
  SlidersHorizontal,
  Palette,
  Shield,
  Circle,
  Smartphone,
  FileText,
  Lock,
  LogOut,
  Trash2,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: value ? g.button : "rgba(139,115,85,0.3)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.25s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: value ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: c.white,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 0.25s",
        }}
      />
    </div>
  );
}

function SettingRow({
  icon,
  label,
  sublabel,
  rightEl,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  rightEl: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid rgba(139,115,85,0.08)",
      }}
    >
      <span
        style={{
          width: 28,
          textAlign: "center",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: c.baseRed,
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 14,
            color: c.darkBrown,
            margin: 0,
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        {sublabel && (
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 11,
              color: c.warmGray,
              margin: "2px 0 0",
            }}
          >
            {sublabel}
          </p>
        )}
      </div>
      {rightEl}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p
      style={{
        fontFamily: fonts.ui,
        fontSize: 11,
        fontWeight: 700,
        color: c.warmGray,
        textTransform: "uppercase",
        letterSpacing: 1,
        margin: "20px 0 6px",
      }}
    >
      {text}
    </p>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: c.white,
        borderRadius: 16,
        padding: "2px 16px",
        boxShadow: shadow.card,
      }}
    >
      {children}
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, signOut, showToast } = useApp();
  const [s, setS] = useState({
    pushNotif: true,
    messageAlerts: true,
    announcementAlerts: true,
    sound: false,
    activeStatus: true,
  });
  const toggle = (k: keyof typeof s) => () =>
    setS((prev) => ({ ...prev, [k]: !prev[k] }));

  const [theme, setTheme] = useState<"Light" | "Dark" | "System">("Light");

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
          onClick={() => navigate("/app/profile")}
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
          Settings
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 24px" }}>
        {/* Account */}
        <SectionLabel text="Account" />
        <SectionCard>
          <div
            onClick={() => navigate("/app/settings/security")}
            style={{ cursor: "pointer" }}
          >
            <SettingRow
              icon={<KeyRound size={18} />}
              label="Change Password"
              rightEl={<ChevronRight size={16} color={c.warmGray} />}
            />
          </div>
          <SettingRow
            icon={<Mail size={18} />}
            label="Linked Email"
            sublabel={currentUser.email || "Not set"}
            rightEl={<ChevronRight size={16} color={c.warmGray} />}
          />
          <SettingRow
            icon={<BadgeCheck size={18} />}
            label="Student ID"
            sublabel={currentUser.id || "Not set"}
            rightEl={<ChevronRight size={16} color={c.warmGray} />}
          />
        </SectionCard>

        {/* Notifications */}
        <SectionLabel text="Notifications" />
        <SectionCard>
          <SettingRow
            icon={<Bell size={18} />}
            label="Push Notifications"
            rightEl={
              <Toggle value={s.pushNotif} onChange={toggle("pushNotif")} />
            }
          />
          <SettingRow
            icon={<MessageSquare size={18} />}
            label="Message Alerts"
            rightEl={
              <Toggle
                value={s.messageAlerts}
                onChange={toggle("messageAlerts")}
              />
            }
          />
          <SettingRow
            icon={<Megaphone size={18} />}
            label="Announcement Alerts"
            rightEl={
              <Toggle
                value={s.announcementAlerts}
                onChange={toggle("announcementAlerts")}
              />
            }
          />
          <SettingRow
            icon={<Volume2 size={18} />}
            label="Sound"
            rightEl={<Toggle value={s.sound} onChange={toggle("sound")} />}
          />
          <SettingRow
            icon={<SlidersHorizontal size={18} />}
            label="Notification Settings"
            sublabel="Manage categories & quiet hours"
            rightEl={
              <button
                onClick={() => navigate("/app/notifications/settings")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={16} color={c.warmGray} />
              </button>
            }
          />
        </SectionCard>

        {/* Appearance */}
        <SectionLabel text="Appearance" />
        <SectionCard>
          <div style={{ padding: "12px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  width: 28,
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  color: c.baseRed,
                }}
              >
                <Palette size={18} />
              </span>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: c.darkBrown,
                  margin: 0,
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                Theme
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, marginLeft: 40 }}>
              {(["Light", "Dark", "System"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  style={{
                    flex: 1,
                    height: 36,
                    background: theme === t ? g.button : c.creamLight,
                    border: `1.5px solid ${theme === t ? "transparent" : "rgba(139,115,85,0.2)"}`,
                    borderRadius: 9,
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme === t ? c.cream : c.warmGray,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Privacy */}
        <SectionLabel text="Privacy" />
        <SectionCard>
          <SettingRow
            icon={<Shield size={18} />}
            label="Who can message me"
            sublabel="Everyone"
            rightEl={
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: c.warmGray,
                  }}
                >
                  Everyone
                </span>
                <ChevronDown size={14} color={c.warmGray} />
              </div>
            }
          />
          <SettingRow
            icon={<Circle size={16} fill="#22C55E" color="#22C55E" />}
            label="Active Status"
            sublabel="Show when you're online"
            rightEl={
              <Toggle
                value={s.activeStatus}
                onChange={toggle("activeStatus")}
              />
            }
          />
        </SectionCard>

        {/* About */}
        <SectionLabel text="About" />
        <SectionCard>
          <SettingRow
            icon={<Smartphone size={18} />}
            label="App Version"
            sublabel="v1.0.0 (Build 2024.02)"
            rightEl={
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  color: c.warmGray,
                }}
              >
                Latest
              </span>
            }
          />
          <SettingRow
            icon={<FileText size={18} />}
            label="Terms of Service"
            rightEl={<ChevronRight size={16} color={c.warmGray} />}
          />
          <SettingRow
            icon={<Lock size={18} />}
            label="Privacy Policy"
            rightEl={<ChevronRight size={16} color={c.warmGray} />}
          />
        </SectionCard>

        {/* Danger Zone */}
        <SectionLabel text="Danger Zone" />
        <div
          style={{
            background: c.white,
            borderRadius: 16,
            padding: "2px 16px",
            boxShadow: shadow.card,
          }}
        >
          <div
            style={{
              padding: "12px 0",
              borderBottom: "1px solid rgba(139,115,85,0.08)",
            }}
          >
            <button
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              <span
                style={{
                  width: 28,
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  color: c.baseRed,
                }}
              >
                <LogOut size={18} />
              </span>
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: c.baseRed,
                  fontWeight: 600,
                  flex: 1,
                  textAlign: "left",
                }}
              >
                Log Out
              </span>
            </button>
          </div>
          <div style={{ padding: "12px 0" }}>
            <button
              onClick={async () => {
                if (
                  !window.confirm(
                    "Are you sure you want to delete your account? This cannot be undone.",
                  )
                )
                  return;
                const { error } = await supabase.rpc("delete_own_account");
                if (error) {
                  showToast({
                    type: "error",
                    title: "Delete failed",
                    preview: error.message,
                    time: "now",
                  });
                } else {
                  await signOut();
                  navigate("/");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              <span
                style={{
                  width: 28,
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  color: `${c.baseRed}80`,
                }}
              >
                <Trash2 size={18} />
              </span>
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: `${c.baseRed}80`,
                  fontWeight: 500,
                  flex: 1,
                  textAlign: "left",
                }}
              >
                Delete Account
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
