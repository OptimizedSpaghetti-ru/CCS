import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Megaphone,
  Calendar,
  AlertCircle,
  X,
} from "lucide-react";
import { c, fonts, shadow } from "../theme";
import { useApp, ToastData } from "../context/AppContext";

const typeConfig = {
  message: { icon: MessageSquare, color: c.baseRed },
  announcement: { icon: Megaphone, color: "#D97706" },
  event: { icon: Calendar, color: "#1D4ED8" },
  error: { icon: AlertCircle, color: "#DC2626" },
};

function ToastItem({ toast }: { toast: ToastData }) {
  const { dismissToast } = useApp();
  const [progress, setProgress] = useState(100);
  const config = typeConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const start = Date.now();
    const duration = 4000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ y: -80, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -80, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        background: c.white,
        borderRadius: 16,
        boxShadow: shadow.toast,
        borderLeft: `4px solid ${config.color}`,
        overflow: "hidden",
        marginBottom: 8,
        cursor: "pointer",
      }}
      onClick={() => dismissToast(toast.id)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px 10px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${config.color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={config.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              fontWeight: 600,
              color: c.darkBrown,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {toast.title}
          </p>
          <p
            style={{
              fontFamily: fonts.ui,
              fontSize: 11,
              color: c.warmGray,
              margin: "2px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {toast.preview}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <span
            style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray }}
          >
            {toast.time}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(toast.id);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={14} color={c.warmGray} />
          </button>
        </div>
      </div>
      <div style={{ height: 3, background: "rgba(0,0,0,0.06)" }}>
        <motion.div
          style={{
            height: "100%",
            background: config.color,
            transformOrigin: "left",
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  );
}

export function ToastOverlay() {
  const { toasts } = useApp();

  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        left: 12,
        right: 12,
        zIndex: 100,
        pointerEvents: toasts.length > 0 ? "all" : "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
