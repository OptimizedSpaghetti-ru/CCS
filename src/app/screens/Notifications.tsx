import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  MessageSquare,
  Megaphone,
  Calendar,
  Trash2,
  CheckCircle,
  Settings,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { TopBar } from "../components/TopBar";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

const tabs = ["All", "Messages", "Announcements", "Events"];

interface Notif {
  id: string;
  type: "message" | "announcement" | "event";
  title: string;
  body: string;
  time: string;
  unread: boolean;
  day: string;
  path?: string;
}

const typeConfig = {
  message: { icon: MessageSquare, color: c.baseRed, label: "Message" },
  announcement: { icon: Megaphone, color: "#D97706", label: "Announcement" },
  event: { icon: Calendar, color: "#1D4ED8", label: "Event" },
};

function NotifItem({
  notif,
  onDismiss,
}: {
  notif: Notif;
  onDismiss: (id: string) => void;
}) {
  const navigate = useNavigate();
  const conf = typeConfig[notif.type] ?? typeConfig.announcement;
  const Icon = conf.icon;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 16px",
        background: notif.unread ? c.cream : c.white,
        borderBottom: "1px solid rgba(139,115,85,0.08)",
        cursor: "pointer",
        position: "relative",
        borderLeft: notif.unread
          ? `3px solid ${conf.color}`
          : "3px solid transparent",
      }}
      onClick={() => {
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
          </span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notif.id);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: c.warmGrayLight,
          padding: 4,
          flexShrink: 0,
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function Notifications() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState("All");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadNotifs = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      // Fetch read/dismissed status for current user
      const ids = data.map((n: any) => n.id);
      const { data: statuses } = await supabase
        .from("notification_status")
        .select("notification_id, read_at, dismissed_at")
        .eq("user_id", currentUser.id)
        .in("notification_id", ids);
      const statusMap = new Map(
        (statuses ?? []).map((s: any) => [s.notification_id, s]),
      );
      setNotifs(
        data
          .filter((n: any) => !statusMap.get(n.id)?.dismissed_at)
          .map((n: any) => ({
            id: n.id,
            type: (["message", "announcement", "event"].includes(n.type)
              ? n.type
              : "announcement") as Notif["type"],
            title: n.title,
            body: n.body,
            time: fmtTime(n.created_at),
            unread: !statusMap.get(n.id)?.read_at,
            day: dayLabel(n.created_at),
          })),
      );
    }
    setLoading(false);
  }, [currentUser.id]);

  useEffect(() => {
    loadNotifs();

    const channel = supabase
      .channel("notifs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
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
        : activeTab === "Announcements"
          ? n.type === "announcement"
          : n.type === "event",
  );

  const grouped = filtered.reduce(
    (acc, n) => {
      if (!acc[n.day]) acc[n.day] = [];
      acc[n.day].push(n);
      return acc;
    },
    {} as Record<string, Notif[]>,
  );

  const dismiss = async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    await supabase
      .from("notification_status")
      .upsert(
        {
          notification_id: id,
          user_id: currentUser.id,
          dismissed_at: new Date().toISOString(),
        },
        { onConflict: "notification_id,user_id" },
      );
  };

  const markAllRead = async () => {
    const unreadIds = notifs.filter((n) => n.unread).map((n) => n.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (unreadIds.length > 0) {
      const rows = unreadIds.map((nid) => ({
        notification_id: nid,
        user_id: currentUser.id,
        read_at: new Date().toISOString(),
      }));
      await supabase
        .from("notification_status")
        .upsert(rows, { onConflict: "notification_id,user_id" });
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
      <TopBar
        title="Notifications"
        rightContent={
          <div style={{ display: "flex", gap: 6 }}>
            <button
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
      <div style={{ background: c.darkestRed, padding: "8px 14px 10px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background:
                  activeTab === tab ? g.button : "rgba(255,240,196,0.12)",
                border:
                  activeTab === tab
                    ? "none"
                    : "1px solid rgba(255,240,196,0.15)",
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
        {Object.entries(grouped).length === 0 ? (
          <div style={{ padding: "60px 32px", textAlign: "center" }}>
            <Bell
              size={48}
              color={c.warmGray}
              style={{ opacity: 0.4, marginBottom: 16 }}
            />
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
          Object.entries(grouped).map(([day, dayNotifs]) => (
            <div key={day}>
              <div
                style={{ padding: "10px 16px 6px", background: c.creamLight }}
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
              {dayNotifs.map((n) => (
                <NotifItem key={n.id} notif={n} onDismiss={dismiss} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
