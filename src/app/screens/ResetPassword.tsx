import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

export function ResetPassword() {
  const navigate = useNavigate();
  const { resolvedThemeMode } = useApp();
  const isDark = resolvedThemeMode === "dark";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const fieldSurface = isDark ? "#2A141A" : c.white;
  const fieldBorder = isDark ? "rgba(255, 232, 217, 0.35)" : `${c.warmGray}40`;
  const fieldText = c.darkBrown;
  const labelColor = c.darkBrown;
  const iconColor = c.warmGray;
  const placeholderColor = isDark
    ? "rgba(255, 232, 217, 0.7)"
    : "rgba(45, 27, 14, 0.55)";

  // Password validation checks (matching existing system rules)
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  const strengthScore = Object.values(checks).filter(Boolean).length;
  const isPasswordValid = strengthScore === 4;

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      try {
        // 1. Check if session is already established
        const { data: existingSessionData } = await supabase.auth.getSession();
        if (existingSessionData.session) {
          if (mounted) {
            setIsSessionValid(true);
            setIsVerifying(false);
          }
          return;
        }

        // 2. Check query params (e.g. ?code=... for PKCE or ?token_hash=... for OTP)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const tokenHash = urlParams.get("token_hash");
        const type = urlParams.get("type");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session) {
            if (mounted) {
              setIsSessionValid(true);
              setIsVerifying(false);
            }
            return;
          }
        }

        if (tokenHash && (type === "recovery" || !type)) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (!error && data.session) {
            if (mounted) {
              setIsSessionValid(true);
              setIsVerifying(false);
            }
            return;
          }
        }

        // 3. Check hash params (e.g. #access_token=...&refresh_token=...&type=recovery)
        const rawHash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(rawHash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || "";

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data.session) {
            if (mounted) {
              setIsSessionValid(true);
              setIsVerifying(false);
            }
            return;
          }
        }

        // 4. Listen for auth state change (e.g. PASSWORD_RECOVERY or SIGNED_IN event)
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return;
            if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
              setIsSessionValid(true);
              setIsVerifying(false);
            }
          },
        );

        // Fallback timer: wait up to 1.8 seconds for async auth initialization
        const timer = setTimeout(async () => {
          if (!mounted) return;
          const { data: finalCheck } = await supabase.auth.getSession();
          if (finalCheck.session) {
            setIsSessionValid(true);
          } else {
            setIsSessionValid(false);
          }
          setIsVerifying(false);
        }, 1800);

        return () => {
          authListener.subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err) {
        console.warn("[ResetPassword] Recovery session check error:", err);
        if (mounted) {
          setIsSessionValid(false);
          setIsVerifying(false);
        }
      }
    };

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleResetPassword = async () => {
    setErrorMessage("");

    if (!password || !confirmPassword) {
      setErrorMessage("Please fill in all password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
      );
      return;
    }

    setIsSubmitting(true);

    // Double-check session is active before updating password
    const { data: sessionCheck } = await supabase.auth.getSession();
    if (!sessionCheck.session) {
      // Attempt recovery from hash params if still present
      const rawHash = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(rawHash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || "";

      if (accessToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setIsSubmitting(false);
      const lowerErr = error.message.toLowerCase();
      if (lowerErr.includes("session missing") || lowerErr.includes("not authenticated")) {
        setErrorMessage(
          "Your reset session has expired or is invalid. Please request a new password reset link from the login page.",
        );
      } else {
        setErrorMessage(error.message || "Failed to update password. Link may have expired.");
      }
      return;
    }

    // Invalidate recovery session so reset link cannot be reused
    await supabase.auth.signOut();
    setIsSubmitting(false);
    setIsSuccess(true);
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
            onClick={() => navigate("/login")}
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
            <ArrowLeft size={18} color={c.cream} />
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
            Reset Password
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

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
        {isVerifying ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 0",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `3px solid ${c.baseRed}30`,
                borderTopColor: c.baseRed,
                animation: "ccs-spin 0.8s linear infinite",
              }}
            />
            <p style={{ fontFamily: fonts.ui, fontSize: 14, color: c.warmGray }}>
              Verifying reset link...
            </p>
          </div>
        ) : isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "24px 0",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(22, 163, 74, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16A34A",
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2
              style={{
                fontFamily: fonts.display,
                fontSize: 22,
                fontWeight: 700,
                color: c.darkBrown,
                margin: 0,
              }}
            >
              Password Reset Complete!
            </h2>

            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 14,
                color: c.warmGray,
                margin: 0,
                maxWidth: 280,
                lineHeight: 1.5,
              }}
            >
              Your password has been securely updated. You can now log in using
              your new password.
            </p>

            <button
              onClick={() => navigate("/login", { replace: true })}
              style={{
                background: g.button,
                border: "none",
                borderRadius: 12,
                height: 50,
                width: "100%",
                fontFamily: fonts.ui,
                fontSize: 16,
                fontWeight: 600,
                color: c.cream,
                cursor: "pointer",
                boxShadow: shadow.button,
                marginTop: 12,
              }}
            >
              Log In With New Password
            </button>
          </motion.div>
        ) : !isSessionValid ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "20px 0",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(220, 38, 38, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.baseRed,
              }}
            >
              <AlertCircle size={32} />
            </div>

            <h2
              style={{
                fontFamily: fonts.display,
                fontSize: 20,
                fontWeight: 700,
                color: c.darkBrown,
                margin: 0,
              }}
            >
              Link Expired or Invalid
            </h2>

            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 14,
                color: c.warmGray,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              This password reset link has expired or has already been used.
              Please request a new password reset link.
            </p>

            <button
              onClick={() => navigate("/login")}
              style={{
                background: g.button,
                border: "none",
                borderRadius: 12,
                height: 48,
                width: "100%",
                fontFamily: fonts.ui,
                fontSize: 15,
                fontWeight: 600,
                color: c.cream,
                cursor: "pointer",
                boxShadow: shadow.button,
                marginTop: 8,
              }}
            >
              Return to Login
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 14,
                color: c.warmGray,
                margin: "0 0 4px",
                lineHeight: 1.4,
              }}
            >
              Enter a strong new password for your account.
            </p>

            {/* New Password */}
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
                New Password
              </label>
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
                <Lock size={18} color={iconColor} />
                <input
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    color: fieldText,
                    caretColor: fieldText,
                    minWidth: 0,
                    ["--auth-placeholder-color" as string]: placeholderColor,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: iconColor,
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Requirement Badges */}
            <div
              style={{
                background: isDark ? "rgba(255,232,217,0.06)" : `${c.warmGray}12`,
                borderRadius: 8,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: checks.minLength ? "#16A34A" : c.warmGray,
                }}
              >
                <span>{checks.minLength ? "✓" : "○"}</span>
                <span>At least 8 characters</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color:
                    checks.uppercase && checks.lowercase
                      ? "#16A34A"
                      : c.warmGray,
                }}
              >
                <span>{checks.uppercase && checks.lowercase ? "✓" : "○"}</span>
                <span>Uppercase & lowercase letters</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: checks.number ? "#16A34A" : c.warmGray,
                }}
              >
                <span>{checks.number ? "✓" : "○"}</span>
                <span>At least one number</span>
              </div>
            </div>

            {/* Confirm Password */}
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
                Confirm New Password
              </label>
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
                <Lock size={18} color={iconColor} />
                <input
                  className="auth-input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    color: fieldText,
                    caretColor: fieldText,
                    minWidth: 0,
                    ["--auth-placeholder-color" as string]: placeholderColor,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: iconColor,
                  }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: fonts.ui,
                  fontSize: 13,
                  color: c.baseRed,
                  textAlign: "center",
                }}
              >
                {errorMessage}
              </p>
            )}

            <button
              onClick={handleResetPassword}
              disabled={isSubmitting || !isPasswordValid || !confirmPassword}
              style={{
                background:
                  isSubmitting || !isPasswordValid || !confirmPassword
                    ? `${c.warmGray}40`
                    : g.button,
                border: "none",
                borderRadius: 12,
                height: 52,
                width: "100%",
                fontFamily: fonts.ui,
                fontSize: 16,
                fontWeight: 600,
                color:
                  isSubmitting || !isPasswordValid || !confirmPassword
                    ? c.warmGray
                    : c.cream,
                cursor:
                  isSubmitting || !isPasswordValid || !confirmPassword
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  isSubmitting || !isPasswordValid || !confirmPassword
                    ? "none"
                    : shadow.button,
                marginTop: 8,
              }}
            >
              {isSubmitting ? "Updating Password..." : "Save New Password"}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
