import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, Eye, EyeOff, X, CheckCircle2 } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import type { ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../../lib/supabase";

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

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleForgotPasswordSubmit = async () => {
    setForgotError("");
    setForgotMessage("");

    const emailTrimmed = forgotEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    if (cooldown > 0) {
      setForgotError(`Please wait ${cooldown}s before sending another request.`);
      return;
    }

    setForgotSubmitting(true);
    try {
      const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL;
      let appOrigin = window.location.origin;

      if (import.meta.env.DEV) {
        // In local development, always redirect to local dev server so local testing works
        appOrigin = window.location.origin;
      } else if (configuredUrl && configuredUrl.trim() !== "") {
        appOrigin = configuredUrl.trim();
      }

      // Ensure no trailing slashes or doubled /reset-password
      appOrigin = appOrigin.replace(/\/reset-password\/?$/i, "").replace(/\/$/, "");
      const redirectTo = `${appOrigin}/reset-password`;

      await supabase.auth.resetPasswordForEmail(emailTrimmed, {
        redirectTo,
      });

      // Always show generic message to avoid leaking user existence
      setForgotMessage(
        "If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.",
      );
      setCooldown(60);
    } catch {
      setForgotMessage(
        "If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.",
      );
    } finally {
      setForgotSubmitting(false);
    }
  };
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
          {/* Email */}
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
              Email
            </label>
            <InputField
              icon={<Mail size={18} />}
              placeholder="Enter your email"
              type="email"
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
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotError("");
                setForgotMessage("");
                setForgotEmail(email);
              }}
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

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              background: "rgba(62, 7, 3, 0.45)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowForgotModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 400,
                background: isDark ? "#1F0F14" : c.white,
                borderRadius: 16,
                padding: "24px 20px",
                boxShadow: shadow.toast,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                border: `1px solid ${isDark ? "rgba(255,232,217,0.14)" : "rgba(139,115,85,0.14)"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: fonts.display,
                      fontSize: 20,
                      fontWeight: 700,
                      color: c.darkBrown,
                    }}
                  >
                    Reset Password
                  </h3>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      color: c.warmGray,
                    }}
                  >
                    Enter your email to receive reset instructions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: c.warmGray,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {forgotMessage ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "center",
                    padding: "8px 0",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "rgba(22, 163, 74, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#16A34A",
                    }}
                  >
                    <CheckCircle2 size={28} />
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: c.darkBrown,
                    }}
                  >
                    {forgotMessage}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      width: "100%",
                      marginTop: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleForgotPasswordSubmit}
                      disabled={cooldown > 0 || forgotSubmitting}
                      style={{
                        background: "none",
                        border: `1.5px solid ${c.warmGray}40`,
                        borderRadius: 10,
                        height: 44,
                        fontFamily: fonts.ui,
                        fontSize: 13,
                        fontWeight: 600,
                        color: cooldown > 0 ? c.warmGray : c.darkBrown,
                        cursor: cooldown > 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      {cooldown > 0
                        ? `Resend available in ${cooldown}s`
                        : "Resend Reset Link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      style={{
                        background: g.button,
                        border: "none",
                        borderRadius: 10,
                        height: 44,
                        fontFamily: fonts.ui,
                        fontSize: 14,
                        fontWeight: 600,
                        color: c.cream,
                        cursor: "pointer",
                        boxShadow: shadow.button,
                      }}
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        fontWeight: 600,
                        color: labelColor,
                        display: "block",
                        marginBottom: 5,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Email Address
                    </label>
                    <InputField
                      icon={<Mail size={18} />}
                      placeholder="e.g. yourname@student.fatima.edu.ph"
                      type="email"
                      value={forgotEmail}
                      onChange={setForgotEmail}
                      fieldSurface={fieldSurface}
                      fieldBorder={fieldBorder}
                      textColor={fieldText}
                      iconColor={iconColor}
                      placeholderColor={placeholderColor}
                    />
                  </div>

                  {forgotError && (
                    <p
                      style={{
                        margin: 0,
                        fontFamily: fonts.ui,
                        fontSize: 12,
                        color: c.baseRed,
                      }}
                    >
                      {forgotError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleForgotPasswordSubmit}
                    disabled={forgotSubmitting}
                    style={{
                      background: forgotSubmitting ? `${c.warmGray}40` : g.button,
                      border: "none",
                      borderRadius: 12,
                      height: 48,
                      width: "100%",
                      fontFamily: fonts.ui,
                      fontSize: 15,
                      fontWeight: 600,
                      color: forgotSubmitting ? c.warmGray : c.cream,
                      cursor: forgotSubmitting ? "not-allowed" : "pointer",
                      boxShadow: forgotSubmitting ? "none" : shadow.button,
                      marginTop: 4,
                    }}
                  >
                    {forgotSubmitting ? "Sending Link..." : "Send Reset Link"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
