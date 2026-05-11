import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Megaphone,
  Image as ImageIcon,
  Loader2,
  Send,
  Trash2,
  GraduationCap,
  Users,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { TopBar } from "../components/TopBar";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

/* ── Types ───────────────────────────────────────────── */

type FacultyAnnouncement = {
  id: string;
  title: string;
  body: string;
  image_url?: string | null;
  target_role: string | null;
  created_at: string;
  created_by: string | null;
};

/* ── Helpers ─────────────────────────────────────────── */

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
  background: c.white,
  border: `1.5px solid ${c.warmGray}40`,
  borderRadius: 10,
  padding: "0 14px",
  height: 48,
  fontFamily: fonts.ui,
  fontSize: 14,
  color: c.darkBrown,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

/* ── Component ───────────────────────────────────────── */

export function FacultyAnnouncements() {
  const { currentUser } = useApp();

  /* ---------- State ---------- */
  const [announcements, setAnnouncements] = useState<FacultyAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  /* ---------- Load own announcements ---------- */
  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    const { data, error: fetchError } = await supabase
      .from("notifications")
      .select("id, title, body, image_url, target_role, created_at, created_by")
      .eq("created_by", currentUser.id)
      .eq("type", "announcement")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!fetchError && data) {
      setAnnouncements(data as FacultyAnnouncement[]);
    }
    setIsLoading(false);
  }, [currentUser.id]);

  useEffect(() => {
    loadAnnouncements();

    const channel = supabase
      .channel("faculty-announcements-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `created_by=eq.${currentUser.id}`,
        },
        () => {
          loadAnnouncements();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAnnouncements, currentUser.id]);

  /* ---------- Post announcement ---------- */
  const postAnnouncement = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody) {
      setError("Title and message are required.");
      return;
    }

    // Enforce: faculty may only target students — never admin or faculty
    const FACULTY_TARGET_ROLE = "student";

    setIsSaving(true);
    setError("");
    setFeedback("");

    let imageUrl: string | null = null;

    if (imageFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const maxSize = 5 * 1024 * 1024;

      if (!allowedTypes.includes(imageFile.type)) {
        setError("Image must be JPEG, PNG, WebP, or GIF.");
        setIsSaving(false);
        return;
      }
      if (imageFile.size > maxSize) {
        setError("Image must be 5 MB or smaller.");
        setIsSaving(false);
        return;
      }

      const ext = imageFile.name.split(".").pop() ?? "jpg";
      const safeExt = ext.toLowerCase();
      const filePath = `notifications/faculty/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from("student-documents")
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        setIsSaving(false);
        return;
      }

      imageUrl = supabase.storage
        .from("student-documents")
        .getPublicUrl(filePath).data.publicUrl;
    }

    // Server-side: RLS policy also enforces target_role = 'student' for faculty
    const { error: insertError } = await supabase.from("notifications").insert({
      type: "announcement",
      title: trimmedTitle,
      body: trimmedBody,
      image_url: imageUrl,
      target_role: FACULTY_TARGET_ROLE, // Always "student" — hardcoded here AND enforced by RLS
      created_by: currentUser.id,
    });

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setTitle("");
    setBody("");
    setImageFile(null);
    setFeedback("Announcement published to students.");
    await loadAnnouncements();
    setIsSaving(false);
  };

  /* ---------- Delete own announcement ---------- */
  const deleteAnnouncement = async (id: string) => {
    setIsSaving(true);
    setError("");
    setFeedback("");

    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("created_by", currentUser.id); // extra guard: only own rows

    if (deleteError) {
      setError(deleteError.message);
      setIsSaving(false);
      return;
    }

    setFeedback("Announcement deleted.");
    setDeleteTarget(null);
    await loadAnnouncements();
    setIsSaving(false);
  };

  /* ---------- Render ---------- */
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <TopBar title="Announcements" />

      {/* ─── Scrollable content ─── */}
      <div style={{ flex: 1, overflowY: "auto", background: c.creamLight }}>
        {/* ── Header banner ── */}
        <div
          style={{
            background: g.header,
            padding: "16px 20px 20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,240,196,0.06)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(255,240,196,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Megaphone size={20} color={c.cream} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: fonts.display,
                  fontSize: 20,
                  fontWeight: 700,
                  color: c.cream,
                }}
              >
                Faculty Announcements
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 3,
                }}
              >
                <GraduationCap size={12} color={`${c.cream}90`} />
                <p
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 11,
                    color: `${c.cream}90`,
                  }}
                >
                  Visible to students only
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "16px 16px 100px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Feedback / Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
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
            </motion.div>
          )}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
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
            </motion.div>
          )}

          {/* ── Compose card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
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
              New Announcement
            </p>
            <div
              style={{
                background: c.white,
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 4px 24px rgba(94,16,16,0.10)",
              }}
            >
              {/* Audience badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 12,
                  background: "#EFF6FF",
                  borderRadius: 8,
                  padding: "8px 12px",
                  border: "1px solid #BFDBFE",
                }}
              >
                <Users size={14} color="#1D4ED8" />
                <p
                  style={{
                    margin: 0,
                    fontFamily: fonts.ui,
                    fontSize: 12,
                    color: "#1D4ED8",
                    fontWeight: 600,
                  }}
                >
                  This announcement will be sent to{" "}
                  <strong>students only</strong>
                </p>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <input
                  id="faculty-announcement-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  style={inputStyle}
                />
                <textarea
                  id="faculty-announcement-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message to students…"
                  style={{
                    ...inputStyle,
                    height: "auto",
                    minHeight: 120,
                    padding: "12px 14px",
                    resize: "none",
                    lineHeight: 1.6,
                  }}
                />

                {/* Image attachment */}
                <div
                  style={{
                    border: `1px solid ${c.warmGray}33`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: c.cream,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: fonts.ui,
                      fontSize: 12,
                      color: c.warmGray,
                      cursor: "pointer",
                    }}
                  >
                    <ImageIcon size={14} />
                    Attach pubmat image (optional)
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  {imageFile && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontFamily: fonts.ui,
                        fontSize: 11,
                        color: c.darkBrown,
                      }}
                    >
                      Selected: {imageFile.name}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  id="faculty-post-announcement-btn"
                  onClick={postAnnouncement}
                  disabled={isSaving}
                  style={{
                    width: "100%",
                    height: 48,
                    border: "none",
                    borderRadius: 12,
                    background: isSaving
                      ? `${c.warmGray}50`
                      : g.button,
                    color: c.cream,
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isSaving ? "default" : "pointer",
                    boxShadow: isSaving ? "none" : shadow.button,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "opacity 0.2s, background 0.2s",
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Publish to Students
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Posted announcements ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
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
              My Announcements
            </p>

            {isLoading ? (
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
                  style={{
                    fontFamily: fonts.ui,
                    fontSize: 13,
                    color: c.warmGray,
                  }}
                >
                  Loading…
                </span>
              </div>
            ) : announcements.length === 0 ? (
              <div
                style={{
                  background: c.white,
                  borderRadius: 16,
                  padding: "40px 20px",
                  boxShadow: shadow.card,
                  textAlign: "center",
                  minHeight: 180,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Megaphone
                  size={40}
                  color={c.warmGray}
                  style={{ opacity: 0.3, margin: "0 0 12px" }}
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
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
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
                        {ann.image_url && (
                          <img
                            src={ann.image_url}
                            alt="announcement pubmat"
                            style={{
                              width: "100%",
                              maxHeight: 220,
                              objectFit: "cover",
                              borderRadius: 10,
                              marginTop: 8,
                              border: "1px solid rgba(139,115,85,0.18)",
                            }}
                          />
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            id: ann.id,
                            title: ann.title || "Untitled",
                          })
                        }
                        disabled={isSaving}
                        style={{
                          border: "none",
                          background: "none",
                          color: c.baseRed,
                          cursor: isSaving ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          flexShrink: 0,
                          opacity: isSaving ? 0.5 : 1,
                        }}
                        aria-label="Delete announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Footer */}
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            borderRadius: 20,
                            padding: "1px 7px",
                            fontFamily: fonts.ui,
                            fontSize: 9,
                            fontWeight: 700,
                          }}
                        >
                          Students
                        </span>
                      </div>
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
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: c.white,
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 340,
              boxShadow: shadow.card,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <Trash2 size={18} color={c.baseRed} />
              <h2
                style={{
                  fontFamily: fonts.display,
                  fontSize: 17,
                  color: c.darkBrown,
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                Delete Announcement
              </h2>
            </div>
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 13,
                color: c.warmGray,
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              Delete &quot;{deleteTarget.title}&quot;? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1,
                  height: 42,
                  background: c.creamLight,
                  border: "1.5px solid rgba(139,115,85,0.2)",
                  borderRadius: 12,
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: c.warmGray,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={() => deleteAnnouncement(deleteTarget.id)}
                style={{
                  flex: 1,
                  height: 42,
                  background: isSaving ? "rgba(139,115,85,0.3)" : g.button,
                  border: "none",
                  borderRadius: 12,
                  fontFamily: fonts.ui,
                  fontSize: 14,
                  color: c.cream,
                  cursor: isSaving ? "default" : "pointer",
                  fontWeight: 600,
                }}
              >
                {isSaving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
