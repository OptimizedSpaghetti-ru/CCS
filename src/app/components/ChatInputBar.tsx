import type { CSSProperties, KeyboardEvent } from "react";
import { Paperclip, Send, Smile } from "lucide-react";
import { c, fonts, g, shadow } from "../theme";

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  isDark: boolean;
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  placeholder,
  isDark,
}: ChatInputBarProps) {
  const canSend = value.trim().length > 0;
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
        alignItems: "center",
        gap: 8,
        borderTop: `1px solid ${isDark ? "rgba(255,232,217,0.12)" : "rgba(139,115,85,0.12)"}`,
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        className="chat-input-icon-button hover-press"
        aria-label="Attach file"
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
  );
}
