import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ShieldCheck, LogOut, Mail, Clock, Loader } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { useApp } from "../context/AppContext";

export function PendingApproval() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    signOut,
    isAuthenticated,
    refreshProfile,
    resolvedThemeMode,
    isNewSignUp,
  } = useApp();
  const isDark = resolvedThemeMode === "dark";

  // Support both authenticated users and post-registration redirect (via route state)
  const routeState = (location.state ?? {}) as {
    email?: string;
    name?: string;
  };
  const displayName = currentUser?.name || routeState.name || "there";
  const displayEmail = currentUser?.email || routeState.email || "";

  useEffect(() => {
    if (!isAuthenticated) return;

    if (currentUser.status === "approved") {
      navigate("/app/home", { replace: true });
      return;
    }

    // For existing accounts (not newly signed up), check status more frequently
    const intervalId = window.setInterval(
      () => {
        refreshProfile();
      },
      isNewSignUp ? 5000 : 2000,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    currentUser.status,
    isAuthenticated,
    navigate,
    refreshProfile,
    isNewSignUp,
  ]);

  const handleAction = async () => {
    if (isAuthenticated) {
      await signOut();
    }
    navigate("/login", { replace: true });
  };

  // Show loading screen for existing accounts checking approval status
  if (!isNewSignUp) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: c.creamLight,
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Loader
            size={48}
            color={c.baseRed}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 14,
              color: c.darkBrown,
              margin: 0,
              textAlign: "center",
            }}
          >
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  // Show pending approval screen for newly created accounts
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: c.creamLight,
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: c.white,
          borderRadius: 18,
          padding: 22,
          boxShadow: shadow.card,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: `${c.baseRed}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <ShieldCheck size={24} color={c.baseRed} />
        </div>

        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 24,
            margin: "0 0 8px",
            color: c.darkBrown,
          }}
        >
          Account Pending Approval
        </h1>
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 14,
            margin: "0 0 14px",
            color: c.warmGray,
            lineHeight: 1.5,
          }}
        >
          Hi {displayName}, your account was created successfully but is not
          active yet. An administrator needs to review and approve your access
          before you can log in.
        </p>

        {displayEmail && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isDark ? "#2A141A" : c.cream,
              border: `1px solid ${
                isDark ? "rgba(255, 232, 217, 0.35)" : "rgba(139,115,85,0.25)"
              }`,
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 14,
            }}
          >
            <Mail
              size={14}
              color={isDark ? "rgba(255, 232, 217, 0.78)" : c.warmGray}
            />
            <p
              style={{
                fontFamily: fonts.mono,
                fontSize: 12,
                margin: 0,
                color: c.darkBrown,
              }}
            >
              {displayEmail}
            </p>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#FEF3C7",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 18,
          }}
        >
          <Clock size={14} color="#D97706" />
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 12,
              margin: 0,
              color: "#92400E",
              lineHeight: 1.4,
            }}
          >
            You will be notified once your account has been approved. Please
            check back later.
          </p>
        </div>

        <button
          onClick={handleAction}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 12,
            padding: "12px 14px",
            background: g.button,
            color: c.cream,
            fontFamily: fonts.ui,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <LogOut size={16} />
          {isAuthenticated ? "Sign Out" : "Back to Login"}
        </button>
      </div>
    </div>
  );
}
