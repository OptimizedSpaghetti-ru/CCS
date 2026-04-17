import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Camera,
  Loader2,
  User,
  Hash,
  Mail,
  Phone,
  Book,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

function FormGroup({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div
      style={{
        background: isDark ? "#1F0F14" : c.white,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: shadow.card,
        border: `1px solid ${isDark ? "rgba(255,232,217,0.16)" : "transparent"}`,
      }}
    >
      <div
        style={{
          background: isDark ? "#2A141A" : c.cream,
          padding: "10px 16px",
          borderBottom: `1px solid ${isDark ? "rgba(255,232,217,0.14)" : "rgba(139,115,85,0.15)"}`,
        }}
      >
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            fontWeight: 700,
            color: c.warmGray,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            margin: 0,
          }}
        >
          {title}
        </p>
      </div>
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EditField({
  icon,
  label,
  value,
  onChange,
  multiline,
  hint,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
  isDark: boolean;
}) {
  return (
    <div>
      <label
        style={{
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 600,
          color: c.darkBrown,
          display: "block",
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: multiline ? "flex-start" : "center",
          gap: 10,
          background: isDark ? "#2A141A" : c.cream,
          borderRadius: 10,
          padding: multiline ? "12px 14px" : "0 14px",
          height: multiline ? undefined : 46,
          border: `1.5px solid ${isDark ? "rgba(255,232,217,0.34)" : "rgba(139,115,85,0.28)"}`,
        }}
      >
        <span
          style={{
            color: c.warmGray,
            flexShrink: 0,
            marginTop: multiline ? 2 : 0,
          }}
        >
          {icon}
        </span>
        {multiline ? (
          <textarea
            className="auth-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.darkBrown,
              resize: "none",
              lineHeight: 1.5,
              minWidth: 0,
              ["--auth-placeholder-color" as string]: isDark
                ? "rgba(255, 232, 217, 0.7)"
                : "rgba(45, 27, 14, 0.55)",
            }}
          />
        ) : (
          <input
            className="auth-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: fonts.ui,
              fontSize: 13,
              color: c.darkBrown,
              minWidth: 0,
              ["--auth-placeholder-color" as string]: isDark
                ? "rgba(255, 232, 217, 0.7)"
                : "rgba(45, 27, 14, 0.55)",
            }}
          />
        )}
      </div>
      {hint && (
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 10,
            color: c.warmGray,
            margin: "4px 0 0",
            textAlign: "right",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile, showToast, resolvedThemeMode } =
    useApp();
  const isDark = resolvedThemeMode === "dark";
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    currentUser.avatar,
  );
  const [form, setForm] = useState({
    name: currentUser.name,
    id: currentUser.identifier,
    email: currentUser.email,
    phone: "",
    dept: currentUser.department,
    program: "",
    yearSection: currentUser.yearSection,
    bio: "",
  });
  const maxAvatarSizeBytes = 5 * 1024 * 1024;
  const isUploadingAvatar = saving && Boolean(avatarFile);

  /* load full profile from DB */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, email, department, year_section, program, student_id, employee_id, phone, bio",
        )
        .eq("id", currentUser.id)
        .single();
      if (data) {
        setForm((prev) => ({
          ...prev,
          name: data.full_name ?? prev.name,
          email: data.email ?? prev.email,
          dept: data.department ?? prev.dept,
          yearSection: data.year_section ?? prev.yearSection,
          program: data.program ?? prev.program,
          id: data.student_id ?? data.employee_id ?? prev.id,
          phone: data.phone ?? prev.phone,
          bio: data.bio ?? prev.bio,
        }));
      }
    })();
  }, [currentUser.id]);

  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (!currentUser.id) {
        showToast({
          type: "message",
          title: "Save failed",
          preview: "Unable to resolve your account ID. Please sign in again.",
          time: "now",
        });
        return;
      }

      /* Upload new avatar if chosen */
      let newAvatarUrl: string | undefined;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${currentUser.id}.${ext.toLowerCase()}`;

        // First try INSERT mode for first-time avatars. If file exists, fall back to UPSERT.
        const initialUpload = await supabase.storage
          .from("avatar")
          .upload(path, avatarFile, { upsert: false });

        if (initialUpload.error) {
          const message = initialUpload.error.message.toLowerCase();
          const alreadyExists =
            message.includes("already exists") ||
            message.includes("duplicate") ||
            message.includes("409");

          if (!alreadyExists) {
            showToast({
              type: "message",
              title: "Upload failed",
              preview: initialUpload.error.message,
              time: "now",
            });
            return;
          }

          const upsertUpload = await supabase.storage
            .from("avatar")
            .upload(path, avatarFile, { upsert: true });

          if (upsertUpload.error) {
            showToast({
              type: "message",
              title: "Upload failed",
              preview: upsertUpload.error.message,
              time: "now",
            });
            return;
          }
        }

        const { data: urlData } = supabase.storage
          .from("avatar")
          .getPublicUrl(path);

        // Add version param so the latest image appears immediately after replace.
        newAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.name.trim(),
          email: form.email.trim(),
          department: form.dept.trim(),
          year_section: form.yearSection.trim(),
          program: form.program.trim(),
          phone: form.phone.trim() || null,
          bio: form.bio.trim() || null,
          ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {}),
        })
        .eq("id", currentUser.id);

      if (error) {
        showToast({
          type: "message",
          title: "Save failed",
          preview: error.message,
          time: "now",
        });
        return;
      }

      if (newAvatarUrl) {
        setAvatarPreview(newAvatarUrl);
      }

      await refreshProfile();
      showToast({
        type: "message",
        title: "Profile updated",
        preview: "Your changes have been saved",
        time: "now",
      });
      navigate("/app/profile");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: c.creamLight,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: g.header,
          padding: "12px 16px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate("/app/profile")}
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
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 20,
            fontWeight: 700,
            color: c.cream,
            margin: 0,
            flex: 1,
          }}
        >
          Edit Profile
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: "rgba(255,240,196,0.2)",
            border: "1px solid rgba(255,240,196,0.3)",
            borderRadius: 8,
            padding: "6px 14px",
            fontFamily: fonts.ui,
            fontSize: 13,
            fontWeight: 600,
            color: c.cream,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          {isUploadingAvatar ? "Uploading..." : saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 100px" }}>
        {/* Avatar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: g.button,
                border: `3px solid ${c.baseRed}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 30,
                    fontWeight: 900,
                    color: c.cream,
                  }}
                >
                  {currentUser.initials}
                </span>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={saving}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: g.button,
                border: `2px solid ${c.white}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {isUploadingAvatar ? (
                <Loader2
                  size={14}
                  color={c.cream}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Camera size={14} color={c.cream} />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (!f.type.startsWith("image/")) {
                    showToast({
                      type: "message",
                      title: "Invalid file",
                      preview: "Please select an image file.",
                      time: "now",
                    });
                    e.target.value = "";
                    return;
                  }

                  if (f.size > maxAvatarSizeBytes) {
                    showToast({
                      type: "message",
                      title: "Image too large",
                      preview: "Avatar image must be 5 MB or smaller.",
                      time: "now",
                    });
                    e.target.value = "";
                    return;
                  }

                  if (avatarObjectUrlRef.current) {
                    URL.revokeObjectURL(avatarObjectUrlRef.current);
                  }
                  const objectUrl = URL.createObjectURL(f);
                  avatarObjectUrlRef.current = objectUrl;
                  setAvatarFile(f);
                  setAvatarPreview(objectUrl);
                }
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormGroup title="Personal Information" isDark={isDark}>
            <EditField
              icon={<User size={16} />}
              label="Full Name"
              value={form.name}
              onChange={set("name")}
              isDark={isDark}
            />
            <EditField
              icon={<FileText size={16} />}
              label="Bio / About"
              value={form.bio}
              onChange={set("bio")}
              multiline
              hint={`${form.bio.length}/150`}
              isDark={isDark}
            />
          </FormGroup>

          {currentUser.role === "student" ? (
            <FormGroup title="Academic Information" isDark={isDark}>
              <EditField
                icon={<Hash size={16} />}
                label="Student ID"
                value={form.id}
                onChange={set("id")}
                isDark={isDark}
              />
              <EditField
                icon={<Book size={16} />}
                label="Department"
                value={form.dept}
                onChange={set("dept")}
                isDark={isDark}
              />
              <EditField
                icon={<Book size={16} />}
                label="Program"
                value={form.program}
                onChange={set("program")}
                isDark={isDark}
              />
              <EditField
                icon={<Book size={16} />}
                label="Year & Section"
                value={form.yearSection}
                onChange={set("yearSection")}
                isDark={isDark}
              />
            </FormGroup>
          ) : (
            <FormGroup
              title={
                currentUser.role === "faculty"
                  ? "Faculty Information"
                  : "Admin Information"
              }
              isDark={isDark}
            >
              <EditField
                icon={<Hash size={16} />}
                label="Employee ID"
                value={form.id}
                onChange={set("id")}
                isDark={isDark}
              />
              <EditField
                icon={<Book size={16} />}
                label="Department"
                value={form.dept}
                onChange={set("dept")}
                isDark={isDark}
              />
              {currentUser.role === "faculty" && (
                <EditField
                  icon={<Book size={16} />}
                  label="Program Handled"
                  value={form.program}
                  onChange={set("program")}
                  isDark={isDark}
                />
              )}
            </FormGroup>
          )}

          <FormGroup title="Contact Information" isDark={isDark}>
            <EditField
              icon={<Mail size={16} />}
              label="Email Address"
              value={form.email}
              onChange={set("email")}
              isDark={isDark}
            />
            <EditField
              icon={<Phone size={16} />}
              label="Phone Number"
              value={form.phone}
              onChange={set("phone")}
              isDark={isDark}
            />
          </FormGroup>
        </div>
      </div>

      {/* Pinned bottom actions */}
      <div
        style={{
          padding: "12px 16px 16px",
          background: c.white,
          borderTop: "1px solid rgba(139,115,85,0.12)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            height: 50,
            background: g.button,
            border: "none",
            borderRadius: 12,
            fontFamily: fonts.ui,
            fontSize: 15,
            fontWeight: 600,
            color: c.cream,
            cursor: saving ? "default" : "pointer",
            boxShadow: shadow.button,
            marginBottom: 10,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {isUploadingAvatar
            ? "Uploading avatar..."
            : saving
              ? "Saving..."
              : "Save Changes"}
        </button>
        <button
          onClick={() => navigate("/app/profile")}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: fonts.ui,
            fontSize: 14,
            color: c.warmGray,
          }}
        >
          Discard Changes
        </button>
      </div>
    </div>
  );
}
