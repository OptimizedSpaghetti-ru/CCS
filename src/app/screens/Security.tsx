import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Tablet,
  LogOut,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";

const sessions = [
  {
    id: 1,
    device: "iPhone 14 Pro",
    type: "mobile",
    location: "Valenzuela, Metro Manila",
    lastActive: "Active now",
    current: true,
  },
  {
    id: 2,
    device: "MacBook Pro",
    type: "desktop",
    location: "Valenzuela, Metro Manila",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: 3,
    device: "iPad Air",
    type: "tablet",
    location: "Caloocan, Metro Manila",
    lastActive: "Yesterday",
    current: false,
  },
];

function DeviceIcon({ type }: { type: string }) {
  if (type === "desktop") return <Monitor size={20} color={c.baseRed} />;
  if (type === "tablet") return <Tablet size={20} color={c.baseRed} />;
  return <Smartphone size={20} color={c.baseRed} />;
}

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

export function Security() {
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });

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
          onClick={() => navigate("/app/settings")}
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
          Login & Security
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 24px" }}>
        {/* Change Password */}
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
          Change Password
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
          {[
            {
              key: "current",
              label: "Current Password",
              show: showCurrent,
              setShow: setShowCurrent,
            },
            {
              key: "newPass",
              label: "New Password",
              show: showNew,
              setShow: setShowNew,
            },
            {
              key: "confirm",
              label: "Confirm New Password",
              show: false,
              setShow: () => {},
            },
          ].map((field, i) => (
            <div key={field.key} style={{ marginBottom: i < 2 ? 12 : 0 }}>
              <label
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.darkBrown,
                  display: "block",
                  marginBottom: 5,
                }}
              >
                {field.label}
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: c.cream,
                  borderRadius: 10,
                  padding: "0 14px",
                  height: 46,
                }}
              >
                <Lock size={15} color={c.warmGray} />
                <input
                  type={field.show ? "text" : "password"}
                  placeholder="••••••••"
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    color: c.darkBrown,
                  }}
                />
                {field.key !== "confirm" && (
                  <button
                    onClick={() => field.setShow(!field.show)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: c.warmGray,
                      padding: 0,
                    }}
                  >
                    {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 6,
              padding: "10px",
              background: c.creamLight,
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 11,
                color: c.warmGray,
                margin: 0,
              }}
            >
              Password must be at least 8 characters and contain uppercase,
              lowercase, and a number.
            </p>
          </div>

          <button
            style={{
              width: "100%",
              height: 46,
              background: g.button,
              border: "none",
              borderRadius: 12,
              fontFamily: fonts.ui,
              fontSize: 14,
              fontWeight: 600,
              color: c.cream,
              cursor: "pointer",
              boxShadow: shadow.button,
            }}
          >
            Update Password
          </button>
        </div>

        {/* Two-Factor Authentication */}
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
          Two-Factor Authentication
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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: twoFactor ? `${c.baseRed}15` : c.creamLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck
                size={20}
                color={twoFactor ? c.baseRed : c.warmGray}
              />
            </div>
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
                Enable 2FA
              </p>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  margin: "2px 0 0",
                }}
              >
                {twoFactor
                  ? "Two-factor authentication is active"
                  : "Add an extra layer of security"}
              </p>
            </div>
            <Toggle value={twoFactor} onChange={setTwoFactor} />
          </div>
          {twoFactor && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                background: `${c.baseRed}08`,
                borderRadius: 10,
                border: `1px solid ${c.baseRed}20`,
              }}
            >
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.darkBrown,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCircle2 size={14} color={c.baseRed} />
                2FA is enabled. Authentication codes will be sent to your
                registered email.
              </p>
            </div>
          )}
        </div>

        {/* Active Sessions */}
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
          Active Sessions
        </p>
        <div
          style={{
            background: c.white,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: shadow.card,
            marginBottom: 20,
          }}
        >
          {sessions.map((session, i) => (
            <div
              key={session.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderBottom:
                  i < sessions.length - 1
                    ? "1px solid rgba(139,115,85,0.08)"
                    : "none",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${c.baseRed}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <DeviceIcon type={session.type} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      fontWeight: 600,
                      color: c.darkBrown,
                      margin: 0,
                    }}
                  >
                    {session.device}
                  </p>
                  {session.current && (
                    <span
                      style={{
                        background: "#22C55E20",
                        color: "#16A34A",
                        borderRadius: 20,
                        padding: "1px 7px",
                        fontFamily: fonts.ui,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    color: c.warmGray,
                    margin: "2px 0 0",
                  }}
                >
                  {session.location} · {session.lastActive}
                </p>
              </div>
              {!session.current && (
                <button
                  style={{
                    background: "none",
                    border: `1.5px solid ${c.baseRed}40`,
                    borderRadius: 8,
                    padding: "5px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <LogOut size={13} color={c.baseRed} />
                  <span
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 11,
                      fontWeight: 600,
                      color: c.baseRed,
                    }}
                  >
                    Revoke
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          style={{
            width: "100%",
            height: 46,
            background: "transparent",
            border: `2px solid ${c.baseRed}40`,
            borderRadius: 12,
            fontFamily: fonts.ui,
            fontSize: 14,
            fontWeight: 600,
            color: c.baseRed,
            cursor: "pointer",
          }}
        >
          Sign Out All Other Devices
        </button>
      </div>
    </div>
  );
}
