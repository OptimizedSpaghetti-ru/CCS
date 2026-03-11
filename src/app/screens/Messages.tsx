import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, Edit, ChevronRight } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { TopBar } from "../components/TopBar";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

/* ---------- types ---------- */
interface ConversationRow {
  id: string;
  name: string;
  role: "student" | "faculty" | "admin" | "group";
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  initials: string;
  avatarUrl?: string;
  color: string;
}

const filters = ["All", "Students", "Faculty", "Groups"];

const ROLE_COLORS: Record<string, string> = {
  admin: "#7C3AED",
  faculty: c.darkRed,
  student: "#059669",
  group: "#1D4ED8",
};

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

function RoleBadge({ role }: { role: string }) {
  if (role === "group") return null;
  const isAdmin = role === "admin";
  const isFaculty = role === "faculty";
  const label = isAdmin ? "Admin" : isFaculty ? "Faculty" : "Student";
  const bg = isAdmin ? "#7C3AED20" : isFaculty ? `${c.baseRed}20` : "#3B528020";
  const color = isAdmin ? "#7C3AED" : isFaculty ? c.baseRed : "#3B5280";
  return (
    <span
      style={{
        fontFamily: fonts.ui,
        fontSize: 9,
        fontWeight: 600,
        background: bg,
        color,
        borderRadius: 20,
        padding: "1px 5px",
        marginLeft: 4,
      }}
    >
      {label}
    </span>
  );
}

export function Messages() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    try {
      /* 1. My conversation IDs */
      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", userId);

      if (!memberships || memberships.length === 0) {
        setConversations([]);
        return;
      }

      const convIds = memberships.map((m: any) => m.conversation_id);

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
        if (!msg.read_at && msg.sender_id !== userId) {
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
        let color = ROLE_COLORS.student;

        if (conv.is_group) {
          name = conv.title || "Group Chat";
          role = "group";
          color = ROLE_COLORS.group;
        } else if (otherMembers.length > 0) {
          const other = otherMembers[0];
          name = other?.full_name || "User";
          const r = other?.role ?? "student";
          role = (
            r === "faculty" || r === "admin" ? r : "student"
          ) as ConversationRow["role"];
          color = ROLE_COLORS[role] || ROLE_COLORS.student;
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
        { event: "UPDATE", schema: "public", table: "profiles" },
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
            : c.role === "group";
    const searchMatch =
      search === "" || c.name.toLowerCase().includes(search.toLowerCase());
    return roleMatch && searchMatch;
  });

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
        }
      />

      {/* Search */}
      <div style={{ padding: "10px 16px 0", background: c.darkestRed }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: c.white,
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
              color: c.darkBrown,
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
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? g.button : "rgba(255,240,196,0.15)",
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
                boxShadow: filter === f ? shadow.button : "none",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: "auto", background: c.creamLight }}>
        {loading ? (
          <div style={{ padding: "40px 32px", textAlign: "center" }}>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 14,
                color: c.warmGray,
              }}
            >
              Loading conversations…
            </p>
          </div>
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
          filtered.map((conv, i) => (
            <button
              key={conv.id}
              onClick={() =>
                conv.role === "group"
                  ? navigate(`/app/messages/group/${conv.id}`)
                  : navigate(`/app/messages/${conv.id}`)
              }
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: conv.unread > 0 ? c.cream : c.white,
                border: "none",
                borderBottom: `1px solid rgba(139,115,85,0.1)`,
                cursor: "pointer",
                textAlign: "left",
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
                      color: c.darkBrown,
                    }}
                  >
                    {conv.name}
                  </span>
                  <RoleBadge role={conv.role} />
                </div>
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: conv.unread > 0 ? c.darkBrown : c.warmGray,
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
                    color: c.warmGray,
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
          ))
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
