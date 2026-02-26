import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { c, g, fonts } from "../theme";

const SCHOOL_LOGO_SRC = "/branding/school-logo.png";

function OLFULogo() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      <circle
        cx="48"
        cy="48"
        r="46"
        stroke="#FFF0C4"
        strokeWidth="2"
        opacity={0.4}
      />
      <circle
        cx="48"
        cy="48"
        r="38"
        fill="rgba(255,240,196,0.08)"
        stroke="#FFF0C4"
        strokeWidth="1.5"
        opacity={0.6}
      />
      <circle cx="48" cy="48" r="28" fill="rgba(255,240,196,0.12)" />
      {/* Cross */}
      <rect
        x="45.5"
        y="22"
        width="5"
        height="52"
        rx="2.5"
        fill="#FFF0C4"
        opacity={0.9}
      />
      <rect
        x="26"
        y="42"
        width="44"
        height="5"
        rx="2.5"
        fill="#FFF0C4"
        opacity={0.9}
      />
      {/* Decorative dots */}
      <circle cx="48" cy="48" r="4" fill="#FFF0C4" />
      <circle cx="33" cy="33" r="2" fill="#FFF0C4" opacity={0.5} />
      <circle cx="63" cy="33" r="2" fill="#FFF0C4" opacity={0.5} />
      <circle cx="33" cy="63" r="2" fill="#FFF0C4" opacity={0.5} />
      <circle cx="63" cy="63" r="2" fill="#FFF0C4" opacity={0.5} />
    </svg>
  );
}

function CenterLogo() {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <OLFULogo />;
  }

  return (
    <img
      src={SCHOOL_LOGO_SRC}
      alt="School logo"
      onError={() => setUseFallback(true)}
      style={{
        width: 96,
        height: 96,
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

export function Splash() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        flex: 1,
        background: g.splash,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "60px 28px 48px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Diagonal texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
          135deg,
          transparent,
          transparent 40px,
          rgba(255,240,196,0.04) 40px,
          rgba(255,240,196,0.04) 42px
        )`,
          pointerEvents: "none",
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(140,16,7,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top badges */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{ display: "flex", gap: 8, alignItems: "center" }}
      >
        <div
          style={{
            background: "rgba(255,240,196,0.15)",
            border: "1px solid rgba(255,240,196,0.25)",
            borderRadius: 20,
            padding: "4px 12px",
          }}
        >
          <span
            style={{
              fontFamily: fonts.ui,
              fontSize: 11,
              color: c.cream,
              letterSpacing: 0.5,
            }}
          >
            OLFU — CCS
          </span>
        </div>
        <div
          style={{
            background: "rgba(255,240,196,0.15)",
            border: "1px solid rgba(255,240,196,0.25)",
            borderRadius: 20,
            padding: "4px 12px",
          }}
        >
          <span
            style={{
              fontFamily: fonts.ui,
              fontSize: 11,
              color: c.cream,
              letterSpacing: 0.5,
            }}
          >
            Valenzuela Campus
          </span>
        </div>
      </motion.div>

      {/* Logo + Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            background: "rgba(255,240,196,0.10)",
            borderRadius: "50%",
            padding: 20,
            boxShadow:
              "0 0 60px rgba(255,240,196,0.15), inset 0 0 30px rgba(255,240,196,0.05)",
          }}
        >
          <CenterLogo />
        </div>

        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 38,
              fontWeight: 900,
              color: c.cream,
              margin: 0,
              letterSpacing: "-0.5px",
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
              lineHeight: 1.1,
            }}
          >
            CCS Connect
          </h1>
          <div
            style={{
              width: 60,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${c.cream}, transparent)`,
              margin: "10px auto",
              opacity: 0.5,
            }}
          />
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{ textAlign: "center" }}
      >
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 15,
            color: c.warmGrayLight,
            margin: 0,
            fontStyle: "italic",
            letterSpacing: 0.3,
          }}
        >
          "Your campus. Connected."
        </p>
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 12,
            color: `${c.warmGrayLight}80`,
            margin: "6px 0 0",
          }}
        >
          Academic Inquiries · Communication · Navigation
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "linear-gradient(135deg, #660B05 0%, #8C1007 100%)",
            border: "none",
            borderRadius: 12,
            height: 52,
            width: "100%",
            fontFamily: fonts.ui,
            fontSize: 16,
            fontWeight: 600,
            color: c.cream,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            letterSpacing: "0.2px",
          }}
        >
          Log In
        </button>
        <button
          onClick={() => navigate("/register")}
          style={{
            background: "transparent",
            border: `2px solid rgba(255,240,196,0.4)`,
            borderRadius: 12,
            height: 52,
            width: "100%",
            fontFamily: fonts.ui,
            fontSize: 16,
            fontWeight: 600,
            color: c.cream,
            cursor: "pointer",
            letterSpacing: "0.2px",
          }}
        >
          Register
        </button>

        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            color: `${c.warmGrayLight}60`,
            textAlign: "center",
            margin: "4px 0 0",
          }}
        >
          Our Lady of Fatima University · CCS Department
        </p>
      </motion.div>
    </div>
  );
}
