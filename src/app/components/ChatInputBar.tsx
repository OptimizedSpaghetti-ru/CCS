import type { CSSProperties, KeyboardEvent } from "react";
import { FileText, Paperclip, Send, Smile, X } from "lucide-react";
import { c, fonts, g, shadow } from "../theme";
import { formatFileSize, isImageAttachment } from "../../lib/messageAttachments";

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  isDark: boolean;
  attachment?: File | null;
  onAttachmentChange?: (file: File | null) => void;
  emojiOpen?: boolean;
  onEmojiOpenChange?: (open: boolean) => void;
}

const EMOJIS = ["😀", "😂", "😊", "😍", "👍", "👏", "🙏", "🔥", "✨", "❤️", "🎉", "📌", "✅", "💡", "📚", "🛠️"];

export function ChatInputBar({
  value,
  onChange,
  onSend,
  placeholder,
  isDark,
  attachment,
  onAttachmentChange,
  emojiOpen = false,
  onEmojiOpenChange,
}: ChatInputBarProps) {
  const canSend = value.trim().length > 0 || Boolean(attachment);
  const shellStyle = {
    "--chat-input-bg": isDark ? "#2B161D" : c.cream,
    "--chat-input-bg-focus": isDark ? "#331B23" : "#FFFFFF",
    "--chat-input-border": isDark
      ? "rgba(255,232,217,0.16)"
      : "rgba(139,115,85,0.18)",
    "--chat-input-border-focus": isDark
      ? "rgba(255,232,217,0.34)"
      : "rgba(140,16,7,0.36)",
    "--chat-input-text": isDark ? "#FFEFE6" : c.darkBrown,
    "--chat-input-placeholder": isDark
      ? "rgba(255,232,217,0.58)"
      : "rgba(45,27,14,0.48)",
    "--chat-input-caret": isDark ? "#FFF0C4" : "#8C1007",
    "--chat-input-icon": isDark ? "rgba(255,232,217,0.76)" : c.warmGray,
  } as CSSProperties & Record<string, string>;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div
      style={{
        background: isDark ? "#190A0E" : c.white,
        padding: "10px 12px calc(12px + env(safe-area-inset-bottom))",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        gap: 8,
        borderTop: `1px solid ${isDark ? "rgba(255,232,217,0.12)" : "rgba(139,115,85,0.12)"}`,
        flexShrink: 0,
      }}
    >
      {emojiOpen && (
        <div
          className="emoji-picker-panel"
          style={{
            background: isDark ? "#241118" : c.white,
            borderColor: isDark
              ? "rgba(255,232,217,0.16)"
              : "rgba(139,115,85,0.14)",
            boxShadow: shadow.cardHover,
          }}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="hover-press"
              onClick={() => onChange(`${value}${emoji}`)}
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
            background: isDark ? "#2B161D" : c.cream,
            borderColor: isDark
              ? "rgba(255,232,217,0.16)"
              : "rgba(139,115,85,0.16)",
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
                color: c.darkBrown,
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
                color: c.warmGray,
              }}
            >
              {formatFileSize(attachment.size)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Remove attachment"
            onClick={() => onAttachmentChange?.(null)}
            className="hover-press"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "none",
              background: isDark
                ? "rgba(255,232,217,0.1)"
                : "rgba(139,115,85,0.12)",
              color: c.darkBrown,
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
      <input
        type="file"
        id="chat-attachment-input"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          onAttachmentChange?.(file);
          event.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        className="chat-input-icon-button hover-press"
        aria-label="Attach file"
        onClick={() => document.getElementById("chat-attachment-input")?.click()}
        style={{
          color: isDark ? "rgba(255,232,217,0.78)" : c.warmGray,
        }}
      >
        <Paperclip size={20} />
      </button>
      <div className="chat-input-shell" style={shellStyle}>
        <input
          className="chat-input-field"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            fontFamily: fonts.ui,
            fontSize: 14,
            lineHeight: 1.4,
          }}
        />
        <button
          type="button"
          className="chat-input-icon-button hover-press"
          aria-label="Open emoji picker"
          onClick={() => onEmojiOpenChange?.(!emojiOpen)}
          style={{ color: "var(--chat-input-icon)" }}
        >
          <Smile size={18} />
        </button>
      </div>
      <button
        type="button"
        className="hover-press"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: canSend
            ? g.button
            : isDark
              ? "rgba(255,232,217,0.12)"
              : "rgba(139,115,85,0.18)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: canSend ? "pointer" : "default",
          boxShadow: canSend ? shadow.button : "none",
          opacity: canSend ? 1 : 0.88,
          flexShrink: 0,
          transition:
            "background 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, transform 0.16s ease",
        }}
      >
        <Send
          size={17}
          color={canSend ? c.cream : isDark ? "rgba(255,232,217,0.52)" : c.warmGray}
        />
      </button>
      </div>
    </div>
  );
}
