import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Edit2,
  Mail,
  Phone,
  ChevronRight,
  Settings,
  Lock,
  HelpCircle,
  LogOut,
  GraduationCap,
  BookOpen,
  Building2,
  CalendarDays,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { useApp } from "../context/AppContext";
import type { ReactNode } from "react";

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: c.white,
        borderRadius: 16,
        padding: "14px 16px",
        boxShadow: shadow.card,
      }}
    >
      <p
        style={{
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 700,
          color: c.warmGray,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          margin: "0 0 12px",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingBottom: 10,
        marginBottom: 10,
        borderBottom: "1px solid rgba(139,115,85,0.1)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${c.baseRed}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color: c.baseRed }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 10,
            color: c.warmGray,
            margin: 0,
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 13,
            color: c.darkBrown,
            margin: "1px 0 0",
            fontWeight: 500,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "12px 0",
        textAlign: "left",
        borderBottom: "1px solid rgba(139,115,85,0.08)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: destructive ? `${c.baseRed}10` : `${c.baseRed}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color: destructive ? c.baseRed : c.darkBrown }}>
          {icon}
        </span>
      </div>
      <span
        style={{
          fontFamily: fonts.ui,
          fontSize: 14,
          color: destructive ? c.baseRed : c.darkBrown,
          fontWeight: 500,
          flex: 1,
        }}
      >
        {label}
      </span>
      <ChevronRight size={16} color={c.warmGray} />
    </button>
  );
}

export function Profile() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useApp();

  const [phone, setPhone] = useState("");

  const roleLabel =
    currentUser.role === "admin"
      ? "Admin"
      : currentUser.role === "faculty"
        ? "Faculty"
        : "Student";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowY: "auto", flex: 1 }}>
        {/* Header */}
        <div
          style={{
            background: g.header,
            padding: "16px 20px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "rgba(255,240,196,0.07)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255,240,196,0.05)",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              position: "relative",
            }}
          >
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: g.button,
                  border: `3px solid ${c.baseRed}`,
                  boxShadow: `0 0 0 3px ${c.cream}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 30,
                      fontWeight: 900,
                      color: c.cream,
                    }}
                  >
                    {currentUser.initials}
                  </span>
                )}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#3B5280",
                  borderRadius: 20,
                  padding: "2px 7px",
                  border: `2px solid ${c.darkestRed}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <GraduationCap size={10} color={c.white} />
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 9,
                    fontWeight: 700,
                    color: c.cream,
                  }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: fonts.display,
                  fontSize: 22,
                  fontWeight: 700,
                  color: c.cream,
                  margin: "0 0 4px",
                }}
              >
                {currentUser.name}
              </h2>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 13,
                  color: c.warmGrayLight,
                  margin: 0,
                }}
              >
                {currentUser.role === "student"
                  ? currentUser.yearSection
                  : currentUser.role === "faculty"
                    ? "Faculty"
                    : "Administrator"}
              </p>
              <p
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  color: `${c.warmGrayLight}80`,
                  margin: "3px 0 0",
                }}
              >
                {currentUser.role === "student"
                  ? currentUser.identifier
                  : currentUser.department}
              </p>
            </div>

            <button
              onClick={() => navigate("/app/profile/edit")}
              style={{
                background: "transparent",
                border: `2px solid ${c.cream}60`,
                borderRadius: 20,
                padding: "6px 20px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: fonts.ui,
                fontSize: 13,
                fontWeight: 600,
                color: c.cream,
                cursor: "pointer",
              }}
            >
              <Edit2 size={14} />
              Edit Profile
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Academic / Professional Info */}
          {currentUser.role === "student" ? (
            <InfoCard title="Academic Information">
              <InfoRow
                icon={<Building2 size={14} />}
                label="College"
                value={currentUser.department}
              />
              <InfoRow
                icon={<CalendarDays size={14} />}
                label="Year & Section"
                value={currentUser.yearSection}
              />
            </InfoCard>
          ) : (
            <InfoCard
              title={
                currentUser.role === "faculty"
                  ? "Faculty Information"
                  : "Admin Information"
              }
            >
              <InfoRow
                icon={<Building2 size={14} />}
                label="Department"
                value={currentUser.department}
              />
            </InfoCard>
          )}

          {/* Contact */}
          <InfoCard title="Contact Information">
            <InfoRow
              icon={<Mail size={14} />}
              label="Email"
              value={currentUser.email}
            />
            <InfoRow
              icon={<Phone size={14} />}
              label="Phone"
              value={phone || "Not set"}
            />
          </InfoCard>

          {/* Settings shortcuts */}
          <div
            style={{
              background: c.white,
              borderRadius: 16,
              padding: "10px 16px",
              boxShadow: shadow.card,
            }}
          >
            <SettingRow
              icon={<Settings size={16} />}
              label="App Settings"
              onClick={() => navigate("/app/settings")}
            />
            {currentUser.role === "admin" && (
              <SettingRow
                icon={<Settings size={16} />}
                label="Admin Dashboard"
                onClick={() => navigate("/app/admin")}
              />
            )}
            <SettingRow
              icon={<Lock size={16} />}
              label="Login & Security"
              onClick={() => navigate("/app/settings/security")}
            />
            <SettingRow
              icon={<HelpCircle size={16} />}
              label="Help & Support"
            />
            <SettingRow
              icon={<LogOut size={16} />}
              label="Log Out"
              onClick={handleSignOut}
              destructive
            />
          </div>
        </div>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
