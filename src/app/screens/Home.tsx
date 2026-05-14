import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  MessageSquare,
  Map,
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 18) return "Good afternoon,";
  return "Good evening,";
}

function formatRole(role: unknown) {
  if (typeof role !== "string" || !role) return "";
  if (role === "it_support") return "IT Support";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function isAssistanceNotification(row: any) {
  if (isMessageNotification(row)) return false;
  return (
    row?.type === "assistance" ||
    row?.target_role === "it_support" ||
    [
      "New assistance request",
      "Assistance request received",
      "Assistance request updated",
      "Assistance request resolved",
    ].includes(row?.title?.trim?.() ?? "")
  );
}

function isMessageNotification(row: any) {
  return Boolean(
    row?.type === "message" ||
      row?.message_id ||
      (row?.conversation_id && row?.title?.trim?.() === "New Message"),
  );
}

function isAnnouncementRow(row: any) {
  if (row?.type === "announcement" || row?.type === "event") return true;
  if (isMessageNotification(row) || isAssistanceNotification(row)) return false;
  return Boolean(row?.title || row?.body || row?.image_url);
}

function canSeeAnnouncement(row: any, user: { id: string; role: string }) {
  if (row.recipient_id && row.recipient_id !== user.id) return false;
  if (row.recipient_id === user.id) return true;
  if (user.role === "admin") return true;
  if (user.role === "faculty" && row.created_by === user.id) return true;

  const target = String(row.target_role ?? "").trim().toLowerCase();
  if (!target || ["all", "all_roles", "everyone", "public"].includes(target)) {
    return true;
  }

  return target === user.role;
}

export function Home() {
  const { currentUser, resolvedThemeMode } = useApp();
  const isDark = resolvedThemeMode === "dark";
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState<
    (AnnouncementDetail & {
      time: string;
      type: string;
    })[]
  >([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementDetail | null>(null);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");

  useEffect(() => {
    (async () => {
      setAnnouncementsLoading(true);
      setAnnouncementsError("");

      try {
        const { data: typedRows, error: typedError } = await supabase
          .from("notifications")
          .select("*")
          .in("type", ["announcement", "event"])
          .order("created_at", { ascending: false })
          .limit(50);

        let rows = typedRows ?? [];

        if (typedError) {
          const { data: fallbackRows, error: fallbackError } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200);

          if (fallbackError) throw fallbackError;
          rows = fallbackRows ?? [];
        }

        const visible = (rows as any[])
          .filter(isAnnouncementRow)
          .filter((n) => canSeeAnnouncement(n, currentUser));

        const authorIds = [
          ...new Set(
            visible
              .map((n: any) => n.created_by)
              .filter((id: unknown): id is string => typeof id === "string" && id.length > 0),
          ),
        ];
        let authorMap = new Map<
          string,
          { full_name: string | null; role: string | null }
        >();

        if (authorIds.length > 0) {
          const { data: authors } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .in("id", authorIds);

          authorMap = new Map(
            (authors ?? []).map((author: any) => [
              author.id,
              { full_name: author.full_name ?? null, role: author.role ?? null },
            ]),
          );
        }

        setAnnouncements(
          visible.slice(0, 5).map((n: any) => {
            const author = n.created_by ? authorMap.get(n.created_by) : null;
            const category = n.type === "event" ? "Event" : "Announcement";

            return {
              id: n.id,
              title: n.title ?? "",
              body: n.body ?? "",
              time: timeAgo(n.created_at),
              createdAt: n.created_at,
              imageUrl: n.image_url ?? undefined,
              authorName: author?.full_name?.trim() || "CCS Connect",
              authorRole: formatRole(author?.role),
              category,
              type:
                n.type === "announcement"
                  ? "urgent"
                  : n.type === "event"
                    ? "warning"
                    : "info",
            };
          }),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to load announcements.";
        setAnnouncements([]);
        setAnnouncementsError(message);
        console.warn("Failed to load home announcements", message, {
          source: "notifications",
          role: currentUser.role,
        });
      } finally {
        setAnnouncementsLoading(false);
      }
    })();
  }, [currentUser.id, currentUser.role]);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: c.creamLight }}>
      {/* Hero Header */}
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
        {/* Quick Actions */}
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
              icon={<Map size={20} />}
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

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
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
              <span
                style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: 500 }}
              >
                See all
              </span>
              <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {announcementsLoading ? (
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                Loading announcements...
              </p>
            ) : announcementsError ? (
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                Unable to load announcements right now.
              </p>
            ) : announcements.length === 0 ? (
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                  textAlign: "center",
                  padding: 20,
                }}
              >
                No announcements yet
              </p>
            ) : (
              announcements.map((ann) => (
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
                    borderLeft: `3px solid ${ann.type === "urgent" ? c.baseRed : ann.type === "warning" ? "#D97706" : "#1D4ED8"}`,
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
                      color={
                        ann.type === "urgent"
                          ? c.baseRed
                          : ann.type === "warning"
                            ? "#D97706"
                            : "#1D4ED8"
                      }
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
              ))
            )}
          </div>
        </motion.div>

        <div style={{ height: 8 }} />
      </div>
      <AnnouncementDetailSheet
        announcement={selectedAnnouncement}
        isDark={isDark}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </div>
  );
}
