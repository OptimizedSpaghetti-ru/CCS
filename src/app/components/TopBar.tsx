import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { c, g, fonts } from "../theme";
import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  variant?: "dark" | "light" | "transparent";
  showBack?: boolean;
  backPath?: string;
  rightContent?: ReactNode;
  centerContent?: ReactNode;
}

export function TopBar({
  title,
  subtitle,
  variant = "dark",
  showBack = false,
  backPath,
  rightContent,
  centerContent,
}: TopBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) navigate(backPath);
    else navigate(-1);
  };

  const isDark = variant === "dark";
  const isLight = variant === "light";

  return (
    <div
      style={{
        background: isDark ? g.header : isLight ? c.white : "transparent",
        padding: "12px 16px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        borderBottom: isLight ? `1px solid rgba(139,115,85,0.12)` : "none",
        zIndex: 10,
      }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          style={{
            background: isDark ? "rgba(255,240,196,0.15)" : "rgba(62,7,3,0.06)",
            border: "none",
            borderRadius: 8,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ArrowLeft
            size={18}
            color={isDark ? c.cream : c.darkBrown}
            strokeWidth={2}
          />
        </button>
      )}
      {centerContent ? (
        <div style={{ flex: 1 }}>{centerContent}</div>
      ) : (
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 20,
              fontWeight: 700,
              color: isDark ? c.cream : c.darkBrown,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                color: isDark ? c.warmGrayLight : c.warmGray,
                margin: 0,
                marginTop: 1,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      {rightContent && <div style={{ flexShrink: 0 }}>{rightContent}</div>}
    </div>
  );
}
