import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  MessageSquare,
  Megaphone,
  Calendar,
  Trash2,
  CheckCircle,
  Settings,
  Wrench,
  LoaderCircle,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { TopBar } from "../components/TopBar";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";
import {
  AnnouncementDetailSheet,
  type AnnouncementDetail,
} from "../components/AnnouncementDetailSheet";

const tabs = ["All", "Messages", "Announcements", "Assistance"];

interface Notif {
  id: string;
  type: "message" | "announcement" | "event" | "assistance";
  source: "notification" | "message";
  title: string;
  body: string;
  imageUrl?: string;
  announcementId?: string;
  createdBy?: string | null;
  authorName?: string;
  authorRole?: string;
  createdAt: string;
  time: string;
  unread: boolean;
  day: string;
  path?: string;
  conversationId?: string;
  recipientId?: string | null;
}

const typeConfig = {
  message: { icon: MessageSquare, color: c.baseRed, label: "Message" },
  announcement: { icon: Megaphone, color: "#D97706", label: "Announcement" },
  event: { icon: Calendar, color: "#1D4ED8", label: "Event" },
  assistance: { icon: Wrench, color: "#059669", label: "Assistance" },
};

const assistanceNotificationTitles = new Set([
  "New assistance request",
  "Assistance request received",
  "Assistance request updated",
  "Assistance request resolved",
]);

function isAssistanceNotification(row: any) {
  if (isMessageNotification(row)) return false;
  if (
    row?.announcement_id ||
    row?.type === "announcement" ||
    row?.type === "event"
  ) {
    return false;
  }

  return (
    row?.type === "assistance" ||
    assistanceNotificationTitles.has(row?.title?.trim?.() ?? "")
  );
}

function isMessageNotification(row: any) {
  return Boolean(
    row?.type === "message" ||
      row?.message_id ||
      (row?.conversation_id && row?.title?.trim?.() === "New Message"),
  );
}

function getNotificationType(row: any): Notif["type"] {
  if (isMessageNotification(row)) return "message";
  if (isAssistanceNotification(row)) return "assistance";
  if (row?.type === "event") return "event";
  return "announcement";
}

function NotifItem({
  notif,
  onDismiss,
  onOpenAnnouncement,
  isDark,
}: {
  notif: Notif;
  onDismiss: (notif: Notif) => void;
  onOpenAnnouncement: (notif: Notif) => void | Promise<void>;
  isDark: boolean;
}) {
  const navigate = useNavigate();
  const conf = typeConfig[notif.type] ?? typeConfig.announcement;
  const Icon = conf.icon;
  const authorMeta =
    notif.source === "notification" && notif.authorName
      ? `${notif.authorName}${notif.authorRole ? ` (${notif.authorRole})` : ""}`
      : "";

  return (
    <div
      className="hover-row"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 16px",
        background: notif.unread
          ? isDark
            ? "#2B161D"
            : c.cream
          : isDark
            ? "#1F0F14"
            : c.white,
        borderBottom: `1px solid ${isDark ? "rgba(255,232,217,0.1)" : "rgba(139,115,85,0.08)"}`,
        cursor: "pointer",
        position: "relative",
        borderLeft: notif.unread
          ? `3px solid ${conf.color}`
          : "3px solid transparent",
      }}
      onClick={() => {
        if (notif.type === "announcement" || notif.type === "event") {
          onOpenAnnouncement(notif);
          return;
        }
        if (notif.path) navigate(notif.path);
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `${conf.color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={conf.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 13,
            fontWeight: notif.unread ? 700 : 500,
            color: c.darkBrown,
            margin: "0 0 3px",
            lineHeight: 1.3,
          }}
        >
          {notif.title}
        </p>
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 12,
            color: c.warmGray,
            margin: "0 0 4px",
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {notif.body}
        </p>
        {notif.imageUrl && (
          <img
            src={notif.imageUrl}
            alt="notification pubmat"
            style={{
              width: "100%",
              maxHeight: 170,
              objectFit: "cover",
              borderRadius: 10,
              margin: "4px 0 6px",
              border: `1px solid ${isDark ? "rgba(255,232,217,0.22)" : "rgba(139,115,85,0.18)"}`,
            }}
          />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: `${conf.color}15`,
              color: conf.color,
              borderRadius: 20,
              padding: "1px 7px",
              fontFamily: fonts.ui,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {conf.label}
          </span>
          <span
            style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray }}
          >
            {notif.time}
            {authorMeta ? ` | ${authorMeta}` : ""}
          </span>
        </div>
      </div>
      <button
        className="hover-press"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notif);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: isDark ? "rgba(255,232,217,0.65)" : c.warmGrayLight,
          padding: 4,
          flexShrink: 0,
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function NotificationsLoading({ isDark }: { isDark: boolean }) {
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
          Loading notifications...
        </h3>
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 13,
            color: c.warmGray,
            margin: 0,
          }}
        >
          Checking your latest updates.
        </p>
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
        {[0, 1, 2].map((item) => (
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

export function Notifications() {
  const navigate = useNavigate();
  const { currentUser, resolvedThemeMode } = useApp();
  const isDark = resolvedThemeMode === "dark";
  const [activeTab, setActiveTab] = useState("All");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementDetail | null>(null);

  function dayLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatRole(role: unknown) {
    if (typeof role !== "string" || !role) return "";
    if (role === "it_support") return "IT Support";
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  async function getAuthorMeta(authorId: unknown, fallbackRole: unknown) {
    if (typeof authorId !== "string" || !authorId) {
      return {
        authorName: "CCS Connect",
        authorRole: formatRole(fallbackRole),
      };
    }

    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", authorId)
      .maybeSingle();

    return {
      authorName: data?.full_name?.trim() || "CCS Connect",
      authorRole: formatRole(data?.role ?? fallbackRole),
    };
  }

  const loadNotifs = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      let notificationNotifs: Notif[] = [];

      if (!error && data) {
        const rows = data as any[];

        // Role-based visibility filter:
        // - Students: see announcements with target_role = 'student' OR target_role = null (all roles)
        // - Faculty: see announcements they authored, or null-target ones
        // - Admin: see all
        const visibleRows = rows.filter((n: any) => {
          if (n.recipient_id && n.recipient_id !== currentUser.id) return false;
          if (n.recipient_id === currentUser.id) return true;
          if (currentUser.role === "admin") return true;
          if (currentUser.role === "student") {
            return n.target_role === "student" || n.target_role === null;
          }
          if (currentUser.role === "faculty") {
            // Faculty see announcements addressed to faculty or all roles,
            // but NOT student-only announcements from other faculty
            return (
              n.target_role === "faculty" ||
              n.target_role === null ||
              n.created_by === currentUser.id
            );
          }
          if (currentUser.role === "it_support") {
            return n.target_role === "it_support" || n.target_role === null;
          }
          return true;
        });

        const ids = visibleRows.map((n: any) => n.id);
        let statusMap = new Map<
          string,
          { read_at: string | null; dismissed_at: string | null }
        >();

        if (ids.length > 0) {
          const { data: statuses } = await supabase
            .from("notification_status")
            .select("notification_id, read_at, dismissed_at")
            .eq("user_id", currentUser.id)
            .in("notification_id", ids);

          statusMap = new Map(
            (statuses ?? []).map((s: any) => [s.notification_id, s]),
          );
        }

        const authorIds = [
          ...new Set(
            visibleRows
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

        notificationNotifs = visibleRows
          .filter((n: any) => !statusMap.get(n.id)?.dismissed_at)
          .map((n: any) => {
            const author = n.created_by ? authorMap.get(n.created_by) : null;

            return {
              id: n.id,
              type: getNotificationType(n),
              source: "notification",
              title: n.title?.trim() || "Notification",
              body: n.body?.trim() || "Tap to view details.",
              imageUrl: n.image_url ?? undefined,
              announcementId: n.announcement_id ?? undefined,
              createdBy: n.created_by ?? null,
              authorName: author?.full_name?.trim() || undefined,
              authorRole: formatRole(author?.role),
              createdAt: n.created_at,
              time: fmtTime(n.created_at),
              unread: !statusMap.get(n.id)?.read_at,
              day: dayLabel(n.created_at),
              conversationId: n.conversation_id ?? undefined,
              recipientId: n.recipient_id ?? null,
              path:
                isMessageNotification(n) && n.conversation_id
                  ? `/app/messages/${n.conversation_id}`
                  : isAssistanceNotification(n)
                    ? currentUser.role === "it_support"
                      ? "/app/it-support"
                      : "/app/assistance"
                    : undefined,
            };
          });
      }

      let messageNotifs: Notif[] = [];
      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", currentUser.id);

      const conversationIds = [
        ...new Set((memberships ?? []).map((m: any) => m.conversation_id)),
      ];

      if (conversationIds.length > 0) {
        const { data: unreadMessages } = await supabase
          .from("messages")
          .select("id, conversation_id, body, sender_id, created_at")
          .in("conversation_id", conversationIds)
          .neq("sender_id", currentUser.id)
          .is("read_at", null)
          .order("created_at", { ascending: false })
          .limit(120);

        if (unreadMessages && unreadMessages.length > 0) {
          const unreadConversationIds = [
            ...new Set(unreadMessages.map((msg: any) => msg.conversation_id)),
          ];

          const { data: convos } = await supabase
            .from("conversations")
            .select(
              `id, title, is_group,
               conversation_members ( user_id, profiles:user_id ( id, full_name ) )`,
            )
            .in("id", unreadConversationIds);

          const conversationMap = new Map(
            (convos ?? []).map((conv: any) => [conv.id, conv]),
          );

          const groupedUnread = unreadMessages.reduce(
            (acc, msg: any) => {
              if (!acc[msg.conversation_id]) acc[msg.conversation_id] = [];
              acc[msg.conversation_id].push(msg);
              return acc;
            },
            {} as Record<string, any[]>,
          );

          messageNotifs = Object.entries(groupedUnread).map(
            ([conversationId, msgs]) => {
              const latest = msgs[0];
              const conv = conversationMap.get(conversationId) as any;
              const members = conv?.conversation_members ?? [];
              const otherMember = members.find(
                (m: any) => m.user_id !== currentUser.id,
              )?.profiles;

              const conversationName = conv?.is_group
                ? conv.title || "Group Chat"
                : otherMember?.full_name || "Conversation";

              const unreadCount = msgs.length;
              const preview =
                latest.body?.trim() ||
                `${unreadCount} new message${unreadCount > 1 ? "s" : ""}`;

              return {
                id: `msg-${conversationId}`,
                conversationId,
                type: "message" as Notif["type"],
                source: "message" as const,
                title: conversationName,
                body: preview,
                createdBy: latest.sender_id ?? null,
                createdAt: latest.created_at,
                time: fmtTime(latest.created_at),
                unread: true,
                day: dayLabel(latest.created_at),
                path: conv?.is_group
                  ? `/app/messages/group/${conversationId}`
                  : `/app/messages/${conversationId}`,
              };
            },
          );
        }
      }

      const notificationMessageConversationIds = new Set(
        notificationNotifs
          .filter((notif) => notif.type === "message" && notif.conversationId)
          .map((notif) => notif.conversationId),
      );

      setNotifs(
        [
          ...messageNotifs.filter(
            (notif) => !notificationMessageConversationIds.has(notif.conversationId),
          ),
          ...notificationNotifs,
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    loadNotifs();

    const channel = supabase
      .channel("notifs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          loadNotifs();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_status" },
        () => {
          loadNotifs();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          loadNotifs();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifs]);

  const filtered = notifs.filter((n) =>
    activeTab === "All"
      ? true
      : activeTab === "Messages"
        ? n.type === "message"
        : activeTab === "Assistance"
          ? n.type === "assistance"
          : n.type === "announcement" || n.type === "event",
  );

  const grouped = filtered.reduce(
    (acc, n) => {
      if (!acc[n.day]) acc[n.day] = [];
      acc[n.day].push(n);
      return acc;
    },
    {} as Record<string, Notif[]>,
  );

  const dismiss = async (notif: Notif) => {
    const previous = [...notifs];
    setNotifs((prev) => prev.filter((n) => n.id !== notif.id));

    if (notif.type === "message" && notif.conversationId) {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", notif.conversationId)
        .neq("sender_id", currentUser.id)
        .is("read_at", null);

      if (error) {
        setNotifs(previous);
        return;
      }

      if (notif.source === "message") {
        return;
      }
    }

    const isAdminAnnouncement =
      currentUser.role === "admin" && !notif.recipientId;

    if (isAdminAnnouncement) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notif.id);
      if (error) {
        setNotifs(previous);
      }
      return;
    }

    const { error } = await supabase.from("notification_status").upsert(
      {
        notification_id: notif.id,
        user_id: currentUser.id,
        dismissed_at: new Date().toISOString(),
      },
      { onConflict: "notification_id,user_id" },
    );

    if (error) {
      setNotifs(previous);
    }
  };

  const markAllRead = async () => {
    const unreadNotifIds = notifs
      .filter((n) => n.unread && n.source === "notification")
      .map((n) => n.id);
    const unreadMessageConversationIds = [
      ...new Set(
        notifs
          .filter((n) => n.unread && n.type === "message" && n.conversationId)
          .map((n) => n.conversationId as string),
      ),
    ];

    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));

    if (unreadNotifIds.length > 0) {
      const rows = unreadNotifIds.map((nid) => ({
        notification_id: nid,
        user_id: currentUser.id,
        read_at: new Date().toISOString(),
      }));
      await supabase
        .from("notification_status")
        .upsert(rows, { onConflict: "notification_id,user_id" });
    }

    if (unreadMessageConversationIds.length > 0) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("conversation_id", unreadMessageConversationIds)
        .neq("sender_id", currentUser.id)
        .is("read_at", null);
    }
  };

  const openAnnouncement = async (notif: Notif) => {
    const conf = typeConfig[notif.type] ?? typeConfig.announcement;

    if (notif.announcementId) {
      const { data: announcement, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", notif.announcementId)
        .maybeSingle();

      if (!error && announcement) {
        const author = await getAuthorMeta(
          announcement.created_by,
          announcement.created_by_role,
        );

        setSelectedAnnouncement({
          id: announcement.id,
          title: announcement.title?.trim() || notif.title,
          body: announcement.body?.trim() || notif.body,
          imageUrl: announcement.image_url ?? notif.imageUrl,
          authorName: author.authorName,
          authorRole: author.authorRole,
          createdAt: announcement.created_at ?? notif.createdAt,
          category: announcement.category || conf.label,
        });
        return;
      }
    }

    setSelectedAnnouncement({
      id: notif.id,
      title: notif.title,
      body: notif.body,
      imageUrl: notif.imageUrl,
      authorName: notif.authorName || "CCS Connect",
      authorRole: notif.authorRole,
      createdAt: notif.createdAt,
      category: conf.label,
    });
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <TopBar
        title="Notifications"
        rightContent={
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="hover-press"
              onClick={markAllRead}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: c.cream,
                opacity: 0.85,
              }}
            >
              <CheckCircle size={14} />
              <span style={{ fontFamily: fonts.ui, fontSize: 12 }}>
                Read all
              </span>
            </button>
            <button
              className="hover-press"
              onClick={() => navigate("/app/notifications/settings")}
              style={{
                background: "rgba(255,240,196,0.15)",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Settings size={15} color={c.cream} />
            </button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div
        style={{
          background: isDark ? "#190A0E" : c.darkestRed,
          padding: "8px 14px 10px",
          borderBottom: `1px solid ${isDark ? "rgba(255,232,217,0.12)" : "transparent"}`,
        }}
      >
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {tabs.map((tab) => (
            <button
              className="hover-press"
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background:
                  activeTab === tab
                    ? g.button
                    : isDark
                      ? "rgba(255,232,217,0.12)"
                      : "rgba(255,240,196,0.12)",
                border:
                  activeTab === tab
                    ? "none"
                    : `1px solid ${isDark ? "rgba(255,232,217,0.22)" : "rgba(255,240,196,0.15)"}`,
                borderRadius: 20,
                padding: "5px 14px",
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === tab ? c.cream : `${c.cream}70`,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div style={{ flex: 1, overflowY: "auto", background: c.creamLight }}>
        <div key={activeTab} className="notifications-filter-panel">
          {loading ? (
            <NotificationsLoading isDark={isDark} />
          ) : Object.entries(grouped).length === 0 ? (
            <div style={{ padding: "60px 32px", textAlign: "center" }}>
              <h3
                style={{
                  fontFamily: fonts.display,
                  fontSize: 18,
                  color: c.darkBrown,
                  margin: "0 0 8px",
                }}
              >
                You're all caught up!
              </h3>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: c.warmGray,
                  margin: 0,
                }}
              >
                No notifications right now.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([day, dayNotifs], groupIndex) => (
              <div key={day}>
                <div
                  style={{
                    padding: "10px 16px 6px",
                    background: c.creamLight,
                    borderTop: `1px solid ${isDark ? "rgba(255,232,217,0.06)" : "transparent"}`,
                  }}
                >
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 11,
                      fontWeight: 700,
                      color: c.warmGray,
                      margin: 0,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {day}
                  </p>
                </div>
                {dayNotifs.map((n, itemIndex) => (
                  <div
                    key={n.id}
                    className="notifications-filter-item"
                    style={{
                      animationDelay: `${Math.min(groupIndex * 35 + itemIndex * 28, 180)}ms`,
                    }}
                  >
                    <NotifItem
                      notif={n}
                      onDismiss={dismiss}
                      onOpenAnnouncement={openAnnouncement}
                      isDark={isDark}
                    />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
      <AnnouncementDetailSheet
        announcement={selectedAnnouncement}
        isDark={isDark}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </div>
  );
}
