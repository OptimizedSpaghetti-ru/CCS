import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Megaphone,
  Send,
  MapPinned,
  Loader2,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

/* ── Types ──────────────────────────────────────────── */

type PendingProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "student" | "faculty" | "admin";
  status: "pending" | "approved" | "rejected";
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  target_role: string | null;
  created_at: string;
  created_by: string | null;
  author_name?: string;
};

type CampusLocation = {
  id: number;
  name: string;
  category: string;
  floor: string | null;
  building: string | null;
  icon_key: string | null;
  color: string | null;
  latitude: number | null;
  longitude: number | null;
};

/* ── Helpers ────────────────────────────────────────── */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Shared input style ─────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: c.cream,
  border: "2px solid transparent",
  borderRadius: 10,
  padding: "12px 14px",
  fontFamily: fonts.ui,
  fontSize: 13,
  color: c.darkBrown,
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  cursor: "pointer",
};

/* ── Component ──────────────────────────────────────── */

export function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  /* ---------- State ---------- */
  const [pendingUsers, setPendingUsers] = useState<PendingProfile[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementTargetRole, setAnnouncementTargetRole] = useState<
    "student" | "faculty" | "admin" | ""
  >("");

  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<
    "student" | "faculty" | "admin" | ""
  >("student");

  const [locationForm, setLocationForm] = useState({
    name: "",
    category: "",
    floor: "",
    building: "",
    latitude: "",
    longitude: "",
  });

  const [activeTab, setActiveTab] = useState<
    "announcements" | "users" | "broadcast" | "locations"
  >("announcements");

  /* ---------- Data loading ---------- */
  const loadAdminData = async () => {
    setIsLoading(true);
    setError("");

    const [pendingResult, locationResult, notifResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, role, status")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("campus_locations")
        .select(
          "id, name, category, floor, building, icon_key, color, latitude, longitude",
        )
        .order("name", { ascending: true }),
      supabase
        .from("notifications")
        .select("id, title, body, type, target_role, created_at, created_by")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (pendingResult.error || locationResult.error) {
      setError(
        pendingResult.error?.message ??
          locationResult.error?.message ??
          "Failed to load admin data.",
      );
      setIsLoading(false);
      return;
    }

    setPendingUsers((pendingResult.data ?? []) as PendingProfile[]);
    setLocations((locationResult.data ?? []) as CampusLocation[]);

    /* Resolve author names for announcements */
    const rawNotifs = (notifResult.data ?? []) as AnnouncementRow[];
    const authorIds = [
      ...new Set(rawNotifs.map((n) => n.created_by).filter(Boolean)),
    ];
    let authorsMap: Record<string, string> = {};
    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", authorIds);
      if (authors) {
        authorsMap = Object.fromEntries(
          authors.map((a: any) => [a.id, a.full_name ?? "Admin"]),
        );
      }
    }
    setAnnouncements(
      rawNotifs.map((n) => ({
        ...n,
        author_name: n.created_by
          ? (authorsMap[n.created_by] ?? "Admin")
          : "System",
      })),
    );

    setIsLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  /* ---------- Actions ---------- */
  const reviewUser = async (
    userId: string,
    status: "approved" | "rejected",
  ) => {
    setIsSaving(true);
    setError("");
    setFeedback("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        status,
        approved_by: currentUser.id || null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", userId)
      .eq("status", "pending");

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    setFeedback(
      `User ${status === "approved" ? "approved" : "rejected"} successfully.`,
    );
    await loadAdminData();
    setIsSaving(false);
  };

  const postNotification = async (type: "announcement" | "broadcast") => {
    const title =
      type === "announcement" ? announcementTitle.trim() : "Broadcast Message";
    const body =
      type === "announcement" ? announcementBody.trim() : broadcastBody.trim();
    const targetRole =
      type === "announcement" ? announcementTargetRole : broadcastTargetRole;

    if (!body || (type === "announcement" && !title)) {
      setError("Fill in the required announcement or broadcast fields.");
      return;
    }

    setIsSaving(true);
    setError("");
    setFeedback("");

    const { error: insertError } = await supabase.from("notifications").insert({
      type,
      title,
      body,
      target_role: targetRole || null,
      created_by: currentUser.id || null,
    });

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    if (type === "announcement") {
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setAnnouncementTargetRole("");
    } else {
      setBroadcastBody("");
      setBroadcastTargetRole("student");
    }

    setFeedback(
      `${type === "announcement" ? "Announcement" : "Broadcast"} posted.`,
    );
    await loadAdminData();
    setIsSaving(false);
  };

  const addLocation = async () => {
    if (!locationForm.name.trim() || !locationForm.category.trim()) {
      setError("Location name and category are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setFeedback("");

    const latitude = locationForm.latitude
      ? Number(locationForm.latitude)
      : null;
    const longitude = locationForm.longitude
      ? Number(locationForm.longitude)
      : null;

    const { error: insertError } = await supabase
      .from("campus_locations")
      .insert({
        name: locationForm.name.trim(),
        category: locationForm.category.trim(),
        floor: locationForm.floor.trim() || null,
        building: locationForm.building.trim() || null,
        latitude: Number.isNaN(latitude) ? null : latitude,
        longitude: Number.isNaN(longitude) ? null : longitude,
      });

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setLocationForm({
      name: "",
      category: "",
      floor: "",
      building: "",
      latitude: "",
      longitude: "",
    });
    setFeedback("Campus location added.");
    await loadAdminData();
    setIsSaving(false);
  };

  /* ---------- Tab config ---------- */
  const tabs = [
    { key: "announcements" as const, label: "Announce" },
    {
      key: "users" as const,
      label: `Users${pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ""}`,
    },
    { key: "broadcast" as const, label: "Broadcast" },
    { key: "locations" as const, label: "Map" },
  ];

  /* ---------- Render ---------- */
  return (
    <div style={{ flex: 1, overflowY: "auto", background: c.creamLight }}>
      {/* ═══ Header ═══ */}
      <div
        style={{
          background: g.header,
          padding: "16px 20px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,240,196,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255,240,196,0.04)",
          }}
        />

        <p
          style={{
            margin: 0,
            fontFamily: fonts.ui,
            fontSize: 11,
            color: c.warmGrayLight,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          College of Computer Studies — OLFU
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 4,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: fonts.display,
              fontSize: 26,
              fontWeight: 700,
              color: c.cream,
            }}
          >
            Admin Panel
          </h1>
          <div
            style={{
              background: "rgba(59,82,128,0.7)",
              borderRadius: 20,
              padding: "3px 9px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Shield size={10} color={c.white} />
            <span
              style={{
                fontFamily: fonts.ui,
                fontSize: 9,
                fontWeight: 700,
                color: c.white,
              }}
            >
              Admin
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 16,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1,
                background:
                  activeTab === t.key ? g.button : "rgba(255,240,196,0.12)",
                border:
                  activeTab === t.key
                    ? "none"
                    : "1px solid rgba(255,240,196,0.15)",
                borderRadius: 10,
                padding: "7px 0",
                fontFamily: fonts.ui,
                fontSize: 11,
                fontWeight: 600,
                color: activeTab === t.key ? c.cream : c.warmGrayLight,
                cursor: "pointer",
                boxShadow: activeTab === t.key ? shadow.button : "none",
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div
        style={{
          padding: "16px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Global feedback / error */}
        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#B91C1C",
                fontFamily: fonts.ui,
                fontSize: 12,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {feedback && (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#15803D",
                fontFamily: fonts.ui,
                fontSize: 12,
              }}
            >
              {feedback}
            </p>
          </div>
        )}

        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "32px 0",
            }}
          >
            <Loader2
              size={18}
              color={c.warmGray}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span
              style={{ fontFamily: fonts.ui, fontSize: 13, color: c.warmGray }}
            >
              Loading…
            </span>
          </div>
        )}

        {/* ─── Announcements Tab ─── */}
        {activeTab === "announcements" && !isLoading && (
          <>
            {/* Compose card */}
            <div>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.warmGray,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  margin: "0 0 8px 2px",
                }}
              >
                Compose Announcement
              </p>
              <div
                style={{
                  background: c.white,
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: "0 4px 24px rgba(94,16,16,0.10)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <input
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement title"
                    style={inputStyle}
                  />
                  <textarea
                    value={announcementBody}
                    onChange={(e) => setAnnouncementBody(e.target.value)}
                    placeholder="Write your announcement message…"
                    style={{
                      ...inputStyle,
                      minHeight: 120,
                      resize: "none" as const,
                      lineHeight: 1.6,
                    }}
                  />
                  <div style={{ position: "relative" }}>
                    <select
                      value={announcementTargetRole}
                      onChange={(e) =>
                        setAnnouncementTargetRole(
                          e.target.value as
                            | "student"
                            | "faculty"
                            | "admin"
                            | "",
                        )
                      }
                      style={selectStyle}
                    >
                      <option value="">All roles</option>
                      <option value="student">Students only</option>
                      <option value="faculty">Faculty only</option>
                      <option value="admin">Admins only</option>
                    </select>
                    <ChevronDown
                      size={14}
                      color={c.warmGray}
                      style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => postNotification("announcement")}
                    disabled={isSaving}
                    style={{
                      width: "100%",
                      height: 48,
                      border: "none",
                      borderRadius: 12,
                      background: g.button,
                      color: c.cream,
                      fontFamily: fonts.ui,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isSaving ? "default" : "pointer",
                      boxShadow: shadow.button,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity: isSaving ? 0.6 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <Megaphone size={16} />
                    {isSaving ? "Publishing…" : "Publish Announcement"}
                  </button>
                </div>
              </div>
            </div>

            {/* Announcements list */}
            <div>
              <p
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.warmGray,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  margin: "0 0 8px 2px",
                }}
              >
                Recent Announcements
              </p>

              {announcements.length === 0 ? (
                <div
                  style={{
                    background: c.white,
                    borderRadius: 16,
                    padding: "40px 20px",
                    boxShadow: shadow.card,
                    textAlign: "center",
                  }}
                >
                  <Megaphone
                    size={40}
                    color={c.warmGray}
                    style={{ opacity: 0.3, marginBottom: 12 }}
                  />
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 14,
                      color: c.warmGray,
                      margin: 0,
                    }}
                  >
                    No announcements yet
                  </p>
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 12,
                      color: c.warmGrayLight,
                      margin: "4px 0 0",
                    }}
                  >
                    Create your first announcement above
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      style={{
                        background: c.white,
                        borderRadius: 14,
                        padding: "14px 16px",
                        boxShadow: shadow.card,
                        borderLeft: `4px solid ${c.baseRed}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontFamily: fonts.ui,
                              fontSize: 14,
                              fontWeight: 700,
                              color: c.darkBrown,
                              margin: 0,
                            }}
                          >
                            {ann.title}
                          </p>
                          <p
                            style={{
                              fontFamily: fonts.ui,
                              fontSize: 12,
                              color: c.warmGray,
                              margin: "6px 0 0",
                              lineHeight: 1.5,
                            }}
                          >
                            {ann.body}
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: "1px solid rgba(139,115,85,0.08)",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: fonts.ui,
                            fontSize: 11,
                            color: c.warmGrayLight,
                            margin: 0,
                          }}
                        >
                          Posted by{" "}
                          <span style={{ fontWeight: 600, color: c.warmGray }}>
                            {ann.author_name}
                          </span>
                          {ann.target_role && (
                            <span
                              style={{
                                marginLeft: 6,
                                background: `${c.baseRed}15`,
                                color: c.baseRed,
                                borderRadius: 20,
                                padding: "1px 6px",
                                fontSize: 9,
                                fontWeight: 600,
                              }}
                            >
                              {ann.target_role}
                            </span>
                          )}
                        </p>
                        <p
                          style={{
                            fontFamily: fonts.mono,
                            fontSize: 10,
                            color: c.warmGrayLight,
                            margin: 0,
                          }}
                        >
                          {timeAgo(ann.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── User Verification Tab ─── */}
        {activeTab === "users" && !isLoading && (
          <div>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 10,
                fontWeight: 700,
                color: c.warmGray,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                margin: "0 0 8px 2px",
              }}
            >
              Pending Accounts
            </p>
            <div
              style={{
                background: c.white,
                borderRadius: 16,
                boxShadow: shadow.card,
                overflow: "hidden",
              }}
            >
              {pendingUsers.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <Users
                    size={36}
                    color={c.warmGray}
                    style={{ opacity: 0.3, marginBottom: 10 }}
                  />
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      color: c.warmGray,
                      margin: 0,
                    }}
                  >
                    No pending users
                  </p>
                </div>
              ) : (
                pendingUsers.map((user, i) => (
                  <div
                    key={user.id}
                    style={{
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      borderBottom:
                        i < pendingUsers.length - 1
                          ? "1px solid rgba(139,115,85,0.08)"
                          : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontFamily: fonts.ui,
                            fontSize: 13,
                            fontWeight: 600,
                            color: c.darkBrown,
                          }}
                        >
                          {user.full_name || "Unnamed User"}
                        </p>
                        <span
                          style={{
                            fontFamily: fonts.ui,
                            fontSize: 9,
                            fontWeight: 600,
                            background:
                              user.role === "faculty"
                                ? `${c.baseRed}20`
                                : "#3B528020",
                            color:
                              user.role === "faculty" ? c.baseRed : "#3B5280",
                            borderRadius: 20,
                            padding: "1px 6px",
                          }}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontFamily: fonts.mono,
                          fontSize: 11,
                          color: c.warmGray,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.email || "No email"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => reviewUser(user.id, "approved")}
                        disabled={isSaving}
                        style={{
                          border: "none",
                          borderRadius: 8,
                          padding: "7px 12px",
                          background: "#15803D",
                          color: c.white,
                          fontFamily: fonts.ui,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={12} />
                        Approve
                      </button>
                      <button
                        onClick={() => reviewUser(user.id, "rejected")}
                        disabled={isSaving}
                        style={{
                          border: "none",
                          borderRadius: 8,
                          padding: "7px 12px",
                          background: "#B91C1C",
                          color: c.white,
                          fontFamily: fonts.ui,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── Broadcast Tab ─── */}
        {activeTab === "broadcast" && !isLoading && (
          <div>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 10,
                fontWeight: 700,
                color: c.warmGray,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                margin: "0 0 8px 2px",
              }}
            >
              Send Broadcast
            </p>
            <div
              style={{
                background: c.white,
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 4px 24px rgba(94,16,16,0.10)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Write your broadcast message…"
                  style={{
                    ...inputStyle,
                    minHeight: 120,
                    resize: "none" as const,
                    lineHeight: 1.6,
                  }}
                />
                <div style={{ position: "relative" }}>
                  <select
                    value={broadcastTargetRole}
                    onChange={(e) =>
                      setBroadcastTargetRole(
                        e.target.value as "student" | "faculty" | "admin" | "",
                      )
                    }
                    style={selectStyle}
                  >
                    <option value="">All roles</option>
                    <option value="student">Students only</option>
                    <option value="faculty">Faculty only</option>
                    <option value="admin">Admins only</option>
                  </select>
                  <ChevronDown
                    size={14}
                    color={c.warmGray}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <button
                  onClick={() => postNotification("broadcast")}
                  disabled={isSaving}
                  style={{
                    width: "100%",
                    height: 48,
                    border: "none",
                    borderRadius: 12,
                    background: g.button,
                    color: c.cream,
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isSaving ? "default" : "pointer",
                    boxShadow: shadow.button,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  <Send size={16} />
                  {isSaving ? "Sending…" : "Send Broadcast"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Locations Tab ─── */}
        {activeTab === "locations" && !isLoading && (
          <div>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 10,
                fontWeight: 700,
                color: c.warmGray,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                margin: "0 0 8px 2px",
              }}
            >
              Add Campus Location
            </p>
            <div
              style={{
                background: c.white,
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 4px 24px rgba(94,16,16,0.10)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <input
                  value={locationForm.name}
                  onChange={(e) =>
                    setLocationForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Location name"
                  style={inputStyle}
                />
                <input
                  value={locationForm.category}
                  onChange={(e) =>
                    setLocationForm((p) => ({
                      ...p,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Category (Office, Building, Lab…)"
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={locationForm.latitude}
                    onChange={(e) =>
                      setLocationForm((p) => ({
                        ...p,
                        latitude: e.target.value,
                      }))
                    }
                    placeholder="Latitude"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    value={locationForm.longitude}
                    onChange={(e) =>
                      setLocationForm((p) => ({
                        ...p,
                        longitude: e.target.value,
                      }))
                    }
                    placeholder="Longitude"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                <button
                  onClick={addLocation}
                  disabled={isSaving}
                  style={{
                    width: "100%",
                    height: 48,
                    border: "none",
                    borderRadius: 12,
                    background: g.button,
                    color: c.cream,
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isSaving ? "default" : "pointer",
                    boxShadow: shadow.button,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  <MapPinned size={16} />
                  {isSaving ? "Adding…" : "Add Location"}
                </button>
              </div>
            </div>

            {/* Existing locations */}
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 10,
                fontWeight: 700,
                color: c.warmGray,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                margin: "16px 0 8px 2px",
              }}
            >
              Existing Locations ({locations.length})
            </p>
            <div
              style={{
                background: c.white,
                borderRadius: 16,
                boxShadow: shadow.card,
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {locations.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 12,
                      color: c.warmGray,
                      margin: 0,
                    }}
                  >
                    No locations found.
                  </p>
                </div>
              ) : (
                locations.map((loc, i) => (
                  <div
                    key={loc.id}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      borderBottom:
                        i < locations.length - 1
                          ? "1px solid rgba(139,115,85,0.08)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: `${c.baseRed}10`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MapPinned size={13} color={c.baseRed} />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: fonts.ui,
                          fontSize: 12,
                          fontWeight: 600,
                          color: c.darkBrown,
                        }}
                      >
                        {loc.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: fonts.ui,
                          fontSize: 10,
                          color: c.warmGray,
                        }}
                      >
                        {loc.category}
                        {loc.building ? ` · ${loc.building}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
