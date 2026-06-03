import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import type { ReactNode } from "react";
import { useApp } from "../context/AppContext";

function InputField({
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  rightElement,
  fieldSurface,
  fieldBorder,
  textColor,
  iconColor,
  placeholderColor,
}: {
  icon: ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  rightElement?: ReactNode;
  fieldSurface: string;
  fieldBorder: string;
  textColor: string;
  iconColor: string;
  placeholderColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: fieldSurface,
        borderRadius: 10,
        padding: "0 14px",
        height: 52,
        border: `1.5px solid ${fieldBorder}`,
      }}
    >
      <div style={{ color: iconColor, flexShrink: 0 }}>{icon}</div>
      <input
        className="auth-input"
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
          color: textColor,
          caretColor: textColor,
          minWidth: 0,
          // CSS variable used by .auth-input::placeholder in global styles.
          ["--auth-placeholder-color" as string]: placeholderColor,
        }}
      />
      {rightElement}
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { signIn, resolvedThemeMode } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isDark = resolvedThemeMode === "dark";
  const fieldSurface = isDark ? "#2A141A" : c.white;
  const fieldBorder = isDark ? "rgba(255, 232, 217, 0.35)" : `${c.warmGray}40`;
  const fieldText = c.darkBrown;
  const labelColor = c.darkBrown;
  const iconColor = c.warmGray;
  const placeholderColor = isDark
    ? "rgba(255, 232, 217, 0.7)"
    : "rgba(45, 27, 14, 0.55)";

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    navigate(result.role === "it_support" ? "/app/it-support" : "/app/home", {
      replace: true,
    });
  };

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
              background: `${c.cream}1F`,
              border: `1px solid ${c.cream}33`,
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
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Email/ID */}
          <div>
            <label
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: labelColor,
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
              placeholder="e.g. 01230001234 or email"
              value={email}
              onChange={setEmail}
              fieldSurface={fieldSurface}
              fieldBorder={fieldBorder}
              textColor={fieldText}
              iconColor={iconColor}
              placeholderColor={placeholderColor}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: labelColor,
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
              fieldSurface={fieldSurface}
              fieldBorder={fieldBorder}
              textColor={fieldText}
              iconColor={iconColor}
              placeholderColor={placeholderColor}
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
            onClick={handleLogin}
            disabled={isSubmitting}
            style={{
              background: isSubmitting ? `${c.warmGray}40` : g.button,
              border: "none",
              borderRadius: 12,
              height: 52,
              width: "100%",
              fontFamily: fonts.ui,
              fontSize: 16,
              fontWeight: 600,
              color: isSubmitting ? c.warmGray : c.cream,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: isSubmitting ? "none" : shadow.button,
              marginTop: 4,
            }}
          >
            {isSubmitting ? "Signing In..." : "Log In"}
          </button>

          {errorMessage && (
            <p
              style={{
                margin: "2px 0 0",
                fontFamily: fonts.ui,
                fontSize: 12,
                color: c.baseRed,
                textAlign: "center",
              }}
            >
              {errorMessage}
            </p>
          )}

          {/* Register link */}
          <div style={{ textAlign: "center", marginTop: 10 }}>
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
