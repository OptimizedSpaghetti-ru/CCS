import { LoaderCircle } from "lucide-react";
import { c, fonts, shadow } from "../theme";

interface AppLoadingStateProps {
  message: string;
  detail?: string;
  isDark?: boolean;
  skeletonCount?: number;
}

export function AppLoadingState({
  message,
  detail,
  isDark = false,
  skeletonCount = 3,
}: AppLoadingStateProps) {
  const skeletonBg = isDark ? "rgba(255,232,217,0.09)" : "rgba(139,115,85,0.1)";
  const skeletonAccent = isDark ? "rgba(255,232,217,0.14)" : "rgba(139,115,85,0.16)";

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      style={{
        padding: "44px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
      }}
    >
      <LoaderCircle
        size={28}
        color={c.baseRed}
        style={{ animation: "ccs-spin 0.9s linear infinite" }}
      />
      <div style={{ textAlign: "center" }}>
        <h3
          style={{
            fontFamily: fonts.display,
            fontSize: 18,
            color: c.darkBrown,
            margin: "0 0 6px",
          }}
        >
          {message}
        </h3>
        {detail && (
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.warmGray,
              margin: 0,
            }}
          >
            {detail}
          </p>
        )}
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 4,
        }}
      >
        {Array.from({ length: skeletonCount }, (_, item) => (
          <div
            key={item}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 14px",
              background: isDark ? "#1F0F14" : c.white,
              border: `1px solid ${isDark ? "rgba(255,232,217,0.1)" : "rgba(139,115,85,0.08)"}`,
              borderRadius: 12,
              boxShadow: isDark ? "none" : shadow.soft,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: skeletonAccent,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <div
                style={{
                  width: item === 1 ? "58%" : "72%",
                  height: 12,
                  borderRadius: 999,
                  background: skeletonAccent,
                  marginBottom: 9,
                }}
              />
              <div
                style={{
                  width: "92%",
                  height: 10,
                  borderRadius: 999,
                  background: skeletonBg,
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  width: 72,
                  height: 10,
                  borderRadius: 999,
                  background: skeletonBg,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
