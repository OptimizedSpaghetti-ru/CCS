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
  Send,
  Smile,
  Paperclip,
  Users,
  Laugh,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

interface GroupMsg {
  id: string;
  from: string;
  initials: string;
  color: string;
  role: string;
  text: string;
  time: string;
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

const MEMBER_COLORS = [
  "#7C3AED",
  "#D97706",
  "#059669",
  "#1D4ED8",
  "#EA4335",
  "#374151",
];

function GroupMessage({ msg }: { msg: GroupMsg }) {
  const isMe = msg.from === "Me";
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
          }}
        >
          <span
            style={{
              fontFamily: fonts.ui,
              fontSize: 10,
              fontWeight: 700,
              color: c.white,
            }}
          >
            {msg.initials}
          </span>
        </div>
      )}
      <div style={{ maxWidth: "75%" }}>
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
            padding: "10px 14px",
            boxShadow: shadow.card,
          }}
        >
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: isMe ? c.cream : c.darkBrown,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {msg.text}
          </p>
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
  const { currentUser } = useApp();
  const [text, setText] = useState("");
  const [groupMessages, setGroupMessages] = useState<GroupMsg[]>([]);
  const [groupTitle, setGroupTitle] = useState("Group Chat");
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        `id, title, conversation_members ( user_id, profiles:user_id ( id, full_name, role ) )`,
      )
      .eq("id", conversationId)
      .maybeSingle();

    if (conv) {
      setGroupTitle(conv.title || "Group Chat");
      setMemberCount((conv.conversation_members as any[])?.length ?? 0);
    }

    /* Build a name map from members */
    const nameMap = new Map<string, { name: string; role: string }>();
    for (const m of (conv?.conversation_members as any[]) ?? []) {
      const p = m.profiles;
      nameMap.set(m.user_id, {
        name: m.user_id === userId ? "Me" : p?.full_name || "User",
        role: p?.role || "student",
      });
    }

    /* Messages */
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, body, sender_id, created_at")
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
          color:
            info.name === "Me"
              ? c.darkRed
              : MEMBER_COLORS[i % MEMBER_COLORS.length],
          role: info.role,
          text: m.body,
          time: fmtTime(m.created_at),
          reactions: {},
          replies: 0,
        };
      }),
    );

    setLoading(false);
  }, [conversationId, currentUser.initials]);

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
    if (!text.trim() || !conversationId) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const body = text.trim();
    setText("");
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      body,
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
        {groupMessages.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "8px 0 14px",
            }}
          >
            <div
              style={{ flex: 1, height: 1, background: "rgba(139,115,85,0.2)" }}
            />
            <div
              style={{
                background: c.cream,
                borderRadius: 20,
                padding: "3px 12px",
                border: "1px solid rgba(139,115,85,0.15)",
              }}
            >
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 11,
                  color: c.warmGray,
                }}
              >
                Today
              </span>
            </div>
            <div
              style={{ flex: 1, height: 1, background: "rgba(139,115,85,0.2)" }}
            />
          </div>
        )}

        {loading ? (
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.warmGray,
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            Loading…
          </p>
        ) : (
          groupMessages.map((msg) => <GroupMessage key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          background: c.white,
          padding: "10px 12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderTop: "1px solid rgba(139,115,85,0.12)",
          flexShrink: 0,
        }}
      >
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: c.warmGray,
            padding: 4,
          }}
        >
          <Paperclip size={20} />
        </button>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: c.cream,
            borderRadius: 24,
            padding: "0 12px",
            height: 42,
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={`Message ${groupTitle}…`}
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
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: c.warmGray,
              padding: 0,
            }}
          >
            <Smile size={18} />
          </button>
        </div>
        <button
          onClick={sendMessage}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: text.trim() ? g.button : "rgba(139,115,85,0.2)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: text.trim() ? "pointer" : "default",
            boxShadow: text.trim() ? shadow.button : "none",
          }}
        >
          <Send size={17} color={text.trim() ? c.cream : c.warmGray} />
        </button>
      </div>
    </div>
  );
}
