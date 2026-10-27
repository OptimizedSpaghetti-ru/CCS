import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { c, g, fonts, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

export function Security() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const handleUpdatePassword = async () => {
    if (!form.newPass || !form.confirm) {
      showToast({
        type: "error",
        title: "Missing fields",
        preview: "Please fill in all password fields",
        time: "now",
      });
      return;
    }
    if (form.newPass !== form.confirm) {
      showToast({
        type: "error",
        title: "Mismatch",
        preview: "New password and confirmation do not match",
        time: "now",
      });
      return;
    }
    if (form.newPass.length < 8) {
      showToast({
        type: "error",
        title: "Too short",
        preview: "Password must be at least 8 characters",
        time: "now",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: form.newPass,
    });
    setSaving(false);
    if (error) {
      showToast({
        type: "error",
        title: "Update failed",
        preview: error.message,
        time: "now",
      });
    } else {
      showToast({
        type: "message",
        title: "Password updated",
        preview: "Your password has been changed successfully",
        time: "now",
      });
      setForm({ current: "", newPass: "", confirm: "" });
    }
  };

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
          onClick={() => navigate("/app/settings")}
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
          }}
        >
          Login & Security
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 24px" }}>
        {/* Change Password */}
        <p
          style={{
            fontFamily: fonts.ui,
            fontSize: 11,
            fontWeight: 700,
            color: c.warmGray,
            textTransform: "uppercase",
            letterSpacing: 1,
            margin: "0 0 10px",
          }}
        >
          Change Password
        </p>
        <div
          style={{
            background: c.white,
            borderRadius: 16,
            padding: "16px",
            boxShadow: shadow.card,
            marginBottom: 20,
          }}
        >
          {[
            {
              key: "current",
              label: "Current Password",
              show: showCurrent,
              setShow: setShowCurrent,
            },
            {
              key: "newPass",
              label: "New Password",
              show: showNew,
              setShow: setShowNew,
            },
            {
              key: "confirm",
              label: "Confirm New Password",
              show: false,
              setShow: () => {},
            },
          ].map((field, i) => (
            <div key={field.key} style={{ marginBottom: i < 2 ? 12 : 0 }}>
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
                {field.label}
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: c.cream,
                  borderRadius: 10,
                  padding: "0 14px",
                  height: 46,
                }}
              >
                <Lock size={15} color={c.warmGray} />
                <input
                  type={field.show ? "text" : "password"}
                  placeholder="••••••••"
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: fonts.ui,
                    fontSize: 14,
                    color: c.darkBrown,
                  }}
                />
                {field.key !== "confirm" && (
                  <button
                    onClick={() => field.setShow(!field.show)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: c.warmGray,
                      padding: 0,
                    }}
                  >
                    {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 6,
              padding: "10px",
              background: c.creamLight,
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontFamily: fonts.ui,
                fontSize: 11,
                color: c.warmGray,
                margin: 0,
              }}
            >
              Password must be at least 8 characters and contain uppercase,
              lowercase, and a number.
            </p>
          </div>

          <button
            onClick={handleUpdatePassword}
            disabled={saving}
            style={{
              width: "100%",
              height: 46,
              background: g.button,
              border: "none",
              borderRadius: 12,
              fontFamily: fonts.ui,
              fontSize: 14,
              fontWeight: 600,
              color: c.cream,
              cursor: saving ? "default" : "pointer",
              boxShadow: shadow.button,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Updating…" : "Update Password"}
          </button>
        </div>

      </div>
    </div>
  );
}
