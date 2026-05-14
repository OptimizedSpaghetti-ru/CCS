import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Settings,
  Pin,
  ThumbsUp,
  Heart,
  Eye,
  Reply,
  FileText,
  Users,
  Laugh,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { AppLoadingState } from "../components/AppLoadingState";
import { ChatInputBar } from "../components/ChatInputBar";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";
import { normalizeMessageRole } from "../utils/messageRoles";
import {
  formatFileSize,
  isImageAttachment,
  type MessageAttachment,
  uploadMessageAttachment,
} from "../../lib/messageAttachments";

interface GroupMsg {
  id: string;
  from: string;
  initials: string;
  avatarUrl?: string;
  color: string;
  role: string;
  text: string;
  time: string;
  createdAt: string;
  attachment?: MessageAttachment;
  reactions: Record<string, number>;
  replies: number;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dateKey(iso: string) {
  return new Date(iso).toDateString();
}

function dateLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function DateSeparator({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "8px 0 14px",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: isDark
            ? "rgba(255,232,217,0.14)"
            : "rgba(139,115,85,0.2)",
        }}
      />
      <div
        style={{
          background: isDark ? "#241118" : c.cream,
          borderRadius: 20,
          padding: "3px 12px",
          border: `1px solid ${isDark ? "rgba(255,232,217,0.16)" : "rgba(139,115,85,0.15)"}`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            color: isDark ? "rgba(255,232,217,0.76)" : c.warmGray,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          height: 1,
          background: isDark
            ? "rgba(255,232,217,0.14)"
            : "rgba(139,115,85,0.2)",
        }}
      />
    </div>
  );
}

const MEMBER_COLORS = [
  "#7C3AED",
  "#D97706",
  "#059669",
  "#1D4ED8",
  "#EA4335",
  "#374151",
];

function GroupMessage({ msg, isDark }: { msg: GroupMsg; isDark: boolean }) {
  const isMe = msg.from === "Me";
  const hasText = msg.text.trim().length > 0;
  const attachmentSurface = isDark ? "#2B161D" : c.cream;
  const attachmentBorder = isDark
    ? "rgba(255,232,217,0.16)"
    : "rgba(139,115,85,0.16)";
  const reactionIcons = {
    like: <ThumbsUp size={11} color={c.warmGray} />,
    support: <Heart size={11} color={c.warmGray} />,
    seen: <Eye size={11} color={c.warmGray} />,
    laugh: <Laugh size={11} color={c.warmGray} />,
  } as const;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMe ? "row-reverse" : "row",
        gap: 8,
        marginBottom: 14,
      }}
    >
      {!isMe && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: msg.color,
            border: `2px solid ${c.baseRed}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 4,
            overflow: "hidden",
          }}
        >
          {msg.avatarUrl ? (
            <img
              src={msg.avatarUrl}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontFamily: fonts.ui,
                fontSize: 10,
                fontWeight: 700,
                color: c.cream,
              }}
            >
              {msg.initials}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          maxWidth: "75%",
          display: "flex",
          flexDirection: "column",
          alignItems: isMe ? "flex-end" : "flex-start",
        }}
      >
        {!isMe && (
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 11,
              fontWeight: 600,
              color: c.warmGray,
              margin: "0 0 4px 2px",
            }}
          >
            {msg.from}
          </p>
        )}
        <div
          style={{
            background: isMe ? g.sentBubble : c.white,
            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            padding: msg.attachment ? 8 : "10px 14px",
            boxShadow: shadow.card,
            maxWidth: "100%",
            width: "fit-content",
          }}
        >
          {hasText && (
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 13,
                color: isMe ? c.cream : c.darkBrown,
                margin: msg.attachment ? "2px 6px 8px" : 0,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {msg.text}
            </p>
          )}
          {msg.attachment &&
            (isImageAttachment(msg.attachment.type, msg.attachment.name) ? (
              <a href={msg.attachment.url} target="_blank" rel="noreferrer">
                <img
                  src={msg.attachment.url}
                  alt={msg.attachment.name}
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: 240,
                    objectFit: "cover",
                    borderRadius: 12,
                  }}
                />
              </a>
            ) : (
              <a
                className="message-attachment-link"
                href={msg.attachment.url}
                target="_blank"
                rel="noreferrer"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: isMe ? "rgba(255,240,196,0.16)" : attachmentSurface,
                    border: `1px solid ${isMe ? "rgba(255,240,196,0.24)" : attachmentBorder}`,
                  }}
                >
                  <FileText size={18} color={isMe ? c.cream : c.baseRed} />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: fonts.ui,
                        fontSize: 12,
                        fontWeight: 700,
                        color: isMe ? c.cream : c.darkBrown,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {msg.attachment.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        color: isMe ? `${c.cream}B8` : c.warmGray,
                      }}
                    >
                      {formatFileSize(msg.attachment.size)}
                    </p>
                  </div>
                </div>
              </a>
            ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 5,
            justifyContent: isMe ? "flex-end" : "flex-start",
          }}
        >
          {/* Reactions */}
          <div style={{ display: "flex", gap: 4 }}>
            {Object.entries(msg.reactions).map(([reaction, count]) => (
              <div
                key={reaction}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  background: c.white,
                  borderRadius: 20,
                  padding: "2px 6px",
                  border: `1px solid rgba(139,115,85,0.15)`,
                  boxShadow: shadow.card,
                }}
              >
                {reactionIcons[reaction as keyof typeof reactionIcons]}
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 10,
                    color: c.warmGray,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
          {msg.replies > 0 && (
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                color: c.baseRed,
              }}
            >
              <Reply size={12} />
              <span style={{ fontFamily: fonts.ui, fontSize: 11 }}>
                {msg.replies}
              </span>
            </button>
          )}
          <span
            style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray }}
          >
            {msg.time}
          </span>
        </div>
      </div>
    </div>
  );
}

export function GroupChat() {
  const navigate = useNavigate();
  const { id: conversationId } = useParams();
  const { currentUser, markConversationRead, resolvedThemeMode } = useApp();
  const isDark = resolvedThemeMode === "dark";
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [groupMessages, setGroupMessages] = useState<GroupMsg[]>([]);
  const [groupTitle, setGroupTitle] = useState("Group Chat");
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleConversationViewed = useCallback(
    async (userId: string) => {
      if (!conversationId) return;

      await markConversationRead(conversationId);
    },
    [conversationId, markConversationRead],
  );

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    /* Conversation meta */
    const { data: conv } = await supabase
      .from("conversations")
      .select(
        `id, title, conversation_members ( user_id, profiles:user_id ( id, full_name, role, avatar_url ) )`,
      )
      .eq("id", conversationId)
      .maybeSingle();

    if (conv) {
      setGroupTitle(conv.title || "Group Chat");
      setMemberCount((conv.conversation_members as any[])?.length ?? 0);
    }

    /* Build a name map from members */
    const nameMap = new Map<
      string,
      { name: string; role: string; avatarUrl?: string }
    >();
    for (const m of (conv?.conversation_members as any[]) ?? []) {
      const p = m.profiles;
      nameMap.set(m.user_id, {
        name: m.user_id === userId ? "Me" : p?.full_name || "User",
        role: normalizeMessageRole(p?.role),
        avatarUrl: p?.avatar_url ?? undefined,
      });
    }

    /* Messages */
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, body, sender_id, created_at, attachment_url, attachment_name, attachment_type, attachment_size")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setGroupMessages(
      (msgs ?? []).map((m: any, i: number) => {
        const info = nameMap.get(m.sender_id) || {
          name: "User",
          role: "student",
        };
        return {
          id: m.id,
          from: info.name,
          initials:
            info.name === "Me" ? currentUser.initials : getInitials(info.name),
          avatarUrl:
            info.name === "Me"
              ? currentUser.avatar || undefined
              : info.avatarUrl,
          color:
            info.name === "Me"
              ? c.darkRed
              : MEMBER_COLORS[i % MEMBER_COLORS.length],
          role: info.role,
          text: m.body ?? "",
          time: fmtTime(m.created_at),
          createdAt: m.created_at,
          attachment: m.attachment_url
            ? {
                url: m.attachment_url,
                name: m.attachment_name ?? "Attachment",
                type: m.attachment_type ?? "application/octet-stream",
                size: Number(m.attachment_size ?? 0),
              }
            : undefined,
          reactions: {},
          replies: 0,
        };
      }),
    );

    await handleConversationViewed(userId);
    setLoading(false);
  }, [conversationId, currentUser.avatar, currentUser.initials, handleConversationViewed]);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`group-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const sendMessage = async () => {
    if ((!text.trim() && !attachment) || !conversationId) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const body = text.trim();
    const file = attachment;
    setText("");
    setAttachment(null);
    setEmojiOpen(false);

    let uploaded: MessageAttachment | null = null;
    if (file) {
      uploaded = await uploadMessageAttachment(file, session.user.id);
    }

    const { data: sentMessage } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        body: body || uploaded?.name || "",
        attachment_url: uploaded?.url ?? null,
        attachment_name: uploaded?.name ?? null,
        attachment_type: uploaded?.type ?? null,
        attachment_size: uploaded?.size ?? null,
      })
      .select("id")
      .single();

    if (sentMessage?.id) {
      await supabase.rpc("create_message_notifications", {
        p_message_id: sentMessage.id,
      });
    }
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
      {/* Header */}
      <div
        style={{
          background: g.header,
          padding: "12px 16px 14px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate("/app/messages")}
            style={{
              background: "rgba(255,240,196,0.15)",
              border: "none",
              borderRadius: 8,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} color={c.cream} />
          </button>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
              border: `2px solid ${c.cream}50`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={16} color={c.cream} />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 14,
                fontWeight: 700,
                color: c.cream,
                margin: 0,
              }}
            >
              {groupTitle}
            </p>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 11,
                color: c.warmGrayLight,
                margin: 0,
              }}
            >
              {memberCount} members
            </p>
          </div>
          <button
            style={{
              background: "rgba(255,240,196,0.15)",
              border: "none",
              borderRadius: 8,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Settings size={16} color={c.cream} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 14px",
          background: c.creamLight,
        }}
      >
        {/* Date divider */}
        {false && groupMessages.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "8px 0 14px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: isDark
                  ? "rgba(255,232,217,0.14)"
                  : "rgba(139,115,85,0.2)",
              }}
            />
            <div
              style={{
                background: isDark ? "#241118" : c.cream,
                borderRadius: 20,
                padding: "3px 12px",
                border: `1px solid ${isDark ? "rgba(255,232,217,0.16)" : "rgba(139,115,85,0.15)"}`,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 11,
                  color: isDark ? "rgba(255,232,217,0.76)" : c.warmGray,
                }}
              >
                Today
              </span>
            </div>
            <div
              style={{
                flex: 1,
                height: 1,
                background: isDark
                  ? "rgba(255,232,217,0.14)"
                  : "rgba(139,115,85,0.2)",
              }}
            />
          </div>
        )}

        {loading ? (
          <AppLoadingState
            message="Loading messages..."
            detail="Opening this conversation."
            isDark={isDark}
          />
        ) : (
          groupMessages.map((msg, index) => {
            const showSeparator =
              index === 0 ||
              dateKey(msg.createdAt) !==
                dateKey(groupMessages[index - 1].createdAt);
            return (
              <div key={msg.id}>
                {showSeparator && (
                  <DateSeparator label={dateLabel(msg.createdAt)} isDark={isDark} />
                )}
                <GroupMessage msg={msg} isDark={isDark} />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInputBar
        value={text}
        onChange={setText}
        onSend={sendMessage}
        placeholder={`Message ${groupTitle}...`}
        isDark={isDark}
        attachment={attachment}
        onAttachmentChange={setAttachment}
        emojiOpen={emojiOpen}
        onEmojiOpenChange={setEmojiOpen}
      />
    </div>
  );
}
