import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
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
  Search,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Ban,
  X,
  UserPlus,
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

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "student" | "faculty" | "admin";
  status: "pending" | "approved" | "rejected";
  student_id: string | null;
  employee_id: string | null;
  department: string | null;
  program: string | null;
  created_at: string;
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
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<
    "" | "student" | "faculty" | "admin"
  >("");
  const [userStatusFilter, setUserStatusFilter] = useState<
    "" | "pending" | "approved" | "rejected"
  >("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  /* ── Create-account modal state ── */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "student" as "student" | "faculty" | "admin",
    identifier: "",
    department: "",
    yearSection: "",
    program: "",
  });

  /* ── Detail-modal sub-mode state ── */
  const [detailMode, setDetailMode] = useState<"view" | "edit" | "password">(
    "view",
  );
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "student" as "student" | "faculty" | "admin",
    student_id: "",
    employee_id: "",
    department: "",
    program: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

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

    const [pendingResult, allUsersResult, locationResult, notifResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, role, status")
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, status, student_id, employee_id, department, program, created_at",
          )
          .order("created_at", { ascending: false }),
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

    if (pendingResult.error || allUsersResult.error || locationResult.error) {
      setError(
        pendingResult.error?.message ??
          allUsersResult.error?.message ??
          locationResult.error?.message ??
          "Failed to load admin data.",
      );
      setIsLoading(false);
      return;
    }

    setPendingUsers((pendingResult.data ?? []) as PendingProfile[]);
    setAllUsers((allUsersResult.data ?? []) as UserProfile[]);
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

  /* ── Admin: create account ── */
  const adminCreateAccount = async () => {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      identifier,
      department,
      yearSection,
      program,
    } = createForm;
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setError("First name, last name, email, and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);
    setError("");
    setFeedback("");

    const normalizedEmail = email.trim().toLowerCase();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    /* 1. Create auth user via signUp */
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          status: "approved",
        },
      },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setIsSaving(false);
      return;
    }

    /* 2. Upsert profile row directly (admin-approved) */
    if (data.user) {
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email: normalizedEmail,
        full_name: fullName,
        role,
        status: "approved",
        department: department.trim() || null,
        year_section: yearSection.trim() || null,
        program: program.trim() || null,
        student_id: role === "student" ? identifier.trim() || null : null,
        employee_id: role === "faculty" ? identifier.trim() || null : null,
        approved_by: currentUser.id || null,
        approved_at: new Date().toISOString(),
      });
      if (profileErr) {
        setError(profileErr.message);
        setIsSaving(false);
        return;
      }
    }

    /* Sign out the newly-created session so we stay as admin */
    await supabase.auth.signOut();
    /* Re-login as admin – the admin's session was replaced by signUp */
    /* We need the admin to re-auth. Instead, use a workaround: */
    /* Actually, signUp with auto-confirm may not replace current session
       on newer Supabase versions. We just reload admin data. */

    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "student",
      identifier: "",
      department: "",
      yearSection: "",
      program: "",
    });
    setShowCreateModal(false);
    setFeedback("Account created and approved successfully.");
    await loadAdminData();
    setIsSaving(false);
  };

  /* ── Admin: edit profile ── */
  const adminEditProfile = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    setError("");
    setFeedback("");

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name.trim() || null,
        role: editForm.role,
        student_id: editForm.student_id.trim() || null,
        employee_id: editForm.employee_id.trim() || null,
        department: editForm.department.trim() || null,
        program: editForm.program.trim() || null,
      })
      .eq("id", selectedUser.id);

    if (updateErr) {
      setError(updateErr.message);
      setIsSaving(false);
      return;
    }

    setFeedback("Profile updated successfully.");
    setDetailMode("view");
    setSelectedUser(null);
    await loadAdminData();
    setIsSaving(false);
  };

  /* ── Admin: change password ── */
  const adminChangePassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsSaving(true);
    setError("");
    setFeedback("");

    const { error: rpcErr } = await supabase.rpc("admin_update_user_password", {
      target_user_id: selectedUser.id,
      new_password: newPassword,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setIsSaving(false);
      return;
    }

    setNewPassword("");
    setDetailMode("view");
    setFeedback("Password changed successfully.");
    setIsSaving(false);
  };

  /* ── Admin: disable (unapprove) account ── */
  const adminDisableUser = async (userId: string) => {
    setIsSaving(true);
    setError("");
    setFeedback("");

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ status: "rejected", approved_by: null, approved_at: null })
      .eq("id", userId);

    if (updateErr) {
      setError(updateErr.message);
      setIsSaving(false);
      return;
    }

    setFeedback("Account disabled (unapproved) successfully.");
    setSelectedUser(null);
    await loadAdminData();
    setIsSaving(false);
  };

  /* ── Admin: enable (re-approve) account ── */
  const adminEnableUser = async (userId: string) => {
    setIsSaving(true);
    setError("");
    setFeedback("");

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        status: "approved",
        approved_by: currentUser.id || null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateErr) {
      setError(updateErr.message);
      setIsSaving(false);
      return;
    }

    setFeedback("Account enabled (approved) successfully.");
    setSelectedUser(null);
    await loadAdminData();
    setIsSaving(false);
  };

  /* ── Admin: delete account ── */
  const adminDeleteUser = async (userId: string) => {
    setIsSaving(true);
    setError("");
    setFeedback("");

    const { error: rpcErr } = await supabase.rpc("admin_delete_user", {
      target_user_id: userId,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setIsSaving(false);
      return;
    }

    setFeedback("Account permanently deleted.");
    setSelectedUser(null);
    setConfirmDelete(false);
    await loadAdminData();
    setIsSaving(false);
  };

  /* ── Open detail modal helper ── */
  const openDetailModal = (user: UserProfile) => {
    setSelectedUser(user);
    setDetailMode("view");
    setNewPassword("");
    setConfirmDelete(false);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      role: user.role,
      student_id: user.student_id || "",
      employee_id: user.employee_id || "",
      department: user.department || "",
      program: user.program || "",
    });
  };

  const closeDetailModal = () => {
    setSelectedUser(null);
    setDetailMode("view");
    setNewPassword("");
    setConfirmDelete(false);
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

        {/* ─── Users Tab ─── */}
        {activeTab === "users" &&
          !isLoading &&
          (() => {
            const filteredUsers = allUsers.filter((u) => {
              const q = userSearch.toLowerCase();
              const matchesSearch =
                !q ||
                (u.full_name ?? "").toLowerCase().includes(q) ||
                (u.email ?? "").toLowerCase().includes(q) ||
                (u.student_id ?? "").toLowerCase().includes(q) ||
                (u.employee_id ?? "").toLowerCase().includes(q);
              const matchesRole = !userRoleFilter || u.role === userRoleFilter;
              const matchesStatus =
                !userStatusFilter || u.status === userStatusFilter;
              return matchesSearch && matchesRole && matchesStatus;
            });

            const statusColor = (s: string) =>
              s === "approved"
                ? "#15803D"
                : s === "rejected"
                  ? "#B91C1C"
                  : "#B45309";
            const statusBg = (s: string) =>
              s === "approved"
                ? "#F0FDF4"
                : s === "rejected"
                  ? "#FEF2F2"
                  : "#FFFBEB";

            return (
              <>
                {/* ── Pending Accounts ── */}
                {pendingUsers.length > 0 && (
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
                      Pending Accounts ({pendingUsers.length})
                    </p>
                    <div
                      style={{
                        background: c.white,
                        borderRadius: 16,
                        boxShadow: shadow.card,
                        overflow: "hidden",
                      }}
                    >
                      {pendingUsers.map((user, i) => (
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
                                    user.role === "faculty"
                                      ? c.baseRed
                                      : "#3B5280",
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
                          <div
                            style={{ display: "flex", gap: 6, flexShrink: 0 }}
                          >
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
                      ))}
                    </div>
                  </div>
                )}

                {/* ── All Registered Users ── */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 10,
                        fontWeight: 700,
                        color: c.warmGray,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        margin: "0 0 0 2px",
                      }}
                    >
                      All Registered Users ({allUsers.length})
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      style={{
                        border: "none",
                        background: g.button,
                        color: c.cream,
                        borderRadius: 10,
                        padding: "7px 14px",
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        boxShadow: shadow.button,
                      }}
                    >
                      <UserPlus size={14} />
                      Create Account
                    </button>
                  </div>

                  {/* Search & filters */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{ flex: 1, minWidth: 140, position: "relative" }}
                    >
                      <Search
                        size={14}
                        color={c.warmGray}
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search name, email, ID…"
                        style={{ ...inputStyle, paddingLeft: 32 }}
                      />
                    </div>
                    <div style={{ position: "relative", minWidth: 100 }}>
                      <select
                        value={userRoleFilter}
                        onChange={(e) =>
                          setUserRoleFilter(
                            e.target.value as
                              | ""
                              | "student"
                              | "faculty"
                              | "admin",
                          )
                        }
                        style={{ ...selectStyle, paddingRight: 28 }}
                      >
                        <option value="">All roles</option>
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown
                        size={12}
                        color={c.warmGray}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                    <div style={{ position: "relative", minWidth: 110 }}>
                      <select
                        value={userStatusFilter}
                        onChange={(e) =>
                          setUserStatusFilter(
                            e.target.value as
                              | ""
                              | "pending"
                              | "approved"
                              | "rejected",
                          )
                        }
                        style={{ ...selectStyle, paddingRight: 28 }}
                      >
                        <option value="">All status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <ChevronDown
                        size={12}
                        color={c.warmGray}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Users list */}
                  <div
                    style={{
                      background: c.white,
                      borderRadius: 16,
                      boxShadow: shadow.card,
                      overflow: "hidden",
                    }}
                  >
                    {filteredUsers.length === 0 ? (
                      <div
                        style={{ padding: "32px 20px", textAlign: "center" }}
                      >
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
                          {userSearch || userRoleFilter || userStatusFilter
                            ? "No users match the filters"
                            : "No registered users"}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Column header */}
                        <div
                          style={{
                            display: "flex",
                            padding: "10px 16px",
                            borderBottom: "2px solid rgba(139,115,85,0.12)",
                            background: c.cream,
                          }}
                        >
                          <span
                            style={{
                              flex: 2,
                              fontFamily: fonts.ui,
                              fontSize: 10,
                              fontWeight: 700,
                              color: c.warmGray,
                              textTransform: "uppercase",
                            }}
                          >
                            Name
                          </span>
                          <span
                            style={{
                              flex: 2,
                              fontFamily: fonts.ui,
                              fontSize: 10,
                              fontWeight: 700,
                              color: c.warmGray,
                              textTransform: "uppercase",
                            }}
                          >
                            Email
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontFamily: fonts.ui,
                              fontSize: 10,
                              fontWeight: 700,
                              color: c.warmGray,
                              textTransform: "uppercase",
                            }}
                          >
                            Role
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontFamily: fonts.ui,
                              fontSize: 10,
                              fontWeight: 700,
                              color: c.warmGray,
                              textTransform: "uppercase",
                            }}
                          >
                            Status
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontFamily: fonts.ui,
                              fontSize: 10,
                              fontWeight: 700,
                              color: c.warmGray,
                              textTransform: "uppercase",
                            }}
                          >
                            Joined
                          </span>
                          <span
                            style={{
                              flex: 1,
                              fontFamily: fonts.ui,
                              fontSize: 10,
                              fontWeight: 700,
                              color: c.warmGray,
                              textTransform: "uppercase",
                              textAlign: "right",
                            }}
                          >
                            Actions
                          </span>
                        </div>

                        {/* Rows */}
                        <div style={{ maxHeight: 420, overflowY: "auto" }}>
                          {filteredUsers.map((user, i) => (
                            <div
                              key={user.id}
                              style={{
                                display: "flex",
                                padding: "12px 16px",
                                alignItems: "center",
                                borderBottom:
                                  i < filteredUsers.length - 1
                                    ? "1px solid rgba(139,115,85,0.06)"
                                    : "none",
                              }}
                            >
                              <div style={{ flex: 2, minWidth: 0 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontFamily: fonts.ui,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: c.darkBrown,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {user.full_name || "Unnamed User"}
                                </p>
                                {(user.student_id || user.employee_id) && (
                                  <p
                                    style={{
                                      margin: "1px 0 0",
                                      fontFamily: fonts.mono,
                                      fontSize: 10,
                                      color: c.warmGrayLight,
                                    }}
                                  >
                                    {user.student_id || user.employee_id}
                                  </p>
                                )}
                              </div>
                              <p
                                style={{
                                  flex: 2,
                                  margin: 0,
                                  fontFamily: fonts.mono,
                                  fontSize: 11,
                                  color: c.warmGray,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  minWidth: 0,
                                }}
                              >
                                {user.email || "—"}
                              </p>
                              <div style={{ flex: 1 }}>
                                <span
                                  style={{
                                    fontFamily: fonts.ui,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    background:
                                      user.role === "admin"
                                        ? `${c.baseRed}15`
                                        : user.role === "faculty"
                                          ? "#3B528015"
                                          : "#0369a115",
                                    color:
                                      user.role === "admin"
                                        ? c.baseRed
                                        : user.role === "faculty"
                                          ? "#3B5280"
                                          : "#0369a1",
                                    borderRadius: 20,
                                    padding: "2px 8px",
                                  }}
                                >
                                  {user.role}
                                </span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <span
                                  style={{
                                    fontFamily: fonts.ui,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    background: statusBg(user.status),
                                    color: statusColor(user.status),
                                    borderRadius: 20,
                                    padding: "2px 8px",
                                  }}
                                >
                                  {user.status}
                                </span>
                              </div>
                              <p
                                style={{
                                  flex: 1,
                                  margin: 0,
                                  fontFamily: fonts.mono,
                                  fontSize: 10,
                                  color: c.warmGrayLight,
                                }}
                              >
                                {new Date(user.created_at).toLocaleDateString()}
                              </p>
                              <div
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <button
                                  onClick={() => openDetailModal(user)}
                                  style={{
                                    border: `1px solid ${c.baseRed}40`,
                                    background: `${c.baseRed}08`,
                                    color: c.baseRed,
                                    borderRadius: 8,
                                    padding: "5px 9px",
                                    fontFamily: fonts.ui,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  View details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Summary row */}
                        <div
                          style={{
                            padding: "10px 16px",
                            borderTop: "2px solid rgba(139,115,85,0.12)",
                            background: c.cream,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: fonts.ui,
                              fontSize: 11,
                              color: c.warmGray,
                            }}
                          >
                            Showing {filteredUsers.length} of {allUsers.length}{" "}
                            users
                          </span>
                          <div style={{ display: "flex", gap: 10 }}>
                            <span
                              style={{
                                fontFamily: fonts.ui,
                                fontSize: 10,
                                color: "#15803D",
                              }}
                            >
                              {
                                allUsers.filter((u) => u.status === "approved")
                                  .length
                              }{" "}
                              approved
                            </span>
                            <span
                              style={{
                                fontFamily: fonts.ui,
                                fontSize: 10,
                                color: "#B45309",
                              }}
                            >
                              {
                                allUsers.filter((u) => u.status === "pending")
                                  .length
                              }{" "}
                              pending
                            </span>
                            <span
                              style={{
                                fontFamily: fonts.ui,
                                fontSize: 10,
                                color: "#B91C1C",
                              }}
                            >
                              {
                                allUsers.filter((u) => u.status === "rejected")
                                  .length
                              }{" "}
                              rejected
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedUser && (
                    <motion.div
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 10, 10, 0.48)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        zIndex: 1000,
                      }}
                      onClick={() => closeDetailModal()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <motion.div
                        style={{
                          width: "100%",
                          maxWidth: 560,
                          background: c.white,
                          borderRadius: 16,
                          boxShadow: "0 10px 40px rgba(0,0,0,0.28)",
                          overflow: "hidden",
                          maxHeight: "90vh",
                          overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.92, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                      >
                        {/* Header */}
                        <div
                          style={{
                            background: g.header,
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontFamily: fonts.ui,
                              fontSize: 13,
                              fontWeight: 700,
                              color: c.cream,
                            }}
                          >
                            {detailMode === "view"
                              ? "Account Details"
                              : detailMode === "edit"
                                ? "Edit Account"
                                : "Change Password"}
                          </p>
                          <button
                            onClick={() => closeDetailModal()}
                            style={{
                              border: "none",
                              background: "rgba(255,255,255,0.15)",
                              color: c.cream,
                              borderRadius: 8,
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            aria-label="Close account details"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div style={{ padding: 16 }}>
                          {/* ─── View mode ─── */}
                          {detailMode === "view" && (
                            <div style={{ display: "grid", gap: 10 }}>
                              {[
                                [
                                  "Name",
                                  selectedUser.full_name || "Unnamed User",
                                ],
                                ["Email", selectedUser.email || "No email"],
                                ["Role", selectedUser.role],
                                ["Status", selectedUser.status],
                                ["Student ID", selectedUser.student_id || "-"],
                                [
                                  "Employee ID",
                                  selectedUser.employee_id || "-",
                                ],
                                ["Department", selectedUser.department || "-"],
                                ["Program", selectedUser.program || "-"],
                                ["User ID", selectedUser.id],
                                [
                                  "Joined",
                                  new Date(
                                    selectedUser.created_at,
                                  ).toLocaleString(),
                                ],
                              ].map(([label, value]) => (
                                <div
                                  key={String(label)}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "120px 1fr",
                                    gap: 10,
                                    alignItems: "start",
                                    borderBottom:
                                      "1px solid rgba(139,115,85,0.10)",
                                    paddingBottom: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily: fonts.ui,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: c.warmGray,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    {label}
                                  </span>
                                  <span
                                    style={{
                                      fontFamily: fonts.ui,
                                      fontSize: 13,
                                      color: c.darkBrown,
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ─── Edit mode ─── */}
                          {detailMode === "edit" && (
                            <div style={{ display: "grid", gap: 10 }}>
                              <label
                                style={{
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.warmGray,
                                }}
                              >
                                Full Name
                                <input
                                  value={editForm.full_name}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      full_name: e.target.value,
                                    })
                                  }
                                  style={{ ...inputStyle, marginTop: 4 }}
                                />
                              </label>
                              <label
                                style={{
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.warmGray,
                                }}
                              >
                                Role
                                <div
                                  style={{ position: "relative", marginTop: 4 }}
                                >
                                  <select
                                    value={editForm.role}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        role: e.target.value as
                                          | "student"
                                          | "faculty"
                                          | "admin",
                                      })
                                    }
                                    style={selectStyle}
                                  >
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <ChevronDown
                                    size={12}
                                    color={c.warmGray}
                                    style={{
                                      position: "absolute",
                                      right: 10,
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      pointerEvents: "none",
                                    }}
                                  />
                                </div>
                              </label>
                              <label
                                style={{
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.warmGray,
                                }}
                              >
                                Student ID
                                <input
                                  value={editForm.student_id}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      student_id: e.target.value,
                                    })
                                  }
                                  style={{ ...inputStyle, marginTop: 4 }}
                                />
                              </label>
                              <label
                                style={{
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.warmGray,
                                }}
                              >
                                Employee ID
                                <input
                                  value={editForm.employee_id}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      employee_id: e.target.value,
                                    })
                                  }
                                  style={{ ...inputStyle, marginTop: 4 }}
                                />
                              </label>
                              <label
                                style={{
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.warmGray,
                                }}
                              >
                                Department
                                <input
                                  value={editForm.department}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      department: e.target.value,
                                    })
                                  }
                                  style={{ ...inputStyle, marginTop: 4 }}
                                />
                              </label>
                              <label
                                style={{
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.warmGray,
                                }}
                              >
                                Program
                                <input
                                  value={editForm.program}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      program: e.target.value,
                                    })
                                  }
                                  style={{ ...inputStyle, marginTop: 4 }}
                                />
                              </label>
                              <button
                                onClick={adminEditProfile}
                                disabled={isSaving}
                                style={{
                                  width: "100%",
                                  height: 44,
                                  border: "none",
                                  borderRadius: 10,
                                  background: g.button,
                                  color: c.cream,
                                  fontFamily: fonts.ui,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: isSaving ? "default" : "pointer",
                                  boxShadow: shadow.button,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  opacity: isSaving ? 0.6 : 1,
                                  marginTop: 4,
                                }}
                              >
                                {isSaving ? (
                                  <Loader2 size={16} className="spin" />
                                ) : (
                                  <CheckCircle2 size={16} />
                                )}
                                {isSaving ? "Saving…" : "Save Changes"}
                              </button>
                            </div>
                          )}

                          {/* ─── Password mode ─── */}
                          {detailMode === "password" && (
                            <div style={{ display: "grid", gap: 10 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontFamily: fonts.ui,
                                  fontSize: 13,
                                  color: c.darkBrown,
                                }}
                              >
                                Set a new password for{" "}
                                <strong>
                                  {selectedUser.full_name || selectedUser.email}
                                </strong>
                              </p>
                              <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password (min 6 characters)"
                                style={inputStyle}
                              />
                              <button
                                onClick={adminChangePassword}
                                disabled={isSaving || newPassword.length < 6}
                                style={{
                                  width: "100%",
                                  height: 44,
                                  border: "none",
                                  borderRadius: 10,
                                  background: g.button,
                                  color: c.cream,
                                  fontFamily: fonts.ui,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor:
                                    isSaving || newPassword.length < 6
                                      ? "default"
                                      : "pointer",
                                  boxShadow: shadow.button,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  opacity:
                                    isSaving || newPassword.length < 6
                                      ? 0.6
                                      : 1,
                                }}
                              >
                                {isSaving ? (
                                  <Loader2 size={16} className="spin" />
                                ) : (
                                  <KeyRound size={16} />
                                )}
                                {isSaving ? "Updating…" : "Update Password"}
                              </button>
                            </div>
                          )}

                          {/* ─── Action bar ─── */}
                          <div
                            style={{
                              marginTop: 16,
                              paddingTop: 14,
                              borderTop: "2px solid rgba(139,115,85,0.10)",
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            {detailMode === "view" && (
                              <>
                                <button
                                  onClick={() => setDetailMode("edit")}
                                  style={{
                                    flex: 1,
                                    minWidth: 100,
                                    border: `1.5px solid ${c.baseRed}30`,
                                    background: `${c.baseRed}08`,
                                    color: c.baseRed,
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    fontFamily: fonts.ui,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                  }}
                                >
                                  <Pencil size={13} /> Edit
                                </button>
                                <button
                                  onClick={() => setDetailMode("password")}
                                  style={{
                                    flex: 1,
                                    minWidth: 100,
                                    border: `1.5px solid #3B528030`,
                                    background: "#3B528008",
                                    color: "#3B5280",
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    fontFamily: fonts.ui,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                  }}
                                >
                                  <KeyRound size={13} /> Password
                                </button>
                                {selectedUser.status === "approved" ? (
                                  <button
                                    onClick={() =>
                                      adminDisableUser(selectedUser.id)
                                    }
                                    disabled={isSaving}
                                    style={{
                                      flex: 1,
                                      minWidth: 100,
                                      border: "1.5px solid #B4530930",
                                      background: "#B4530908",
                                      color: "#B45309",
                                      borderRadius: 10,
                                      padding: "8px 12px",
                                      fontFamily: fonts.ui,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: isSaving ? "default" : "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 5,
                                      opacity: isSaving ? 0.5 : 1,
                                    }}
                                  >
                                    <Ban size={13} /> Disable
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      adminEnableUser(selectedUser.id)
                                    }
                                    disabled={isSaving}
                                    style={{
                                      flex: 1,
                                      minWidth: 100,
                                      border: "1.5px solid #15803D30",
                                      background: "#15803D08",
                                      color: "#15803D",
                                      borderRadius: 10,
                                      padding: "8px 12px",
                                      fontFamily: fonts.ui,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: isSaving ? "default" : "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 5,
                                      opacity: isSaving ? 0.5 : 1,
                                    }}
                                  >
                                    <CheckCircle2 size={13} /> Enable
                                  </button>
                                )}
                              </>
                            )}

                            {detailMode !== "view" && (
                              <button
                                onClick={() => setDetailMode("view")}
                                style={{
                                  flex: 1,
                                  minWidth: 100,
                                  border: `1.5px solid ${c.warmGray}40`,
                                  background: "transparent",
                                  color: c.warmGray,
                                  borderRadius: 10,
                                  padding: "8px 12px",
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 5,
                                }}
                              >
                                Cancel
                              </button>
                            )}

                            {/* Delete */}
                            {!confirmDelete ? (
                              <button
                                onClick={() => setConfirmDelete(true)}
                                style={{
                                  flex: 1,
                                  minWidth: 100,
                                  border: "1.5px solid #B91C1C30",
                                  background: "#B91C1C08",
                                  color: "#B91C1C",
                                  borderRadius: 10,
                                  padding: "8px 12px",
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 5,
                                }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            ) : (
                              <button
                                onClick={() => adminDeleteUser(selectedUser.id)}
                                disabled={isSaving}
                                style={{
                                  flex: 1,
                                  minWidth: 100,
                                  border: "none",
                                  background: "#B91C1C",
                                  color: "#fff",
                                  borderRadius: 10,
                                  padding: "8px 12px",
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: isSaving ? "default" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 5,
                                  opacity: isSaving ? 0.6 : 1,
                                }}
                              >
                                <Trash2 size={13} />{" "}
                                {isSaving ? "Deleting…" : "Confirm Delete"}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* ── Create Account Modal ── */}
                  {showCreateModal && (
                    <motion.div
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 10, 10, 0.48)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        zIndex: 1000,
                      }}
                      onClick={() => setShowCreateModal(false)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <motion.div
                        style={{
                          width: "100%",
                          maxWidth: 520,
                          background: c.white,
                          borderRadius: 16,
                          boxShadow: "0 10px 40px rgba(0,0,0,0.28)",
                          overflow: "hidden",
                          maxHeight: "90vh",
                          overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.92, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                      >
                        <div
                          style={{
                            background: g.header,
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontFamily: fonts.ui,
                              fontSize: 13,
                              fontWeight: 700,
                              color: c.cream,
                            }}
                          >
                            Create New Account
                          </p>
                          <button
                            onClick={() => setShowCreateModal(false)}
                            style={{
                              border: "none",
                              background: "rgba(255,255,255,0.15)",
                              color: c.cream,
                              borderRadius: 8,
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                            aria-label="Close create account"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div style={{ padding: 16, display: "grid", gap: 10 }}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 10,
                            }}
                          >
                            <label
                              style={{
                                fontFamily: fonts.ui,
                                fontSize: 11,
                                fontWeight: 700,
                                color: c.warmGray,
                              }}
                            >
                              First Name *
                              <input
                                value={createForm.firstName}
                                onChange={(e) =>
                                  setCreateForm({
                                    ...createForm,
                                    firstName: e.target.value,
                                  })
                                }
                                style={{ ...inputStyle, marginTop: 4 }}
                              />
                            </label>
                            <label
                              style={{
                                fontFamily: fonts.ui,
                                fontSize: 11,
                                fontWeight: 700,
                                color: c.warmGray,
                              }}
                            >
                              Last Name *
                              <input
                                value={createForm.lastName}
                                onChange={(e) =>
                                  setCreateForm({
                                    ...createForm,
                                    lastName: e.target.value,
                                  })
                                }
                                style={{ ...inputStyle, marginTop: 4 }}
                              />
                            </label>
                          </div>
                          <label
                            style={{
                              fontFamily: fonts.ui,
                              fontSize: 11,
                              fontWeight: 700,
                              color: c.warmGray,
                            }}
                          >
                            Email *
                            <input
                              type="email"
                              value={createForm.email}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  email: e.target.value,
                                })
                              }
                              style={{ ...inputStyle, marginTop: 4 }}
                            />
                          </label>
                          <label
                            style={{
                              fontFamily: fonts.ui,
                              fontSize: 11,
                              fontWeight: 700,
                              color: c.warmGray,
                            }}
                          >
                            Password *
                            <input
                              type="password"
                              value={createForm.password}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  password: e.target.value,
                                })
                              }
                              placeholder="Min 6 characters"
                              style={{ ...inputStyle, marginTop: 4 }}
                            />
                          </label>
                          <label
                            style={{
                              fontFamily: fonts.ui,
                              fontSize: 11,
                              fontWeight: 700,
                              color: c.warmGray,
                            }}
                          >
                            Role
                            <div style={{ position: "relative", marginTop: 4 }}>
                              <select
                                value={createForm.role}
                                onChange={(e) =>
                                  setCreateForm({
                                    ...createForm,
                                    role: e.target.value as
                                      | "student"
                                      | "faculty"
                                      | "admin",
                                  })
                                }
                                style={selectStyle}
                              >
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                              </select>
                              <ChevronDown
                                size={12}
                                color={c.warmGray}
                                style={{
                                  position: "absolute",
                                  right: 10,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  pointerEvents: "none",
                                }}
                              />
                            </div>
                          </label>
                          <label
                            style={{
                              fontFamily: fonts.ui,
                              fontSize: 11,
                              fontWeight: 700,
                              color: c.warmGray,
                            }}
                          >
                            {createForm.role === "student"
                              ? "Student ID"
                              : "Employee ID"}
                            <input
                              value={createForm.identifier}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  identifier: e.target.value,
                                })
                              }
                              style={{ ...inputStyle, marginTop: 4 }}
                            />
                          </label>
                          <label
                            style={{
                              fontFamily: fonts.ui,
                              fontSize: 11,
                              fontWeight: 700,
                              color: c.warmGray,
                            }}
                          >
                            Department
                            <input
                              value={createForm.department}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  department: e.target.value,
                                })
                              }
                              style={{ ...inputStyle, marginTop: 4 }}
                            />
                          </label>
                          {createForm.role === "student" && (
                            <>
                              <label
                                style={{
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.warmGray,
                                }}
                              >
                                Program
                                <input
                                  value={createForm.program}
                                  onChange={(e) =>
                                    setCreateForm({
                                      ...createForm,
                                      program: e.target.value,
                                    })
                                  }
                                  style={{ ...inputStyle, marginTop: 4 }}
                                />
                              </label>
                              <label
                                style={{
                                  fontFamily: fonts.ui,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: c.warmGray,
                                }}
                              >
                                Year & Section
                                <input
                                  value={createForm.yearSection}
                                  onChange={(e) =>
                                    setCreateForm({
                                      ...createForm,
                                      yearSection: e.target.value,
                                    })
                                  }
                                  style={{ ...inputStyle, marginTop: 4 }}
                                />
                              </label>
                            </>
                          )}
                          <button
                            onClick={adminCreateAccount}
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
                              marginTop: 4,
                            }}
                          >
                            {isSaving ? (
                              <Loader2 size={16} className="spin" />
                            ) : (
                              <UserPlus size={16} />
                            )}
                            {isSaving ? "Creating…" : "Create Account"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </>
            );
          })()}

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
