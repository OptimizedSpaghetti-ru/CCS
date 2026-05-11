import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Plus,
  Send,
  Wrench,
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { c, fonts, g, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

const categories = [
  "System/App Error",
  "Broken Computer",
  "Internet Issue",
  "Broken Peripheral",
  "Software Problem",
  "Hardware Problem",
  "Laboratory Equipment Issue",
  "Other Technical Concern",
];

const priorities = ["Low", "Medium", "High", "Urgent"];

type AssistanceStatus = "Pending" | "In Progress" | "Resolved" | "Rejected/Closed";

type AssistanceRequest = {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_role: string;
  title: string;
  category: string;
  description: string;
  location: string | null;
  image_url: string | null;
  priority: string;
  status: AssistanceStatus;
  it_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid rgba(139,115,85,0.22)",
  borderRadius: 12,
  background: c.white,
  color: c.darkBrown,
  fontFamily: fonts.ui,
  fontSize: 14,
  padding: "0 12px",
  minHeight: 46,
  outline: "none",
  boxSizing: "border-box",
};

function statusColor(status: AssistanceStatus) {
  if (status === "Resolved") return "#059669";
  if (status === "In Progress") return "#1D4ED8";
  if (status === "Rejected/Closed") return "#B91C1C";
  return "#D97706";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function roleLabel(role: string) {
  if (role === "it_support") return "IT Support";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function Assistance() {
  const { currentUser, showToast } = useApp();
  const canSubmit = ["student", "faculty", "admin"].includes(currentUser.role);
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: categories[0],
    description: "",
    location: "",
    priority: "Medium",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const openCount = useMemo(
    () => requests.filter((item) => item.status !== "Resolved").length,
    [requests],
  );

  const loadRequests = useCallback(async () => {
    if (!currentUser.id) return;
    setIsLoading(true);
    const { data, error: loadError } = await supabase
      .from("assistance_requests")
      .select("*")
      .eq("requester_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
    } else {
      setRequests((data ?? []) as AssistanceRequest[]);
    }
    setIsLoading(false);
  }, [currentUser.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const submitRequest = async () => {
    if (!canSubmit) {
      setError("Only students, faculty, and admins can file assistance requests.");
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      setError("Issue title and description are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFeedback("");

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `assistance/${currentUser.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("student-documents")
        .upload(path, imageFile, { upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        setIsSubmitting(false);
        return;
      }

      imageUrl = supabase.storage
        .from("student-documents")
        .getPublicUrl(path).data.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("assistance_requests")
      .insert({
        requester_id: currentUser.id,
        requester_name: currentUser.name,
        requester_role: currentUser.role,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim() || null,
        image_url: imageUrl,
        priority: form.priority,
        status: "Pending",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    const requestId = data?.id;
    await supabase.from("notifications").insert([
      {
        title: "New assistance request",
        body: `${currentUser.name} reported: ${form.title.trim()}`,
        type: "announcement",
        target_role: "it_support",
        created_by: currentUser.id,
      },
      {
        title: "Assistance request received",
        body: "IT Support has received your request.",
        type: "announcement",
        target_role: currentUser.role,
        recipient_id: currentUser.id,
        created_by: currentUser.id,
      },
    ]);

    showToast({
      type: "announcement",
      title: "Request submitted",
      preview: "IT Support has been notified.",
      time: "Now",
    });
    setFeedback("Assistance request submitted successfully.");
    setForm({
      title: "",
      category: categories[0],
      description: "",
      location: "",
      priority: "Medium",
    });
    setImageFile(null);
    await loadRequests();
    if (requestId) {
      window.setTimeout(() => {
        document.getElementById(`request-${requestId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 120);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar title="Assistance" subtitle="Report CCS technical problems" showBack />
      <div style={{ flex: 1, overflowY: "auto", background: c.creamLight, padding: 16 }}>
        <div
          style={{
            background: g.header,
            borderRadius: 16,
            padding: 16,
            color: c.cream,
            boxShadow: shadow.card,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "rgba(255,240,196,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wrench size={21} />
            </div>
            <div>
              <p style={{ margin: 0, fontFamily: fonts.display, fontSize: 18, fontWeight: 700 }}>
                CCS Assistance
              </p>
              <p style={{ margin: "2px 0 0", fontFamily: fonts.ui, fontSize: 12, color: c.warmGrayLight }}>
                {openCount} active request{openCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {canSubmit && (
          <div
            style={{
              background: c.white,
              borderRadius: 16,
              padding: 14,
              boxShadow: shadow.card,
              display: "grid",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={16} color={c.baseRed} />
              <p style={{ margin: 0, fontFamily: fonts.ui, fontSize: 13, fontWeight: 800, color: c.darkBrown }}>
                New assistance request
              </p>
            </div>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Issue title"
              style={fieldStyle}
            />
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              style={fieldStyle}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe the problem"
              style={{ ...fieldStyle, minHeight: 104, paddingTop: 12, resize: "vertical" }}
            />
            <input
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Location or room (optional)"
              style={fieldStyle}
            />
            <select
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              style={fieldStyle}
            >
              {priorities.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
            <label
              style={{
                border: "1.5px dashed rgba(139,115,85,0.35)",
                borderRadius: 12,
                padding: "12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                color: c.warmGray,
                fontFamily: fonts.ui,
                fontSize: 12,
              }}
            >
              <Camera size={17} color={c.baseRed} />
              <span style={{ flex: 1 }}>
                {imageFile ? imageFile.name : "Upload image evidence (optional)"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
            </label>

            {(error || feedback) && (
              <p
                style={{
                  margin: 0,
                  fontFamily: fonts.ui,
                  fontSize: 12,
                  color: error ? "#B91C1C" : "#059669",
                }}
              >
                {error || feedback}
              </p>
            )}

            <button
              onClick={submitRequest}
              disabled={isSubmitting}
              style={{
                border: "none",
                borderRadius: 12,
                minHeight: 46,
                background: g.button,
                color: c.cream,
                fontFamily: fonts.ui,
                fontSize: 14,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        )}

        <p
          style={{
            margin: "0 0 8px 2px",
            fontFamily: fonts.ui,
            fontSize: 11,
            fontWeight: 800,
            color: c.warmGray,
            textTransform: "uppercase",
            letterSpacing: 0.7,
          }}
        >
          My requests
        </p>

        {isLoading ? (
          <div style={{ padding: 28, textAlign: "center", color: c.warmGray }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div
            style={{
              background: c.white,
              borderRadius: 16,
              padding: 20,
              textAlign: "center",
              boxShadow: shadow.card,
            }}
          >
            <AlertCircle size={24} color={c.warmGray} />
            <p style={{ margin: "8px 0 0", fontFamily: fonts.ui, fontSize: 13, color: c.warmGray }}>
              No assistance requests yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {requests.map((request) => {
              const color = statusColor(request.status);
              return (
                <div
                  id={`request-${request.id}`}
                  key={request.id}
                  style={{
                    background: c.white,
                    borderRadius: 16,
                    padding: 14,
                    boxShadow: shadow.card,
                    borderLeft: `4px solid ${color}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: fonts.ui, fontSize: 14, fontWeight: 800, color: c.darkBrown }}>
                        {request.title}
                      </p>
                      <p style={{ margin: "3px 0 0", fontFamily: fonts.ui, fontSize: 11, color: c.warmGray }}>
                        {request.category} - {request.priority}
                      </p>
                    </div>
                    <span
                      style={{
                        alignSelf: "flex-start",
                        borderRadius: 999,
                        background: `${color}18`,
                        color,
                        padding: "4px 8px",
                        fontFamily: fonts.ui,
                        fontSize: 10,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", fontFamily: fonts.ui, fontSize: 12, lineHeight: 1.45, color: c.darkBrown }}>
                    {request.description}
                  </p>
                  {request.location && (
                    <p style={{ margin: "8px 0 0", fontFamily: fonts.ui, fontSize: 11, color: c.warmGray, display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={12} />
                      {request.location}
                    </p>
                  )}
                  {request.image_url && (
                    <img
                      src={request.image_url}
                      alt="Assistance evidence"
                      style={{
                        width: "100%",
                        maxHeight: 180,
                        objectFit: "cover",
                        borderRadius: 12,
                        marginTop: 10,
                        border: "1px solid rgba(139,115,85,0.18)",
                      }}
                    />
                  )}
                  {request.it_response && (
                    <div
                      style={{
                        marginTop: 10,
                        borderRadius: 12,
                        background: `${c.baseRed}0F`,
                        padding: 10,
                      }}
                    >
                      <p style={{ margin: 0, fontFamily: fonts.ui, fontSize: 11, fontWeight: 800, color: c.baseRed }}>
                        IT Support response
                      </p>
                      <p style={{ margin: "4px 0 0", fontFamily: fonts.ui, fontSize: 12, lineHeight: 1.45, color: c.darkBrown }}>
                        {request.it_response}
                      </p>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <span style={{ fontFamily: fonts.mono, fontSize: 10, color: c.warmGray }}>
                      {formatDate(request.created_at)}
                    </span>
                    {request.status === "Resolved" ? (
                      <CheckCircle2 size={15} color="#059669" />
                    ) : (
                      <Clock3 size={15} color={color} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
