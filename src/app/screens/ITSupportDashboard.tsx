import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  Eye,
  Filter,
  Loader2,
  MessageSquareText,
  Search,
  Wrench,
} from "lucide-react";
import { TopBar } from "../components/TopBar";
import { c, fonts, g, shadow } from "../theme";
import { supabase } from "../../lib/supabase";
import { useApp } from "../context/AppContext";

const categories = [
  "",
  "System/App Error",
  "Broken Computer",
  "Internet Issue",
  "Broken Peripheral",
  "Software Problem",
  "Hardware Problem",
  "Laboratory Equipment Issue",
  "Other Technical Concern",
];

const statuses = ["", "Pending", "In Progress", "Resolved", "Rejected/Closed"];
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
  assigned_it_support_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type RequesterProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  student_id: string | null;
  employee_id: string | null;
  department: string | null;
  year_section: string | null;
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 42,
  borderRadius: 11,
  border: "1.5px solid rgba(139,115,85,0.22)",
  background: c.white,
  color: c.darkBrown,
  fontFamily: fonts.ui,
  fontSize: 13,
  padding: "0 11px",
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

function roleLabel(role: string | null | undefined) {
  if (role === "it_support") return "IT Support";
  if (!role) return "User";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function ITSupportDashboard() {
  const { currentUser, showToast } = useApp();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, RequesterProfile>>({});
  const [selected, setSelected] = useState<AssistanceRequest | null>(null);
  const [status, setStatus] = useState<AssistanceStatus>("Pending");
  const [priority, setPriority] = useState("Medium");
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("assistance_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as AssistanceRequest[];
    setRequests(rows);

    const requesterIds = [...new Set(rows.map((request) => request.requester_id))];
    if (requesterIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, student_id, employee_id, department, year_section")
        .in("id", requesterIds);

      setProfiles(
        Object.fromEntries(
          ((profileRows ?? []) as RequesterProfile[]).map((profile) => [
            profile.id,
            profile,
          ]),
        ),
      );
    } else {
      setProfiles({});
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("it-support-assistance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assistance_requests" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as AssistanceRequest;
            showToast({
              type: "announcement",
              title: "New assistance request",
              preview: row.title,
              time: "Now",
            });
          }
          loadRequests();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRequests, showToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((request) => {
      const profile = profiles[request.requester_id];
      const haystack = [
        request.title,
        request.category,
        request.description,
        request.location ?? "",
        request.requester_name,
        profile?.email ?? "",
        profile?.student_id ?? "",
        profile?.employee_id ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesStatus = !statusFilter || request.status === statusFilter;
      const matchesCategory = !categoryFilter || request.category === categoryFilter;
      const matchesPriority = !priorityFilter || request.priority === priorityFilter;
      const matchesDate =
        !dateFilter ||
        new Date(request.created_at).toISOString().slice(0, 10) === dateFilter;
      return (
        matchesQuery &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority &&
        matchesDate
      );
    });
  }, [categoryFilter, dateFilter, priorityFilter, profiles, query, requests, statusFilter]);

  const openRequest = (request: AssistanceRequest) => {
    setSelected(request);
    setStatus(request.status);
    setPriority(request.priority);
    setRemarks(request.it_response ?? "");
    setFeedback("");
    setError("");
  };

  const updateRequest = async () => {
    if (!selected) return;
    setIsSaving(true);
    setError("");
    setFeedback("");

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("assistance_requests")
      .update({
        status,
        priority,
        it_response: remarks.trim() || null,
        assigned_it_support_id: currentUser.id,
        updated_at: now,
        resolved_at: status === "Resolved" ? now : null,
      })
      .eq("id", selected.id);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    await supabase.from("notifications").insert({
      title: status === "Resolved" ? "Assistance request resolved" : "Assistance request updated",
      body: remarks.trim()
        ? remarks.trim()
        : `Your request "${selected.title}" is now ${status}.`,
      type: "announcement",
      target_role: selected.requester_role,
      recipient_id: selected.requester_id,
      created_by: currentUser.id,
    });

    setFeedback("Request updated and requester notified.");
    showToast({
      type: "announcement",
      title: "Request updated",
      preview: selected.title,
      time: "Now",
    });
    await loadRequests();
    setSelected((prev) => (prev ? { ...prev, status, priority, it_response: remarks } : prev));
    setIsSaving(false);
  };

  const counts = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "Pending").length,
      active: requests.filter((request) => request.status === "In Progress").length,
      resolved: requests.filter((request) => request.status === "Resolved").length,
    }),
    [requests],
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar title="IT Support" subtitle="Assistance management" />
      <div style={{ flex: 1, overflowY: "auto", background: c.creamLight, padding: 16 }}>
        <div
          style={{
            background: g.header,
            borderRadius: 16,
            padding: 16,
            boxShadow: shadow.card,
            color: c.cream,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
              <p style={{ margin: 0, fontFamily: fonts.display, fontSize: 19, fontWeight: 800 }}>
                Assistance Queue
              </p>
              <p style={{ margin: "2px 0 0", fontFamily: fonts.ui, fontSize: 12, color: c.warmGrayLight }}>
                {counts.pending} pending, {counts.active} in progress, {counts.resolved} resolved
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            background: c.white,
            borderRadius: 16,
            padding: 12,
            boxShadow: shadow.card,
            display: "grid",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={15} color={c.baseRed} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search requests"
              style={{ ...fieldStyle, border: "none", minHeight: 38, padding: 0 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={fieldStyle}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item || "All statuses"}
                </option>
              ))}
            </select>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} style={fieldStyle}>
              <option value="">All priorities</option>
              {priorities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={fieldStyle}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item || "All categories"}
                </option>
              ))}
            </select>
            <input value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} type="date" style={fieldStyle} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: c.warmGray }}>
            <Filter size={13} />
            <span style={{ fontFamily: fonts.ui, fontSize: 11 }}>
              Showing {filtered.length} of {requests.length}
            </span>
          </div>
        </div>

        {error && (
          <p style={{ margin: "0 0 10px", fontFamily: fonts.ui, fontSize: 12, color: "#B91C1C" }}>
            {error}
          </p>
        )}

        {isLoading ? (
          <div style={{ padding: 32, textAlign: "center", color: c.warmGray }}>
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: c.white, borderRadius: 16, padding: 22, textAlign: "center", boxShadow: shadow.card }}>
            <CheckCircle2 size={24} color="#059669" />
            <p style={{ margin: "8px 0 0", fontFamily: fonts.ui, fontSize: 13, color: c.warmGray }}>
              No requests match the current filters.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((request) => {
              const color = statusColor(request.status);
              return (
                <motion.button
                  key={request.id}
                  onClick={() => openRequest(request)}
                  whileHover={{
                    y: -2,
                    scale: 1.01,
                    boxShadow: "0 10px 28px rgba(62,7,3,0.16)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  style={{
                    border: "none",
                    textAlign: "left",
                    background: c.white,
                    borderRadius: 16,
                    padding: 14,
                    boxShadow: shadow.card,
                    borderLeft: `4px solid ${color}`,
                    cursor: "pointer",
                    transformOrigin: "center",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: fonts.ui, fontSize: 14, fontWeight: 800, color: c.darkBrown }}>
                        {request.title}
                      </p>
                      <p style={{ margin: "3px 0 0", fontFamily: fonts.ui, fontSize: 11, color: c.warmGray }}>
                        {request.requester_name} - {roleLabel(request.requester_role)}
                      </p>
                    </div>
                    <span style={{ borderRadius: 999, background: `${color}18`, color, padding: "4px 8px", fontFamily: fonts.ui, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap", alignSelf: "flex-start" }}>
                      {request.status}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", fontFamily: fonts.ui, fontSize: 12, color: c.warmGray }}>
                    {request.category} - {request.priority} - {formatDate(request.created_at)}
                  </p>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            onClick={() => setSelected(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 160,
              background: "rgba(20,12,6,0.58)",
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(3px)",
            }}
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                width: "min(100%, 360px)",
                aspectRatio: "1 / 1",
                maxHeight: "min(86vh, 360px)",
                overflowY: "auto",
                background: c.white,
                borderRadius: 18,
                boxShadow: "0 18px 46px rgba(0,0,0,0.32)",
                padding: 14,
                border: "1px solid rgba(255,240,196,0.42)",
              }}
            >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontFamily: fonts.display, fontSize: 18, fontWeight: 800, color: c.darkBrown }}>
                  {selected.title}
                </p>
                <p style={{ margin: "3px 0 0", fontFamily: fonts.ui, fontSize: 12, color: c.warmGray }}>
                  {selected.category} - {formatDate(selected.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close request details"
                style={{
                  border: "none",
                  background: `${c.baseRed}10`,
                  color: c.baseRed,
                  borderRadius: 10,
                  width: 34,
                  height: 34,
                  fontWeight: 900,
                  cursor: "pointer",
                  transition: "transform 0.16s ease, background 0.16s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "scale(1.05)";
                  event.currentTarget.style.background = `${c.baseRed}18`;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "scale(1)";
                  event.currentTarget.style.background = `${c.baseRed}10`;
                }}
              >
                x
              </button>
            </div>

            <div style={{ marginTop: 12, borderRadius: 14, background: c.creamLight, padding: 12 }}>
              {(() => {
                const profile = profiles[selected.requester_id];
                return (
                  <>
                    <p style={{ margin: 0, fontFamily: fonts.ui, fontSize: 12, fontWeight: 800, color: c.darkBrown }}>
                      {profile?.full_name || selected.requester_name}
                    </p>
                    <p style={{ margin: "3px 0 0", fontFamily: fonts.ui, fontSize: 11, color: c.warmGray }}>
                      {roleLabel(profile?.role || selected.requester_role)} - {profile?.email || "No email"}
                    </p>
                    <p style={{ margin: "3px 0 0", fontFamily: fonts.ui, fontSize: 11, color: c.warmGray }}>
                      {profile?.student_id || profile?.employee_id || "No ID"} - {profile?.department || "College of Computer Studies"}
                    </p>
                  </>
                );
              })()}
            </div>

            <p style={{ margin: "12px 0 0", fontFamily: fonts.ui, fontSize: 13, color: c.darkBrown, lineHeight: 1.5 }}>
              {selected.description}
            </p>
            {selected.location && (
              <p style={{ margin: "8px 0 0", fontFamily: fonts.ui, fontSize: 12, color: c.warmGray }}>
                Location: {selected.location}
              </p>
            )}
            {selected.image_url && (
              <a href={selected.image_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <img
                  src={selected.image_url}
                  alt="Assistance evidence"
                  style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 14, marginTop: 12, border: "1px solid rgba(139,115,85,0.18)" }}
                />
                <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, fontFamily: fonts.ui, fontSize: 12, color: c.baseRed, fontWeight: 800 }}>
                  <Eye size={13} />
                  View evidence
                </span>
              </a>
            )}

            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <select value={status} onChange={(event) => setStatus(event.target.value as AssistanceStatus)} style={fieldStyle}>
                {statuses.filter(Boolean).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select value={priority} onChange={(event) => setPriority(event.target.value)} style={fieldStyle}>
                {priorities.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Response or remarks"
                style={{ ...fieldStyle, minHeight: 96, paddingTop: 11, resize: "vertical" }}
              />
              {feedback && (
                <p style={{ margin: 0, fontFamily: fonts.ui, fontSize: 12, color: "#059669" }}>
                  {feedback}
                </p>
              )}
              <button
                onClick={updateRequest}
                disabled={isSaving}
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
                  opacity: isSaving ? 0.7 : 1,
                  cursor: isSaving ? "default" : "pointer",
                  transition: "transform 0.16s ease, box-shadow 0.16s ease",
                }}
                onMouseEnter={(event) => {
                  if (isSaving) return;
                  event.currentTarget.style.transform = "translateY(-1px)";
                  event.currentTarget.style.boxShadow = shadow.button;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.boxShadow = "none";
                }}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <MessageSquareText size={16} />}
                {isSaving ? "Saving..." : "Update Request"}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
