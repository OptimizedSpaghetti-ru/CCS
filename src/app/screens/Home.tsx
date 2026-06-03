import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  MessageSquare,
  Map as MapShortcutIcon,
  BarChart3,
  ChevronRight,
  Megaphone,
  Wrench,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";
import {
  AnnouncementDetailSheet,
  type AnnouncementDetail,
} from "../components/AnnouncementDetailSheet";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

type HomeAnnouncement = AnnouncementDetail & {
  time: string;
  accentType: "urgent" | "warning" | "info";
};

/* ─────────────────────────────────────────────────────────────
   Small helpers
───────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

function formatRole(role: unknown): string {
  if (typeof role !== "string" || !role) return "";
  if (role === "it_support") return "IT Support";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/* ─────────────────────────────────────────────────────────────
   QuickAction button
───────────────────────────────────────────────────────────── */

function QuickAction({
  icon,
  label,
  path,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  path: string;
  color: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      className="hover-lift"
      onClick={() => navigate(path)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: c.white,
        borderRadius: 14,
        padding: "16px 8px",
        border: "none",
        cursor: "pointer",
        boxShadow: shadow.card,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <span
        style={{
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 600,
          color: c.darkBrown,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Core fetch — completely self-contained, no filters except RLS
───────────────────────────────────────────────────────────── */

async function fetchHomeAnnouncements(): Promise<HomeAnnouncement[]> {
  // Step 1 — try the dedicated announcements table first
  const { data: annData, error: annErr } = await supabase
    .from("announcements")
    .select(
      "id, title, body, image_url, created_by, created_by_role, category, created_at",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (annErr) {
    // Log the real error so it appears in DevTools
    console.error("[Home:announcements] fetch error →", {
      code: annErr.code,
      message: annErr.message,
      details: (annErr as any).details,
      hint: (annErr as any).hint,
    });

    // Step 2 — fall back to the notifications table (legacy announcements)
    const { data: notifData, error: notifErr } = await supabase
      .from("notifications")
      .select(
        "id, title, body, image_url, created_by, type, created_at",
      )
      .in("type", ["announcement", "event"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (notifErr) {
      console.error("[Home:notifications-fallback] fetch error →", {
        code: notifErr.code,
        message: notifErr.message,
      });
      // Throw so the caller can set the error state
      throw new Error(notifErr.message || "Unable to load announcements.");
    }

    const rows = notifData ?? [];
    return buildAnnouncementItems(rows, "notifications");
  }

  const rows = annData ?? [];
  return buildAnnouncementItems(rows, "announcements");
}

/** Fetch author display names for a list of user IDs */
async function fetchAuthorMap(
  ids: string[],
): Promise<
  globalThis.Map<string, { full_name: string | null; role: string | null }>
> {
  if (ids.length === 0) return new globalThis.Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", ids);

  return new globalThis.Map(
    (data ?? []).map((p: any) => [
      p.id,
      { full_name: p.full_name ?? null, role: p.role ?? null },
    ]),
  );
}

/** Map raw DB rows → HomeAnnouncement array */
async function buildAnnouncementItems(
  rows: any[],
  source: "announcements" | "notifications",
): Promise<HomeAnnouncement[]> {
  if (rows.length === 0) return [];

  // Collect unique author IDs
  const authorIds = [
    ...new Set(
      rows
        .map((r) => r.created_by)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const authorMap = await fetchAuthorMap(authorIds);

  return rows.slice(0, 5).map((r): HomeAnnouncement => {
    const author = r.created_by ? authorMap.get(r.created_by) : undefined;

    const category: string =
      r.category ||
      (source === "notifications" && r.type === "event" ? "Event" : "Announcement");

    const accentType: "urgent" | "warning" | "info" =
      category === "Event" ? "warning" : "urgent";

    return {
      id: r.id,
      title: r.title ?? "",
      body: r.body ?? "",
      time: timeAgo(r.created_at),
      createdAt: r.created_at,
      imageUrl: r.image_url ?? undefined,
      authorName: author?.full_name?.trim() || "CCS Connect",
      authorRole: formatRole(author?.role ?? r.created_by_role ?? ""),
      category,
      accentType,
    };
  });
}

/* ─────────────────────────────────────────────────────────────
   Home screen
───────────────────────────────────────────────────────────── */

export function Home() {
  const { currentUser, resolvedThemeMode } = useApp();
  const isDark = resolvedThemeMode === "dark";
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState<HomeAnnouncement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementDetail | null>(null);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");

  // Keep a ref to the latest userId so we don't re-run on stale IDs
  const fetchedForUser = useRef<string>("");

  useEffect(() => {
    // Don't fetch until we have a real, non-empty user ID
    // (the auth context starts with an empty FALLBACK_USER)
    if (!currentUser.id) return;

    // Avoid duplicate fetches for the same user
    if (fetchedForUser.current === currentUser.id) return;
    fetchedForUser.current = currentUser.id;

    let alive = true;

    setAnnouncementsLoading(true);
    setAnnouncementsError("");

    fetchHomeAnnouncements()
      .then((items) => {
        if (!alive) return;
        setAnnouncements(items);
        setAnnouncementsError("");
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const msg =
          err instanceof Error
            ? err.message
            : typeof (err as any)?.message === "string"
              ? (err as any).message
              : "Unable to load announcements right now.";
        console.error("[Home] announcements failed →", err);
        setAnnouncements([]);
        setAnnouncementsError(msg);
      })
      .finally(() => {
        if (alive) setAnnouncementsLoading(false);
      });

    return () => {
      alive = false;
    };
  // Re-fetch if the signed-in user changes (e.g. after login/logout)
  }, [currentUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ flex: 1, overflowY: "auto", background: c.creamLight }}>
      {/* ── Hero Header ── */}
      <div
        style={{
          background: g.header,
          padding: "0 20px 28px",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,240,196,0.06)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255,240,196,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                color: c.warmGrayLight,
                margin: "0 0 4px",
              }}
            >
              {getGreeting()}
            </p>
            <h1
              style={{
                fontFamily: fonts.display,
                fontSize: 22,
                fontWeight: 700,
                color: c.cream,
                margin: "0 0 2px",
              }}
            >
              {currentUser.name.split(" ")[0]}
            </h1>
            <p
              style={{
                fontFamily: fonts.mono,
                fontSize: 11,
                color: `${c.warmGrayLight}90`,
                margin: 0,
              }}
            >
              {currentUser.role === "admin"
                ? "Administrator"
                : currentUser.role === "it_support"
                  ? "IT Support"
                  : currentUser.role === "faculty"
                    ? "Faculty"
                    : currentUser.identifier}
            </p>
          </div>
          <button
            className="hover-press"
            onClick={() => navigate("/app/profile")}
            aria-label="Open profile"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,240,196,0.15)",
              border: `2px solid ${c.cream}50`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              overflow: "hidden",
            }}
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontFamily: fonts.display,
                  fontSize: 16,
                  fontWeight: 700,
                  color: c.cream,
                }}
              >
                {currentUser.initials}
              </span>
            )}
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 12,
              fontWeight: 600,
              color: c.warmGray,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              margin: "0 0 10px",
            }}
          >
            Quick Actions
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <QuickAction
              icon={<MessageSquare size={20} />}
              label="Message"
              path="/app/messages"
              color={c.baseRed}
            />
            <QuickAction
              icon={<MapShortcutIcon size={20} />}
              label="Navigate"
              path="/app/map"
              color="#1D4ED8"
            />
            {currentUser.role === "admin" && (
              <QuickAction
                icon={<BarChart3 size={20} />}
                label="Analytics"
                path="/app/admin/analytics"
                color="#8C1007"
              />
            )}
            {currentUser.role !== "it_support" && (
              <QuickAction
                icon={<Wrench size={20} />}
                label="Assist"
                path="/app/assistance"
                color="#8C1007"
              />
            )}
            {currentUser.role === "it_support" && (
              <QuickAction
                icon={<Wrench size={20} />}
                label="Support"
                path="/app/it-support"
                color="#8C1007"
              />
            )}
            {currentUser.role === "faculty" && (
              <QuickAction
                icon={<Megaphone size={20} />}
                label="Announce"
                path="/app/faculty/announcements"
                color="#D97706"
              />
            )}
          </div>
        </motion.div>

        {/* ── Announcements ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: c.warmGray,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                margin: 0,
              }}
            >
              Announcements
            </p>
            <button
              className="hover-press"
              onClick={() => navigate("/app/notifications")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: c.baseRed,
              }}
            >
              <span style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 500 }}>
                See all
              </span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {announcementsLoading ? (
              /* Loading skeleton */
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  textAlign: "center",
                  padding: 20,
                  margin: 0,
                }}
              >
                Loading announcements…
              </p>
            ) : announcementsError ? (
              /* Error state — real message in console, friendly text here */
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  textAlign: "center",
                  padding: 20,
                  margin: 0,
                }}
              >
                Unable to load announcements right now.
              </p>
            ) : announcements.length === 0 ? (
              /* Genuinely empty */
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  textAlign: "center",
                  padding: 20,
                  margin: 0,
                }}
              >
                No announcements yet
              </p>
            ) : (
              /* Cards */
              announcements.map((ann) => {
                const accent =
                  ann.accentType === "warning" ? "#D97706" : c.baseRed;
                return (
                  <button
                    className="hover-lift"
                    key={ann.id}
                    type="button"
                    onClick={() => setSelectedAnnouncement(ann)}
                    style={{
                      width: "100%",
                      background: c.white,
                      borderRadius: 12,
                      padding: "12px 14px",
                      boxShadow: shadow.card,
                      border: "none",
                      borderLeft: `3px solid ${accent}`,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <Megaphone
                        size={16}
                        color={accent}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontFamily: fonts.ui,
                            fontSize: 13,
                            fontWeight: 600,
                            color: c.darkBrown,
                            margin: 0,
                          }}
                        >
                          {ann.title}
                        </p>
                        <p
                          style={{
                            fontFamily: fonts.ui,
                            fontSize: 12,
                            color: c.warmGray,
                            margin: "3px 0 0",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {ann.body}
                        </p>
                        {ann.imageUrl && (
                          <img
                            src={ann.imageUrl}
                            alt="announcement pubmat"
                            style={{
                              width: "100%",
                              maxHeight: 180,
                              objectFit: "cover",
                              borderRadius: 10,
                              marginTop: 8,
                              border: "1px solid rgba(139,115,85,0.18)",
                            }}
                          />
                        )}
                        <p
                          style={{
                            fontFamily: fonts.mono,
                            fontSize: 10,
                            color: c.warmGrayLight,
                            margin: "4px 0 0",
                          }}
                        >
                          {ann.time}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>

        <div style={{ height: 8 }} />
      </div>

      {/* ── Detail sheet ── */}
      <AnnouncementDetailSheet
        announcement={selectedAnnouncement}
        isDark={isDark}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </div>
  );
}
