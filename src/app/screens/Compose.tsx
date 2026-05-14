import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { X, Search, Paperclip, Image, Send, Smile, FileText } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";
import {
  formatFileSize,
  isImageAttachment,
  uploadMessageAttachment,
  type MessageAttachment,
} from "../../lib/messageAttachments";
import {
  MESSAGE_ROLE_COLORS,
  normalizeMessageRole,
  roleLabel,
} from "../utils/messageRoles";

interface Suggestion {
  id: string;
  name: string;
  role: string;
  department: string;
  initials: string;
  color: string;
}

const EMOJIS = ["😀", "😂", "😊", "😍", "👍", "👏", "🙏", "🔥", "✨", "❤️", "🎉", "📌", "✅", "💡", "📚", "🛠️"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Compose() {
  const navigate = useNavigate();
  const { currentUser, showToast, resolvedThemeMode } = useApp();
  const isDark = resolvedThemeMode === "dark";
  const panelSurface = isDark ? "#1F0F14" : c.white;
  const fieldSurface = isDark ? "#2A141A" : c.cream;
  const dropdownSurface = isDark ? "#241118" : c.white;
  const dividerColor = isDark
    ? "rgba(255,232,217,0.14)"
    : "rgba(139,115,85,0.12)";
  const fieldBorder = isDark
    ? "rgba(255,232,217,0.34)"
    : "rgba(139,115,85,0.2)";
  const primaryText = c.darkBrown;
  const secondaryText = isDark ? "rgba(255,232,217,0.74)" : c.warmGray;
  const chipSurface = isDark ? "rgba(143,39,52,0.28)" : `${c.baseRed}18`;
  const chipBorder = isDark ? "rgba(255,232,217,0.18)" : `${c.baseRed}30`;
  const placeholderColor = isDark
    ? "rgba(255,232,217,0.72)"
    : "rgba(45,27,14,0.55)";
  const [toSearch, setToSearch] = useState("");
  const [recipients, setRecipients] = useState<Suggestion[]>([]);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sending, setSending] = useState(false);

  /* search users in DB when toSearch changes */
  useEffect(() => {
    if (toSearch.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role, department")
        .neq("id", currentUser.id)
        .eq("status", "approved")
        .ilike("full_name", `%${toSearch.trim()}%`)
        .limit(10);
      if (data) {
        setSuggestions(
          data.map((p: any) => {
            const role = normalizeMessageRole(p.role);
            const department =
              typeof p.department === "string" && p.department.trim()
                ? p.department
                : role === "admin" || role === "faculty" || role === "it_support"
                  ? "College of Computer Studies"
                  : "";
            return {
              id: p.id,
              name: p.full_name ?? "User",
              role,
              department,
              initials: getInitials(p.full_name ?? "U"),
              color: MESSAGE_ROLE_COLORS[role],
            };
          }),
        );
      }
    }, 300);
    return () => clearTimeout(t);
  }, [toSearch, currentUser.id]);

  const filteredSuggestions = suggestions.filter(
    (s) => !recipients.find((r) => r.id === s.id),
  );

  const addRecipient = (person: Suggestion) => {
    setRecipients((prev) => [...prev, person]);
    setToSearch("");
    setShowSuggestions(false);
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSend = useCallback(async () => {
    if (recipients.length === 0 || (!body.trim() && !attachment) || sending) return;
    setSending(true);
    try {
      const isGroup = recipients.length > 1;
      let convId: string | null = null;

      /* For 1-on-1 chats, check if a conversation already exists */
      if (!isGroup) {
        const otherUserId = recipients[0].id;

        /* Get my conversation IDs */
        const { data: myConvos } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", currentUser.id);

        if (myConvos && myConvos.length > 0) {
          const myConvoIds = myConvos.map((m: any) => m.conversation_id);

          /* Find which of those the other user is also in */
          const { data: otherConvos } = await supabase
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", otherUserId)
            .in("conversation_id", myConvoIds);

          if (otherConvos && otherConvos.length > 0) {
            const sharedIds = otherConvos.map((m: any) => m.conversation_id);

            /* Check which shared conversations are NOT groups */
            const { data: directConvos } = await supabase
              .from("conversations")
              .select("id")
              .in("id", sharedIds)
              .eq("is_group", false)
              .limit(1);

            if (directConvos && directConvos.length > 0) {
              convId = directConvos[0].id;
            }
          }
        }
      }

      /* Create a new conversation only if one doesn't exist */
      if (!convId) {
        const { data: conv, error: convErr } = await supabase
          .from("conversations")
          .insert({
            title: isGroup
              ? recipients.map((r) => r.name.split(" ")[0]).join(", ")
              : null,
            is_group: isGroup,
            created_by: currentUser.id,
          })
          .select("id")
          .single();
        if (convErr || !conv) throw convErr;
        convId = conv.id;

        /* add members (including self) */
        const members = [
          { conversation_id: convId, user_id: currentUser.id },
          ...recipients.map((r) => ({
            conversation_id: convId!,
            user_id: r.id,
          })),
        ];
        await supabase.from("conversation_members").insert(members);
      }

      let uploaded: MessageAttachment | null = null;
      if (attachment) {
        uploaded = await uploadMessageAttachment(attachment, currentUser.id);
      }

      /* send first message */
      const { data: sentMessage, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          sender_id: currentUser.id,
          body: body.trim() || uploaded?.name || "",
          attachment_url: uploaded?.url ?? null,
          attachment_name: uploaded?.name ?? null,
          attachment_type: uploaded?.type ?? null,
          attachment_size: uploaded?.size ?? null,
        })
        .select("id")
        .single();

      if (messageError) throw messageError;
      if (sentMessage?.id) {
        await supabase.rpc("create_message_notifications", {
          p_message_id: sentMessage.id,
        });
      }

      /* navigate to the conversation */
      if (isGroup) {
        navigate(`/app/messages/group/${convId}`, { replace: true });
      } else {
        navigate(`/app/messages/${convId}`, { replace: true });
      }
    } catch (err: any) {
      showToast({
        type: "message",
        title: "Send failed",
        preview: err?.message ?? "Something went wrong",
        time: "now",
      });
    } finally {
      setSending(false);
    }
  }, [recipients, body, attachment, sending, currentUser.id, navigate, showToast]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: panelSurface,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: g.header,
          padding: "12px 16px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 20,
            fontWeight: 700,
            color: c.cream,
            margin: 0,
          }}
        >
          New Message
        </h1>
        <button
          onClick={() => navigate("/app/messages")}
          style={{
            background: "rgba(255,240,196,0.2)",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={18} color={c.cream} />
        </button>
      </div>

      {/* To: field */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${dividerColor}`,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            minHeight: 42,
          }}
        >
          <span
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              color: secondaryText,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            To:
          </span>

          {recipients.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: chipSurface,
                border: `1px solid ${chipBorder}`,
                borderRadius: 20,
                padding: "3px 8px 3px 4px",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: r.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 9,
                    fontWeight: 700,
                    color: c.cream,
                  }}
                >
                  {r.initials}
                </span>
              </div>
              <span
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  fontWeight: 500,
                  color: primaryText,
                }}
              >
                {r.name.split(" ")[0]}
              </span>
              <button
                onClick={() => removeRecipient(r.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  color: secondaryText,
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}

          <input
            className="auth-input"
            value={toSearch}
            onChange={(e) => {
              setToSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={
              recipients.length === 0 ? "Search people or roles..." : ""
            }
            style={{
              flex: 1,
              minWidth: 120,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: fonts.ui,
              fontSize: 13,
              color: primaryText,
              ["--auth-placeholder-color" as string]: placeholderColor,
            }}
          />
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: dropdownSurface,
              boxShadow: shadow.cardHover,
              borderRadius: "0 0 14px 14px",
              zIndex: 50,
              overflow: "hidden",
              transformOrigin: "top center",
              animation: "dropdown-pop-in 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
              border: `1px solid ${isDark ? "rgba(255,232,217,0.16)" : "transparent"}`,
            }}
          >
            {filteredSuggestions.map((s) => (
              <button
                className="hover-row"
                key={s.id}
                onClick={() => addRecipient(s)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  borderBottom: `1px solid ${isDark ? "rgba(255,232,217,0.1)" : "rgba(139,115,85,0.08)"}`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition:
                    "background-color 0.18s ease, transform 0.16s ease, filter 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: s.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: `2px solid ${c.baseRed}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 12,
                      fontWeight: 700,
                      color: c.cream,
                    }}
                  >
                    {s.initials}
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      fontWeight: 600,
                      color: primaryText,
                      margin: 0,
                    }}
                  >
                    {s.name}
                  </p>
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 11,
                      color: secondaryText,
                      margin: 0,
                    }}
                  >
                    {roleLabel(s.role)}
                    {s.department ? ` · ${s.department}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subject */}
      <div
        style={{
          padding: "0 16px",
          borderBottom: `1px solid ${dividerColor}`,
        }}
      >
        <input
          className="auth-input"
          placeholder="Subject (optional)"
          style={{
            width: "100%",
            height: 44,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: fonts.ui,
            fontSize: 13,
            color: primaryText,
            boxSizing: "border-box",
            ["--auth-placeholder-color" as string]: placeholderColor,
          }}
        />
      </div>

      {/* Message body */}
      <div style={{ flex: 1, padding: "12px 16px", overflow: "hidden" }}>
        <textarea
          className="auth-input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message…"
          style={{
            width: "100%",
            height: "100%",
            background: fieldSurface,
            border: `1.5px solid ${fieldBorder}`,
            borderRadius: 12,
            padding: "14px",
            outline: "none",
            fontFamily: fonts.ui,
            fontSize: 14,
            color: primaryText,
            resize: "none",
            lineHeight: 1.6,
            boxSizing: "border-box",
            ["--auth-placeholder-color" as string]: placeholderColor,
          }}
        />
      </div>

      {/* Bottom actions */}
      <div
        style={{
          padding: "10px 16px 16px",
          borderTop: `1px solid ${dividerColor}`,
          flexShrink: 0,
        }}
      >
        {emojiOpen && (
          <div
            className="emoji-picker-panel"
            style={{
              background: dropdownSurface,
              borderColor: fieldBorder,
              boxShadow: shadow.cardHover,
              marginBottom: 10,
            }}
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="hover-press"
                onClick={() => setBody((prev) => `${prev}${emoji}`)}
                style={{
                  width: 34,
                  height: 34,
                  border: "none",
                  borderRadius: 10,
                  background: isDark ? "rgba(255,232,217,0.08)" : c.creamLight,
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        {attachment && (
          <div
            className="message-attachment-preview"
            style={{
              background: fieldSurface,
              borderColor: fieldBorder,
              marginBottom: 10,
            }}
          >
            {isImageAttachment(attachment.type, attachment.name) ? (
              <img
                src={URL.createObjectURL(attachment)}
                alt=""
                style={{
                  width: 42,
                  height: 42,
                  objectFit: "cover",
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: `${c.baseRed}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={19} color={c.baseRed} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  fontWeight: 700,
                  color: primaryText,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {attachment.name}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: secondaryText,
                }}
              >
                {formatFileSize(attachment.size)}
              </p>
            </div>
            <button
              type="button"
              aria-label="Remove attachment"
              onClick={() => setAttachment(null)}
              className="hover-press"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "none",
                background: isDark
                  ? "rgba(255,232,217,0.1)"
                  : "rgba(139,115,85,0.12)",
                color: primaryText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {/* Attachment row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            id="compose-file-input"
            type="file"
            style={{ display: "none" }}
            onChange={(event) => {
              setAttachment(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
          <input
            id="compose-image-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(event) => {
              setAttachment(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
          {[
            {
              icon: <Paperclip size={16} />,
              label: "File",
              onClick: () => document.getElementById("compose-file-input")?.click(),
            },
            {
              icon: <Image size={16} />,
              label: "Image",
              onClick: () => document.getElementById("compose-image-input")?.click(),
            },
            {
              icon: <Smile size={16} />,
              label: "Emoji",
              onClick: () => setEmojiOpen((open) => !open),
            },
          ].map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: fieldSurface,
                border: `1px solid ${fieldBorder}`,
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                fontFamily: fonts.ui,
                fontSize: 12,
                color: secondaryText,
              }}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || recipients.length === 0 || (!body.trim() && !attachment)}
          style={{
            width: "100%",
            height: 52,
            background:
              recipients.length > 0 && (body.trim() || attachment)
                ? g.button
                : "rgba(139,115,85,0.2)",
            border: "none",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor:
              recipients.length > 0 && (body.trim() || attachment) && !sending
                ? "pointer"
                : "default",
            fontFamily: fonts.ui,
            fontSize: 15,
            fontWeight: 600,
            color: recipients.length > 0 && (body.trim() || attachment) ? c.cream : c.warmGray,
            boxShadow:
              recipients.length > 0 && (body.trim() || attachment) ? shadow.button : "none",
            opacity: sending ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          <Send size={18} />
          {sending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </div>
  );
}
