import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Megaphone, Send, MapPinned, Loader2 } from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: c.white,
        borderRadius: 14,
        padding: "14px",
        boxShadow: shadow.card,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: fonts.ui,
          fontSize: 14,
          fontWeight: 700,
          color: c.darkBrown,
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: "2px 0 12px",
          fontFamily: fonts.ui,
          fontSize: 12,
          color: c.warmGray,
        }}
      >
        {subtitle}
      </p>
      {children}
    </div>
  );
}

type PendingProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "student" | "faculty" | "admin";
  status: "pending" | "approved" | "rejected";
};

type CampusLocation = {
  id: number;
  name: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const [pendingUsers, setPendingUsers] = useState<PendingProfile[]>([]);
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
    latitude: "",
    longitude: "",
  });

  const loadAdminData = async () => {
    setIsLoading(true);
    setError("");

    const [pendingResult, locationResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, role, status")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("campus_locations")
        .select("id, name, category, latitude, longitude")
        .order("name", { ascending: true }),
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
    setIsLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

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
        latitude: Number.isNaN(latitude) ? null : latitude,
        longitude: Number.isNaN(longitude) ? null : longitude,
      });

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setLocationForm({ name: "", category: "", latitude: "", longitude: "" });
    setFeedback("Campus location added.");
    await loadAdminData();
    setIsSaving(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: c.creamLight }}>
      <div style={{ background: g.header, padding: "14px 20px 22px" }}>
        <p
          style={{
            margin: 0,
            fontFamily: fonts.ui,
            fontSize: 12,
            color: c.warmGrayLight,
          }}
        >
          Admin Panel
        </p>
        <h1
          style={{
            margin: "2px 0 0",
            fontFamily: fonts.display,
            fontSize: 24,
            color: c.cream,
          }}
        >
          CCS Connect Control
        </h1>
      </div>

      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: c.warmGray,
            }}
          >
            <Loader2 size={16} />
            <span style={{ fontFamily: fonts.ui, fontSize: 12 }}>
              Loading admin data...
            </span>
          </div>
        )}

        {error && (
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
        )}

        {feedback && (
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
        )}

        <SectionCard
          title="User Verification"
          subtitle="Approve pending student and faculty accounts"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingUsers.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: c.warmGray,
                }}
              >
                No pending users.
              </p>
            ) : (
              pendingUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    border: "1px solid rgba(139,115,85,0.15)",
                    borderRadius: 10,
                    padding: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div>
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
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        color: c.warmGray,
                      }}
                    >
                      {user.email || "No email"} · {user.role}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => reviewUser(user.id, "approved")}
                      disabled={isSaving}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 8px",
                        background: "#15803D",
                        color: c.white,
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reviewUser(user.id, "rejected")}
                      disabled={isSaving}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 8px",
                        background: "#B91C1C",
                        color: c.white,
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Announcements"
          subtitle="Create and publish official updates"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={announcementTitle}
              onChange={(event) => setAnnouncementTitle(event.target.value)}
              placeholder="Announcement title"
              style={{
                border: "1px solid rgba(139,115,85,0.2)",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: fonts.ui,
              }}
            />
            <textarea
              value={announcementBody}
              onChange={(event) => setAnnouncementBody(event.target.value)}
              placeholder="Announcement message"
              style={{
                border: "1px solid rgba(139,115,85,0.2)",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: fonts.ui,
                minHeight: 78,
                resize: "vertical",
              }}
            />
            <select
              value={announcementTargetRole}
              onChange={(event) =>
                setAnnouncementTargetRole(
                  event.target.value as "student" | "faculty" | "admin" | "",
                )
              }
              style={{
                border: "1px solid rgba(139,115,85,0.2)",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: fonts.ui,
              }}
            >
              <option value="">All roles</option>
              <option value="student">Students only</option>
              <option value="faculty">Faculty only</option>
              <option value="admin">Admins only</option>
            </select>
            <button
              onClick={() => postNotification("announcement")}
              disabled={isSaving}
              style={{
                border: "none",
                borderRadius: 10,
                height: 40,
                background: g.button,
                color: c.cream,
                fontFamily: fonts.ui,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Megaphone
                size={14}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Publish Announcement
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Broadcast Messages"
          subtitle="Send updates to all users or selected roles"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={broadcastBody}
              onChange={(event) => setBroadcastBody(event.target.value)}
              placeholder="Broadcast message"
              style={{
                border: "1px solid rgba(139,115,85,0.2)",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: fonts.ui,
                minHeight: 78,
                resize: "vertical",
              }}
            />
            <select
              value={broadcastTargetRole}
              onChange={(event) =>
                setBroadcastTargetRole(
                  event.target.value as "student" | "faculty" | "admin" | "",
                )
              }
              style={{
                border: "1px solid rgba(139,115,85,0.2)",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: fonts.ui,
              }}
            >
              <option value="">All roles</option>
              <option value="student">Students only</option>
              <option value="faculty">Faculty only</option>
              <option value="admin">Admins only</option>
            </select>
            <button
              onClick={() => postNotification("broadcast")}
              disabled={isSaving}
              style={{
                border: "none",
                borderRadius: 10,
                height: 40,
                background: g.button,
                color: c.cream,
                fontFamily: fonts.ui,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Send
                size={14}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Send Broadcast
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Map Location Management"
          subtitle="Add campus locations and coordinates"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={locationForm.name}
              onChange={(event) =>
                setLocationForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Location name"
              style={{
                border: "1px solid rgba(139,115,85,0.2)",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: fonts.ui,
              }}
            />
            <input
              value={locationForm.category}
              onChange={(event) =>
                setLocationForm((prev) => ({
                  ...prev,
                  category: event.target.value,
                }))
              }
              placeholder="Category (Office, Building, Lab...)"
              style={{
                border: "1px solid rgba(139,115,85,0.2)",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: fonts.ui,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={locationForm.latitude}
                onChange={(event) =>
                  setLocationForm((prev) => ({
                    ...prev,
                    latitude: event.target.value,
                  }))
                }
                placeholder="Latitude"
                style={{
                  flex: 1,
                  border: "1px solid rgba(139,115,85,0.2)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontFamily: fonts.ui,
                }}
              />
              <input
                value={locationForm.longitude}
                onChange={(event) =>
                  setLocationForm((prev) => ({
                    ...prev,
                    longitude: event.target.value,
                  }))
                }
                placeholder="Longitude"
                style={{
                  flex: 1,
                  border: "1px solid rgba(139,115,85,0.2)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontFamily: fonts.ui,
                }}
              />
            </div>
            <button
              onClick={addLocation}
              disabled={isSaving}
              style={{
                border: "none",
                borderRadius: 10,
                height: 40,
                background: g.button,
                color: c.cream,
                fontFamily: fonts.ui,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <MapPinned
                size={14}
                style={{ marginRight: 6, verticalAlign: "middle" }}
              />
              Add Location
            </button>

            <div
              style={{
                maxHeight: 140,
                overflowY: "auto",
                border: "1px solid rgba(139,115,85,0.12)",
                borderRadius: 8,
                padding: 8,
              }}
            >
              {locations.map((location) => (
                <p
                  key={location.id}
                  style={{
                    margin: "0 0 6px",
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: c.darkBrown,
                  }}
                >
                  {location.name} · {location.category}
                </p>
              ))}
              {locations.length === 0 && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: c.warmGray,
                  }}
                >
                  No locations found.
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <button
          onClick={() => navigate("/app/home")}
          style={{
            marginTop: 8,
            border: "none",
            borderRadius: 12,
            height: 48,
            background: g.button,
            color: c.cream,
            fontFamily: fonts.ui,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back to App
        </button>
      </div>
    </div>
  );
}
