import { X, Megaphone } from "lucide-react";
import { c, fonts, shadow } from "../theme";

export interface AnnouncementDetail {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  authorName?: string;
  authorRole?: string;
  createdAt?: string;
  category?: string;
}

interface AnnouncementDetailSheetProps {
  announcement: AnnouncementDetail | null;
  isDark: boolean;
  onClose: () => void;
}

function formatPostedAt(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AnnouncementDetailSheet({
  announcement,
  isDark,
  onClose,
}: AnnouncementDetailSheetProps) {
  if (!announcement) return null;

  const postedAt = formatPostedAt(announcement.createdAt);
  const authorMeta = [
    announcement.authorName,
    announcement.authorRole ? `(${announcement.authorRole})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="announcement-sheet-overlay"
      role="presentation"
      onClick={onClose}
      style={{
        background: isDark ? "rgba(0,0,0,0.72)" : "rgba(62,7,3,0.38)",
      }}
    >
      <section
        className="announcement-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`announcement-${announcement.id}-title`}
        onClick={(event) => event.stopPropagation()}
        style={{
          background: isDark ? "#1F0F14" : c.white,
          borderColor: isDark
            ? "rgba(255,232,217,0.14)"
            : "rgba(139,115,85,0.14)",
          boxShadow: shadow.toast,
        }}
      >
        <div
          style={{
            width: 42,
            height: 4,
            borderRadius: 999,
            background: isDark
              ? "rgba(255,232,217,0.24)"
              : "rgba(139,115,85,0.24)",
            margin: "0 auto 14px",
          }}
        />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: isDark ? "rgba(255,240,196,0.1)" : `${c.baseRed}14`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Megaphone size={20} color={c.baseRed} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {announcement.category && (
              <span
                style={{
                  display: "inline-flex",
                  marginBottom: 6,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: isDark
                    ? "rgba(255,240,196,0.1)"
                    : "rgba(140,16,7,0.1)",
                  color: c.baseRed,
                  fontFamily: fonts.ui,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {announcement.category}
              </span>
            )}
            <h2
              id={`announcement-${announcement.id}-title`}
              style={{
                margin: 0,
                fontFamily: fonts.display,
                fontSize: 22,
                lineHeight: 1.2,
                color: c.darkBrown,
              }}
            >
              {announcement.title || "Announcement"}
            </h2>
            {(authorMeta || postedAt) && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  lineHeight: 1.4,
                }}
              >
                {authorMeta || "CCS Connect"}
                {postedAt ? ` | ${postedAt}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            className="hover-press"
            onClick={onClose}
            aria-label="Close announcement"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: isDark
                ? "rgba(255,232,217,0.1)"
                : "rgba(139,115,85,0.1)",
              color: c.darkBrown,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {announcement.imageUrl && (
          <div
            style={{
              marginTop: 16,
              borderRadius: 14,
              overflow: "hidden",
              border: `1px solid ${isDark ? "rgba(255,232,217,0.16)" : "rgba(139,115,85,0.16)"}`,
              background: isDark ? "#12090B" : c.creamLight,
            }}
          >
            <img
              src={announcement.imageUrl}
              alt="announcement"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "62dvh",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        )}

        <p
          style={{
            margin: "16px 0 0",
            fontFamily: fonts.ui,
            fontSize: 14,
            lineHeight: 1.65,
            color: c.darkBrown,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {announcement.body || "No additional details were provided."}
        </p>
      </section>
    </div>
  );
}
