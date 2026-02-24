import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Hash,
  Mail,
  Book,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import type { ReactNode } from "react";

function FormField({
  icon,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  rightEl,
}: {
  icon: ReactNode;
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  rightEl?: ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 600,
          color: c.darkBrown,
          display: "block",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: c.cream,
          borderRadius: 10,
          padding: "0 14px",
          height: 48,
          border: `2px solid transparent`,
        }}
      >
        <span style={{ color: c.warmGray, flexShrink: 0 }}>{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: fonts.ui,
            fontSize: 14,
            color: c.darkBrown,
            minWidth: 0,
          }}
        />
        {rightEl}
      </div>
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "",
    id: "",
    email: "",
    dept: "",
    yearSection: "",
    program: "",
    password: "",
    confirm: "",
  });
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      style={{
        minHeight: "100vh",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: c.creamLight,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ background: g.header, paddingBottom: 24, flexShrink: 0 }}>
        <div style={{ padding: "8px 24px 0" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "rgba(255,240,196,0.15)",
              border: "1px solid rgba(255,240,196,0.2)",
              borderRadius: 8,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M11 4L6 9L11 14"
                stroke={c.cream}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              fontWeight: 700,
              color: c.cream,
              margin: 0,
            }}
          >
            Create Account
          </h1>
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.warmGrayLight,
              margin: "3px 0 16px",
            }}
          >
            Join the CCS Connect community
          </p>

          {/* Role Tab Switcher */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,240,196,0.12)",
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}
          >
            {(["student", "faculty"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 36,
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fonts.ui,
                  fontSize: 13,
                  fontWeight: 600,
                  background: role === r ? g.button : "transparent",
                  color: role === r ? c.cream : `${c.cream}80`,
                  transition: "all 0.2s",
                }}
              >
                {r === "student" ? (
                  <GraduationCap size={15} />
                ) : (
                  <BookOpen size={15} />
                )}
                {r === "student" ? "Student" : "Faculty"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 32px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, x: role === "student" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: role === "student" ? 20 : -20 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {/* Role Badge Preview */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: c.white,
                borderRadius: 10,
                padding: "10px 14px",
                border: `1.5px solid rgba(140,16,7,0.15)`,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  background: role === "student" ? "#3B5280" : g.button,
                  borderRadius: 20,
                  padding: "3px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{ fontSize: 12 }}>
                  {role === "student" ? "🎓" : "📘"}
                </span>
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    fontWeight: 600,
                    color: c.white,
                  }}
                >
                  {role === "student" ? "Student" : "Faculty"}
                </span>
              </div>
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                }}
              >
                Registering as{" "}
                {role === "student" ? "a student" : "faculty member"}
              </span>
            </div>

            <FormField
              icon={<User size={16} />}
              label="Full Name"
              placeholder="e.g. Juan dela Cruz"
              value={form.name}
              onChange={set("name")}
            />
            <FormField
              icon={<Hash size={16} />}
              label={role === "student" ? "Student ID" : "Employee ID"}
              placeholder={
                role === "student" ? "e.g. 2021-10432" : "e.g. FAC-2018-045"
              }
              value={form.id}
              onChange={set("id")}
            />
            <FormField
              icon={<Mail size={16} />}
              label="Email Address"
              placeholder={
                role === "student"
                  ? "yourname@student.fatima.edu.ph"
                  : "yourname@fatima.edu.ph"
              }
              type="email"
              value={form.email}
              onChange={set("email")}
            />
            <FormField
              icon={<Book size={16} />}
              label="Department"
              placeholder="e.g. BSCS, BSIT, BSCS-SE"
              value={form.dept}
              onChange={set("dept")}
            />
            {role === "student" ? (
              <FormField
                icon={<Book size={16} />}
                label="Year & Section"
                placeholder="e.g. 3rd Year - BSCS 3-A"
                value={form.yearSection}
                onChange={set("yearSection")}
              />
            ) : (
              <FormField
                icon={<Book size={16} />}
                label="Program Handled"
                placeholder="e.g. BSCS, BSIT"
                value={form.program}
                onChange={set("program")}
              />
            )}
            <FormField
              icon={<Lock size={16} />}
              label="Password"
              placeholder="Min. 8 characters"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              rightEl={
                <button
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: c.warmGray,
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <FormField
              icon={<Lock size={16} />}
              label="Confirm Password"
              placeholder="Re-enter password"
              type="password"
              value={form.confirm}
              onChange={set("confirm")}
            />

            <button
              onClick={() => navigate("/app/home")}
              style={{
                background: g.button,
                border: "none",
                borderRadius: 12,
                height: 52,
                width: "100%",
                fontFamily: fonts.ui,
                fontSize: 16,
                fontWeight: 600,
                color: c.cream,
                cursor: "pointer",
                boxShadow: shadow.button,
                marginTop: 8,
              }}
            >
              Create Account
            </button>

            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: c.warmGray,
                }}
              >
                Already have an account?{" "}
              </span>
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: c.baseRed,
                  fontWeight: 600,
                }}
              >
                Log In
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
