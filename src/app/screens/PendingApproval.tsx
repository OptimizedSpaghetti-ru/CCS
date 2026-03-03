import { useNavigate } from "react-router";
import { ShieldCheck, LogOut } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { useApp } from "../context/AppContext";

export function PendingApproval() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useApp();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

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
          Hi {currentUser.name || "there"}, your account was created
          successfully but is not active yet. An administrator needs to approve
          your access.
        </p>
        <p
          style={{
            fontFamily: fonts.mono,
            fontSize: 12,
            margin: "0 0 18px",
            color: c.warmGray,
          }}
        >
          {currentUser.email}
        </p>

        <button
          onClick={handleSignOut}
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
          Sign Out
        </button>
      </div>
    </div>
  );
}
