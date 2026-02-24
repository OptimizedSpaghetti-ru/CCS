import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import type { ReactNode } from "react";

function SocialButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: c.white,
        border: `1.5px solid rgba(139,115,85,0.25)`,
        borderRadius: 12,
        height: 46,
        cursor: "pointer",
        fontFamily: fonts.ui,
        fontSize: 13,
        fontWeight: 500,
        color: c.darkBrown,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function InputField({
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  rightElement,
}: {
  icon: ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  rightElement?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: c.cream,
        borderRadius: 10,
        padding: "0 14px",
        height: 52,
        border: `2px solid transparent`,
      }}
    >
      <div style={{ color: c.warmGray, flexShrink: 0 }}>{icon}</div>
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
      {rightElement}
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

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
      <div style={{ background: g.header, paddingBottom: 28, flexShrink: 0 }}>
        <div style={{ padding: "8px 24px 0" }}>
          <button
            onClick={() => navigate("/")}
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
              marginBottom: 16,
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
              fontSize: 28,
              fontWeight: 700,
              color: c.cream,
              margin: 0,
            }}
          >
            Welcome Back
          </h1>
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 14,
              color: c.warmGrayLight,
              margin: "4px 0 0",
            }}
          >
            CCS Connect — OLFU
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* Email/ID */}
          <div>
            <label
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: c.darkBrown,
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Email or Student ID
            </label>
            <InputField
              icon={<User size={18} />}
              placeholder="e.g. 2021-10432 or email"
              value={email}
              onChange={setEmail}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: c.darkBrown,
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Password
            </label>
            <InputField
              icon={<Lock size={18} />}
              placeholder="Enter your password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={setPassword}
              rightElement={
                <button
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: c.warmGray,
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>

          {/* Forgot */}
          <div style={{ textAlign: "right" }}>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: fonts.ui,
                fontSize: 13,
                color: c.baseRed,
                fontWeight: 500,
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Login button */}
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
              marginTop: 4,
            }}
          >
            Log In
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "4px 0",
            }}
          >
            <div
              style={{ flex: 1, height: 1, background: "rgba(139,115,85,0.2)" }}
            />
            <span
              style={{ fontFamily: fonts.ui, fontSize: 12, color: c.warmGray }}
            >
              or continue with
            </span>
            <div
              style={{ flex: 1, height: 1, background: "rgba(139,115,85,0.2)" }}
            />
          </div>

          {/* Social */}
          <div style={{ display: "flex", gap: 10 }}>
            <SocialButton
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
              }
              label="Google"
            />
            <SocialButton
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    d="M8.5 0L0 3V9L8.5 18L17 9V3L8.5 0ZM14 8L8.5 13.5L3 8V4.5L8.5 2L14 4.5V8Z"
                    fill="#00A4EF"
                  />
                </svg>
              }
              label="Microsoft"
            />
          </div>

          {/* Register link */}
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <span
              style={{ fontFamily: fonts.ui, fontSize: 14, color: c.warmGray }}
            >
              Don't have an account?{" "}
            </span>
            <button
              onClick={() => navigate("/register")}
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
              Register
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
