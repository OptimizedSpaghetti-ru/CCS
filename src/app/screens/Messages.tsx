import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, Edit, CheckCircle } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { TopBar } from "../components/TopBar";
import { AppLoadingState } from "../components/AppLoadingState";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";
import {
  MESSAGE_ROLE_COLORS,
  normalizeMessageRole,
  roleLabel,
  type ConversationRole,
} from "../utils/messageRoles";

/* ---------- types ---------- */
interface ConversationRow {
  id: string;
  name: string;
  role: ConversationRole;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  initials: string;
  avatarUrl?: string;
  color: string;
}

const filters = ["All", "Students", "Faculty", "IT Support", "Groups"];

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  if (diff < 172_800_000) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({
  initials,
  color,
  avatarUrl,
  size = 44,
  online,
}: {
  initials: string;
  color: string;
  avatarUrl?: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          border: `2px solid ${c.baseRed}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: fonts.display,
              fontSize: size * 0.3,
              fontWeight: 700,
              color: c.cream,
            }}
          >
            {initials}
          </span>
        )}
      </div>
      {online && (
        <div
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#22C55E",
            border: `2px solid ${c.white}`,
          }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role, isDark }: { role: string; isDark: boolean }) {
  if (role === "group") return null;
  const normalized = normalizeMessageRole(role);
  const tone = MESSAGE_ROLE_COLORS[normalized];
  const bg = isDark ? `${tone}40` : `${tone}18`;
  const color = isDark ? c.cream : tone;
  return (
    <span
      style={{
        fontFamily: fonts.ui,
        fontSize: 9,
        fontWeight: 600,
        background: bg,
        color,
        border: `1px solid ${isDark ? `${tone}70` : `${tone}24`}`,
        borderRadius: 20,
        padding: "1px 5px",
        marginLeft: 4,
      }}
    >
      {roleLabel(normalized)}
    </span>
  );
}

export function Messages() {
  const navigate = useNavigate();
  const {
    markAllConversationsRead,
    markConversationRead,
    resolvedThemeMode,
  } = useApp();
  const isDark = resolvedThemeMode === "dark";
  const searchSurface = isDark ? "#2A141A" : c.white;
  const mutedSurface = isDark ? "rgba(255,232,217,0.08)" : "rgba(255,240,196,0.15)";
  const listSurface = c.creamLight;
  const rowSurface = isDark ? "#1F0F14" : c.white;
  const unreadSurface = isDark ? "#2A141A" : c.cream;
  const rowBorder = isDark ? "rgba(255,232,217,0.12)" : "rgba(139,115,85,0.1)";
  const primaryText = c.darkBrown;
  const secondaryText = isDark ? "rgba(255,232,217,0.74)" : c.warmGray;
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [readAllDone, setReadAllDone] = useState(false);

  const loadConversations = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    try {
      /* 1. My conversation IDs */
      let { data: memberships, error: membershipError } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("user_id", userId);
      if (membershipError) {
        const fallback = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", userId);
        memberships = fallback.data;
      }

      if (!memberships || memberships.length === 0) {
        setConversations([]);
        return;
      }

      const convIds = memberships.map((m: any) => m.conversation_id);
      const readMap = new Map(
        memberships.map((m: any) => [
          m.conversation_id,
          m.last_read_at ? new Date(m.last_read_at).getTime() : 0,
        ]),
      );

      /* 2. Conversations + members' profiles */
      const { data: convos } = await supabase
        .from("conversations")
        .select(
          `id, title, is_group, updated_at,
           conversation_members ( user_id, profiles:user_id ( id, full_name, role, show_online_status, is_online, avatar_url ) )`,
        )
        .in("id", convIds)
        .order("updated_at", { ascending: false });

      if (!convos) {
        setConversations([]);
        return;
      }

      /* 3. Messages for unread + preview */
      const { data: allMessages } = await supabase
        .from("messages")
        .select("conversation_id, body, sender_id, created_at, read_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      const latestMap = new Map<string, { body: string; created_at: string }>();
      const unreadMap = new Map<string, number>();
      for (const msg of allMessages ?? []) {
        if (!latestMap.has(msg.conversation_id)) {
          latestMap.set(msg.conversation_id, {
            body: msg.body,
            created_at: msg.created_at,
          });
        }
        const lastRead = readMap.get(msg.conversation_id) ?? 0;
        const isUnread =
          msg.sender_id !== userId &&
          (lastRead > 0
            ? new Date(msg.created_at).getTime() > lastRead
            : !msg.read_at);
        if (isUnread) {
          unreadMap.set(
            msg.conversation_id,
            (unreadMap.get(msg.conversation_id) ?? 0) + 1,
          );
        }
      }

      /* 4. Map to UI rows */
      const rows: ConversationRow[] = convos.map((conv: any) => {
        const members: any[] = conv.conversation_members ?? [];
        const otherMembers = members
          .filter((m: any) => m.user_id !== userId)
          .map((m: any) => m.profiles);

        let name = conv.title || "Conversation";
        let role: ConversationRow["role"] = "student";
        let color = MESSAGE_ROLE_COLORS.student;

        if (conv.is_group) {
          name = conv.title || "Group Chat";
          role = "group";
          color = MESSAGE_ROLE_COLORS.group;
        } else if (otherMembers.length > 0) {
          const other = otherMembers[0];
          name = other?.full_name || "User";
          role = normalizeMessageRole(other?.role);
          color = MESSAGE_ROLE_COLORS[role];
        }

        const latest = latestMap.get(conv.id);
        const unread = unreadMap.get(conv.id) ?? 0;

        return {
          id: conv.id,
          name,
          role,
          preview: latest?.body ?? "No messages yet",
          time: latest ? timeAgo(latest.created_at) : "",
          unread,
          online: Boolean(
            otherMembers[0]?.show_online_status !== false &&
            otherMembers[0]?.is_online,
          ),
          initials: conv.is_group ? "GR" : getInitials(name),
          avatarUrl: conv.is_group ? undefined : otherMembers[0]?.avatar_url,
          color,
        };
      });

      setConversations(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel("messages-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          loadConversations();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          loadConversations();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          loadConversations();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_members" },
        () => {
          loadConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  const filtered = conversations.filter((c) => {
    const roleMatch =
      filter === "All"
        ? true
        : filter === "Students"
          ? c.role === "student"
          : filter === "Faculty"
            ? c.role === "faculty"
            : filter === "IT Support"
              ? c.role === "it_support"
              : c.role === "group";
    const searchMatch =
      search === "" || c.name.toLowerCase().includes(search.toLowerCase());
    return roleMatch && searchMatch;
  });

  const openConversation = (conv: ConversationRow) => {
    if (conv.unread > 0) {
      setConversations((prev) =>
        prev.map((item) =>
          item.id === conv.id ? { ...item, unread: 0 } : item,
        ),
      );
    }
    void markConversationRead(conv.id, conv.unread);
    navigate(
      conv.role === "group"
        ? `/app/messages/group/${conv.id}`
        : `/app/messages/${conv.id}`,
    );
  };

  const markAllRead = async () => {
    if (!conversations.some((conv) => conv.unread > 0)) return;
    setConversations((prev) => prev.map((conv) => ({ ...conv, unread: 0 })));
    setReadAllDone(true);
    await markAllConversationsRead();
    window.setTimeout(() => setReadAllDone(false), 1400);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <TopBar
        title="Messages"
        rightContent={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className="hover-press"
              onClick={markAllRead}
              disabled={!conversations.some((conv) => conv.unread > 0)}
              style={{
                background: readAllDone
                  ? "rgba(34,197,94,0.22)"
                  : "rgba(255,240,196,0.12)",
                border: `1px solid ${readAllDone ? "rgba(34,197,94,0.42)" : "rgba(255,240,196,0.16)"}`,
                borderRadius: 999,
                padding: "7px 10px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: c.cream,
                cursor: conversations.some((conv) => conv.unread > 0)
                  ? "pointer"
                  : "default",
                opacity: conversations.some((conv) => conv.unread > 0) ? 1 : 0.55,
                transition:
                  "background 0.2s ease, border-color 0.2s ease, transform 0.16s ease, opacity 0.2s ease",
              }}
            >
              <CheckCircle size={14} />
              <span style={{ fontFamily: fonts.ui, fontSize: 12 }}>
                {readAllDone ? "Done" : "Read all"}
              </span>
            </button>
            <button
              onClick={() => navigate("/app/messages/compose")}
              style={{
                background: g.button,
                border: "none",
                borderRadius: 10,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: shadow.button,
              }}
            >
              <Edit size={16} color={c.cream} />
            </button>
          </div>
        }
      />

      {/* Search */}
      <div style={{ padding: "10px 16px 0", background: c.darkestRed }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: searchSurface,
            border: `1px solid ${isDark ? "rgba(255,232,217,0.16)" : "transparent"}`,
            borderRadius: 24,
            padding: "0 14px",
            height: 40,
            boxShadow: shadow.card,
          }}
        >
          <Search size={16} color={c.warmGray} />
          <input
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: fonts.ui,
              fontSize: 13,
              color: primaryText,
            }}
          />
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 0 12px",
            overflowX: "auto",
          }}
        >
          {filters.map((f) => (
            <button
              className="hover-press"
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? g.button : mutedSurface,
                border:
                  filter === f ? "none" : "1px solid rgba(255,240,196,0.2)",
                borderRadius: 20,
                padding: "5px 14px",
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 600,
                color: filter === f ? c.cream : c.warmGrayLight,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transform: filter === f ? "translateY(-1px) scale(1.02)" : "scale(1)",
                boxShadow: filter === f ? shadow.button : "none",
                transition:
                  "background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.16s ease",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: "auto", background: listSurface }}>
        {loading ? (
          <AppLoadingState
            message="Loading conversations..."
            detail="Getting your recent messages."
            isDark={isDark}
          />
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 32px", textAlign: "center" }}>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 14,
                color: c.warmGray,
              }}
            >
              No conversations yet. Tap + to start one.
            </p>
          </div>
        ) : (
          <div key={filter} className="notifications-filter-panel">
          {filtered.map((conv, i) => (
            <button
              className="hover-row notifications-filter-item"
              key={conv.id}
              onClick={() => openConversation(conv)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: conv.unread > 0 ? unreadSurface : rowSurface,
                border: "none",
                borderBottom: `1px solid ${rowBorder}`,
                cursor: "pointer",
                textAlign: "left",
                animationDelay: `${Math.min(i, 8) * 24}ms`,
                transition:
                  "background-color 0.2s ease, border-color 0.2s ease, transform 0.18s ease, filter 0.2s ease",
              }}
            >
              <Avatar
                initials={conv.initials}
                color={conv.color}
                avatarUrl={conv.avatarUrl}
                online={conv.online}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 14,
                      fontWeight: conv.unread > 0 ? 700 : 500,
                      color: primaryText,
                    }}
                  >
                    {conv.name}
                  </span>
                  <RoleBadge role={conv.role} isDark={isDark} />
                </div>
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: conv.unread > 0 ? primaryText : secondaryText,
                    fontWeight: conv.unread > 0 ? 500 : 400,
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {conv.preview}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: secondaryText,
                  }}
                >
                  {conv.time}
                </span>
                {conv.unread > 0 && (
                  <div
                    style={{
                      background: c.baseRed,
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 10,
                        fontWeight: 700,
                        color: c.cream,
                      }}
                    >
                      {conv.unread}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/app/messages/compose")}
        style={{
          position: "absolute",
          bottom: 90,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: g.button,
          border: "none",
          boxShadow: shadow.button,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
        }}
      >
        <Edit size={22} color={c.cream} />
      </button>
    </div>
  );
}
