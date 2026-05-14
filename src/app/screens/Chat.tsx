import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Image,
  FileText,
  Circle,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { AppLoadingState } from "../components/AppLoadingState";
import { ChatInputBar } from "../components/ChatInputBar";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";
import {
  MESSAGE_ROLE_COLORS,
  normalizeMessageRole,
  roleLabel,
} from "../utils/messageRoles";
import {
  formatFileSize,
  isImageAttachment,
  type MessageAttachment,
  uploadMessageAttachment,
} from "../../lib/messageAttachments";

interface ChatMeta {
  name: string;
  role: string;
  initials: string;
  color: string;
  online: boolean;
  otherUserId?: string;
  avatarUrl?: string;
}

interface MsgRow {
  id: string;
  from: "me" | "other";
  text: string;
  time: string;
  type?: string;
  attachment?: MessageAttachment;
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubble({
  msg,
  otherInitials,
  otherAvatarUrl,
  isDark,
}: {
  msg: MsgRow;
  otherInitials: string;
  otherAvatarUrl?: string;
  isDark: boolean;
}) {
  const isMe = msg.from === "me";
  const hasText = msg.text.trim().length > 0;
  const attachmentSurface = isDark ? "#2B161D" : c.cream;
  const attachmentBorder = isDark
    ? "rgba(255,232,217,0.16)"
    : "rgba(139,115,85,0.15)";

  if (msg.type === "file") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: isMe ? "flex-end" : "flex-start",
          marginBottom: 4,
        }}
      >
        <div style={{ maxWidth: "70%" }}>
          <div
            style={{
              background: isMe ? g.sentBubble : c.white,
              borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "10px 14px",
              boxShadow: shadow.card,
            }}
          >
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 13,
                color: isMe ? c.cream : c.darkBrown,
                margin: "0 0 8px",
              }}
            >
              {msg.text}
            </p>
            <div
              style={{
                background: isMe ? "rgba(255,240,196,0.2)" : attachmentSurface,
                borderRadius: 10,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: `1px solid ${isMe ? "rgba(255,240,196,0.3)" : attachmentBorder}`,
              }}
            >
              <FileText size={18} color={isMe ? c.cream : c.baseRed} />
              <div>
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isMe ? c.cream : c.darkBrown,
                    margin: 0,
                  }}
                >
                  ER_Diagram_v2.pdf
                </p>
                <p
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 10,
                    color: isMe ? `${c.cream}80` : c.warmGray,
                    margin: 0,
                  }}
                >
                  248 KB · PDF
                </p>
              </div>
            </div>
          </div>
          <p
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              color: c.warmGray,
              margin: "3px 0 0",
              textAlign: isMe ? "right" : "left",
            }}
          >
            {msg.time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        marginBottom: 4,
      }}
    >
      {!isMe && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: c.warmGray,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {otherAvatarUrl ? (
            <img
              src={otherAvatarUrl}
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
              {otherInitials}
            </span>
          )}
        </div>
      )}
      <div style={{ maxWidth: "72%" }}>
        <div
          style={{
            background: isMe ? g.sentBubble : c.white,
            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            padding: msg.attachment ? 8 : "10px 14px",
            boxShadow: shadow.card,
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
        <p
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: c.warmGray,
            margin: "3px 0 0",
            textAlign: isMe ? "right" : "left",
          }}
        >
          {msg.time}
        </p>
      </div>
    </div>
  );
}

export function Chat() {
  const navigate = useNavigate();
  const { id: conversationId } = useParams();
  const { resolvedThemeMode } = useApp();
  const isDark = resolvedThemeMode === "dark";
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [chat, setChat] = useState<ChatMeta>({
    name: "Loading…",
    role: "student",
    initials: "..",
    color: MESSAGE_ROLE_COLORS.student,
    online: false,
    otherUserId: undefined,
  });
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const markConversationRead = useCallback(
    async (userId: string) => {
      if (!conversationId) return;

      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .is("read_at", null);
    },
    [conversationId],
  );

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    try {
      /* Conversation meta + members */
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select(
          `id, title, is_group,
           conversation_members ( user_id, profiles:user_id ( id, full_name, role, show_online_status, is_online, avatar_url ) )`,
        )
        .eq("id", conversationId)
        .maybeSingle();

      if (conv) {
        const members: any[] = conv.conversation_members ?? [];
        const other = members
          .filter((m: any) => m.user_id !== userId)
          .map((m: any) => m.profiles)[0];
        const name = conv.is_group
          ? conv.title || "Group Chat"
          : other?.full_name || "User";
        const role = conv.is_group ? "group" : normalizeMessageRole(other?.role);
        setChat({
          name,
          role,
          initials: conv.is_group ? "GR" : getInitials(name),
          color:
            role === "group"
              ? MESSAGE_ROLE_COLORS.group
              : MESSAGE_ROLE_COLORS[role],
          online: Boolean(
            other?.show_online_status !== false && other?.is_online,
          ),
          otherUserId: other?.id,
          avatarUrl: other?.avatar_url ?? undefined,
        });
      }

      /* Messages */
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, body, sender_id, created_at, attachment_url, attachment_name, attachment_type, attachment_size")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(
        (msgs ?? []).map((m: any) => ({
          id: m.id,
          from: m.sender_id === userId ? "me" : "other",
          text: m.body ?? "",
          time: fmtTime(m.created_at),
          attachment: m.attachment_url
            ? {
                url: m.attachment_url,
                name: m.attachment_name ?? "Attachment",
                type: m.attachment_type ?? "application/octet-stream",
                size: Number(m.attachment_size ?? 0),
              }
            : undefined,
        })),
      );

      await markConversationRead(userId);
    } finally {
      setLoading(false);
    }
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    loadMessages();

    /* Realtime subscription */
    const channel = supabase
      .channel(`chat-${conversationId}`)
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
  }, [messages]);

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
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
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
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: chat.color,
              border: `2px solid ${c.cream}50`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: fonts.ui,
                fontSize: 13,
                fontWeight: 700,
                color: c.cream,
              }}
            >
              {chat.initials}
            </span>
          </div>
          {chat.online && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#22C55E",
                border: `2px solid ${c.darkestRed}`,
              }}
            />
          )}
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
            {chat.name}
          </p>
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 11,
              color: c.warmGrayLight,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {chat.online ? (
              <Circle size={8} fill="#22C55E" color="#22C55E" />
            ) : (
              <Circle size={8} color={c.warmGrayLight} />
            )}
            {chat.online ? "Active now" : "Offline"}
            <span style={{ opacity: 0.7 }}>·</span>
            {chat.role === "admin" ? (
              <ShieldCheck size={11} />
            ) : chat.role === "faculty" ? (
              <BookOpen size={11} />
            ) : chat.role === "it_support" ? (
              <Wrench size={11} />
            ) : (
              <GraduationCap size={11} />
            )}
            {roleLabel(chat.role)}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          background: c.creamLight,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Date divider */}
        {messages.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "4px 0 8px",
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
                {(() => {
                  const first = messages[0];
                  if (!first) return "Today";
                  const raw = first.time;
                  // time was formatted via fmtTime so parse from original — fallback to "Today"
                  const d = new Date();
                  const now = new Date();
                  const diffDays = Math.floor(
                    (now.getTime() - d.getTime()) / 86_400_000,
                  );
                  if (diffDays === 0) return "Today";
                  if (diffDays === 1) return "Yesterday";
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                })()}
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
        ) : messages.length === 0 ? (
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.warmGray,
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              otherInitials={chat.initials}
              otherAvatarUrl={chat.avatarUrl}
              isDark={isDark}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInputBar
        value={text}
        onChange={setText}
        onSend={sendMessage}
        placeholder="Type a message..."
        isDark={isDark}
        attachment={attachment}
        onAttachmentChange={setAttachment}
        emojiOpen={emojiOpen}
        onEmojiOpenChange={setEmojiOpen}
      />
    </div>
  );
}
