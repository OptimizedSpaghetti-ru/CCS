import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Download,
  Loader2,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { c, fonts, g, shadow } from "../theme";
import { supabase } from "../../lib/supabase";

type Role = "student" | "faculty" | "admin";
type FilterMode = "date" | "range" | "daily" | "weekly" | "monthly" | "yearly";

type ProfileAnalyticsRow = {
  id: string;
  role: Role | null;
  status: "pending" | "approved" | "rejected" | null;
  created_at: string | null;
  is_online?: boolean | null;
  show_online_status?: boolean | null;
};

type NotificationAnalyticsRow = {
  id: string;
  type: string | null;
  title: string | null;
  target_role: string | null;
  created_by: string | null;
  author_role?: Role | null;
  created_at: string | null;
};

type MessageAnalyticsRow = {
  id: string;
  created_at: string | null;
};

type AnalyticsData = {
  profiles: ProfileAnalyticsRow[];
  notifications: NotificationAnalyticsRow[];
  messages: MessageAnalyticsRow[];
};

type SeriesRow = {
  label: string;
  users: number;
  announcements: number;
  messages: number;
  total: number;
};

const palette = {
  darkest: "#3E0703",
  dark: "#660B05",
  red: "#8C1007",
  cream: "#FFF0C4",
  gold: "#C68E17",
  muted: "#8B7355",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 42,
  border: "1px solid rgba(102,11,5,0.16)",
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#3E0703",
  fontFamily: fonts.ui,
  fontSize: 12,
  fontWeight: 700,
  padding: "0 10px",
  outline: "none",
  boxSizing: "border-box",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function endOfWeek(date: Date) {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  return endOfDay(next);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatRangeDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isWithinRange(iso: string | null, start: Date, end: Date) {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function getBucketLabel(iso: string | null, mode: FilterMode) {
  if (!iso) return "";
  const date = new Date(iso);
  if (mode === "weekly") {
    return `Week of ${formatShortDate(startOfWeek(date))}`;
  }
  if (mode === "monthly") {
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  }
  if (mode === "yearly") {
    return String(date.getFullYear());
  }
  return formatShortDate(date);
}

function asNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index: number) {
  let result = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function worksheetXml(rows: Array<Array<string | number>>) {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, cellIndex) => {
          const ref = `${columnName(cellIndex)}${rowIndex + 1}`;
          if (typeof cell === "number") {
            return `<c r="${ref}"><v>${cell}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><sheetData>${body}</sheetData></worksheet>`;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(out: number[], value: number) {
  out.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(out: number[], value: number) {
  out.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function createZip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const out: number[] = [];
  const central: number[] = [];
  const entries = Object.entries(files);

  entries.forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const offset = out.length;

    writeUint32(out, 0x04034b50);
    writeUint16(out, 20);
    writeUint16(out, 0);
    writeUint16(out, 0);
    writeUint16(out, 0);
    writeUint16(out, 0);
    writeUint32(out, crc);
    writeUint32(out, data.length);
    writeUint32(out, data.length);
    writeUint16(out, nameBytes.length);
    writeUint16(out, 0);
    out.push(...nameBytes, ...data);

    writeUint32(central, 0x02014b50);
    writeUint16(central, 20);
    writeUint16(central, 20);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, crc);
    writeUint32(central, data.length);
    writeUint32(central, data.length);
    writeUint16(central, nameBytes.length);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, 0);
    writeUint32(central, offset);
    central.push(...nameBytes);
  });

  const centralOffset = out.length;
  out.push(...central);
  writeUint32(out, 0x06054b50);
  writeUint16(out, 0);
  writeUint16(out, 0);
  writeUint16(out, entries.length);
  writeUint16(out, entries.length);
  writeUint32(out, central.length);
  writeUint32(out, centralOffset);
  writeUint16(out, 0);

  return new Blob([new Uint8Array(out)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function createWorkbook(sheets: Array<{ name: string; rows: Array<Array<string | number>> }>) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}</Relationships>`;

  return createZip({
    "[Content_Types].xml": contentTypes,
    "_rels/.rels": rels,
    "xl/workbook.xml": workbook,
    "xl/_rels/workbook.xml.rels": workbookRels,
    ...Object.fromEntries(
      sheets.map((sheet, index) => [
        `xl/worksheets/sheet${index + 1}.xml`,
        worksheetXml(sheet.rows),
      ]),
    ),
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AdminAnalytics() {
  const today = dateInputValue(new Date());
  const [filterMode, setFilterMode] = useState<FilterMode>("monthly");
  const [selectedDate, setSelectedDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(dateInputValue(startOfMonth(new Date())));
  const [rangeEnd, setRangeEnd] = useState(today);
  const [data, setData] = useState<AnalyticsData>({
    profiles: [],
    notifications: [],
    messages: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageAccessWarning, setMessageAccessWarning] = useState("");

  const dateRange = useMemo(() => {
    if (filterMode === "range") {
      const start = startOfDay(parseDateInput(rangeStart));
      const end = endOfDay(parseDateInput(rangeEnd));
      return start.getTime() <= end.getTime() ? { start, end } : { start: end, end: start };
    }

    const date = parseDateInput(selectedDate);
    if (filterMode === "weekly") return { start: startOfWeek(date), end: endOfWeek(date) };
    if (filterMode === "monthly") return { start: startOfMonth(date), end: endOfMonth(date) };
    if (filterMode === "yearly") return { start: startOfYear(date), end: endOfYear(date) };
    return { start: startOfDay(date), end: endOfDay(date) };
  }, [filterMode, rangeEnd, rangeStart, selectedDate]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setMessageAccessWarning("");

    const [profilesResult, notificationsResult, messagesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, status, created_at, is_online, show_online_status")
        .order("created_at", { ascending: true }),
      supabase
        .from("notifications")
        .select("id, type, title, target_role, created_by, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("messages")
        .select("id, created_at")
        .order("created_at", { ascending: true }),
    ]);

    if (profilesResult.error || notificationsResult.error) {
      setError(
        profilesResult.error?.message ??
          notificationsResult.error?.message ??
          "Unable to load analytics.",
      );
      setIsLoading(false);
      return;
    }

    if (messagesResult.error) {
      setMessageAccessWarning("Message activity is unavailable with the current database policies.");
    }

    const notificationRows = (notificationsResult.data ??
      []) as NotificationAnalyticsRow[];
    const authorIds = [
      ...new Set(
        notificationRows
          .map((item) => item.created_by)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    let authorRoleMap = new Map<string, Role>();

    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from("profiles")
        .select("id, role")
        .in("id", authorIds);

      authorRoleMap = new Map(
        (authors ?? [])
          .filter(
            (author: any) =>
              author.role === "admin" || author.role === "faculty",
          )
          .map((author: any) => [author.id, author.role as Role]),
      );
    }

    setData({
      profiles: (profilesResult.data ?? []) as ProfileAnalyticsRow[],
      notifications: notificationRows.map((item) => ({
        ...item,
        author_role: item.created_by
          ? authorRoleMap.get(item.created_by) ?? null
          : null,
      })),
      messages: messagesResult.error
        ? []
        : ((messagesResult.data ?? []) as MessageAnalyticsRow[]),
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-analytics-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadAnalytics)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, loadAnalytics)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadAnalytics)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAnalytics]);

  const filtered = useMemo(() => {
    const profiles = data.profiles.filter((item) =>
      isWithinRange(item.created_at, dateRange.start, dateRange.end),
    );
    const announcements = data.notifications.filter(
      (item) =>
        item.type === "announcement" &&
        isWithinRange(item.created_at, dateRange.start, dateRange.end),
    );
    const messages = data.messages.filter((item) =>
      isWithinRange(item.created_at, dateRange.start, dateRange.end),
    );

    return { profiles, announcements, messages };
  }, [data, dateRange.end, dateRange.start]);

  const roleCounts = useMemo(
    () => ({
      student: data.profiles.filter((profile) => profile.role === "student").length,
      faculty: data.profiles.filter((profile) => profile.role === "faculty").length,
      admin: data.profiles.filter((profile) => profile.role === "admin").length,
    }),
    [data.profiles],
  );

  const filteredRoleCounts = useMemo(
    () => ({
      student: filtered.profiles.filter((profile) => profile.role === "student").length,
      faculty: filtered.profiles.filter((profile) => profile.role === "faculty").length,
      admin: filtered.profiles.filter((profile) => profile.role === "admin").length,
    }),
    [filtered.profiles],
  );

  const activeUsers = useMemo(
    () =>
      data.profiles.filter(
        (profile) =>
          profile.status === "approved" &&
          profile.is_online === true &&
          profile.show_online_status !== false,
      ).length,
    [data.profiles],
  );

  const activitySeries = useMemo(() => {
    const map = new Map<string, SeriesRow>();
    const ensure = (label: string) => {
      if (!map.has(label)) {
        map.set(label, { label, users: 0, announcements: 0, messages: 0, total: 0 });
      }
      return map.get(label)!;
    };

    filtered.profiles.forEach((item) => {
      const row = ensure(getBucketLabel(item.created_at, filterMode));
      row.users += 1;
      row.total += 1;
    });
    filtered.announcements.forEach((item) => {
      const row = ensure(getBucketLabel(item.created_at, filterMode));
      row.announcements += 1;
      row.total += 1;
    });
    filtered.messages.forEach((item) => {
      const row = ensure(getBucketLabel(item.created_at, filterMode));
      row.messages += 1;
      row.total += 1;
    });

    return [...map.values()];
  }, [filterMode, filtered.announcements, filtered.messages, filtered.profiles]);

  const accountSeries = useMemo(
    () =>
      activitySeries.map((row) => ({
        label: row.label,
        accounts: row.users,
      })),
    [activitySeries],
  );

  const rolePie = useMemo(
    () => [
      { name: "Students", value: filteredRoleCounts.student, color: palette.red },
      { name: "Faculty", value: filteredRoleCounts.faculty, color: palette.dark },
      { name: "Admins", value: filteredRoleCounts.admin, color: palette.gold },
    ],
    [filteredRoleCounts],
  );

  const totalAnnouncements = data.notifications.filter(
    (item) => item.type === "announcement",
  ).length;
  const announcementAuthorSeries = useMemo(
    () => [
      {
        label: "Admin",
        value: filtered.announcements.filter(
          (item) => item.author_role === "admin",
        ).length,
      },
      {
        label: "Faculty",
        value: filtered.announcements.filter(
          (item) => item.author_role === "faculty",
        ).length,
      },
    ],
    [filtered.announcements],
  );

  const rangeLabel = `${formatRangeDate(dateRange.start)} - ${formatRangeDate(dateRange.end)}`;
  const hasChartData = activitySeries.some((row) => row.total > 0);

  const exportAnalytics = () => {
    const summaryRows: Array<Array<string | number>> = [
      ["CCS Connect Analytics Export"],
      ["Date Filter", filterMode],
      ["Date Range", rangeLabel],
      [],
      ["Metric", "Value"],
      ["Total Registered Users", data.profiles.length],
      ["Registered Users in Filter", filtered.profiles.length],
      ["Active Approved Users", activeUsers],
      ["Student Accounts", roleCounts.student],
      ["Faculty Accounts", roleCounts.faculty],
      ["Admin Accounts", roleCounts.admin],
      ["Total Announcements Posted", totalAnnouncements],
      ["Announcements in Filter", filtered.announcements.length],
      ["Messages in Filter", filtered.messages.length],
    ];

    const workbook = createWorkbook([
      { name: "Summary", rows: summaryRows },
      {
        name: "Users by Role",
        rows: [
          ["Role", "All Time", "Filtered"],
          ["Students", roleCounts.student, filteredRoleCounts.student],
          ["Faculty", roleCounts.faculty, filteredRoleCounts.faculty],
          ["Admins", roleCounts.admin, filteredRoleCounts.admin],
        ],
      },
      {
        name: "Account Creation",
        rows: [
          ["Period", "Created Accounts"],
          ...accountSeries.map((row) => [row.label, row.accounts] as Array<string | number>),
        ],
      },
      {
        name: "Announcements",
        rows: [
          ["Title", "Target Role", "Created At"],
          ...filtered.announcements.map(
            (item) =>
              [
                item.title ?? "Untitled announcement",
                item.target_role ?? "all",
                item.created_at ? new Date(item.created_at).toLocaleString() : "",
              ] as Array<string | number>,
          ),
        ],
      },
      {
        name: "Activity",
        rows: [
          ["Period", "Accounts Created", "Announcements Posted", "Messages Sent", "Total"],
          ...activitySeries.map(
            (row) =>
              [
                row.label,
                asNumber(row.users),
                asNumber(row.announcements),
                asNumber(row.messages),
                asNumber(row.total),
              ] as Array<string | number>,
          ),
        ],
      },
    ]);

    downloadBlob(workbook, `ccs-connect-analytics-${dateInputValue(new Date())}.xlsx`);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: c.creamLight,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar
        title="Analytics"
        subtitle="Admin insights from live system data"
        showBack
        backPath="/app/admin"
        rightContent={
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            aria-label="Refresh analytics"
            style={{
              width: 34,
              height: 34,
              border: "none",
              borderRadius: 9,
              background: "rgba(255,240,196,0.15)",
              color: c.cream,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? <Loader2 size={17} className="spin" /> : <RefreshCw size={16} />}
          </button>
        }
      />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 14px 22px",
          display: "grid",
          gap: 12,
        }}
      >
        <section
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: 12,
            boxShadow: shadow.card,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={16} color={palette.red} />
            <p
              style={{
                margin: 0,
                fontFamily: fonts.ui,
                fontSize: 12,
                fontWeight: 800,
                color: c.darkBrown,
              }}
            >
              Date filter
            </p>
          </div>

          <select
            value={filterMode}
            onChange={(event) => setFilterMode(event.target.value as FilterMode)}
            style={inputStyle}
          >
            <option value="date">Specific date</option>
            <option value="range">Custom date range</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {filterMode === "range" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                type="date"
                value={rangeStart}
                onChange={(event) => setRangeStart(event.target.value)}
                style={inputStyle}
                aria-label="Start date"
              />
              <input
                type="date"
                value={rangeEnd}
                onChange={(event) => setRangeEnd(event.target.value)}
                style={inputStyle}
                aria-label="End date"
              />
            </div>
          ) : (
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              style={inputStyle}
              aria-label="Selected date"
            />
          )}

          <button
            onClick={exportAnalytics}
            disabled={isLoading || Boolean(error)}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 12,
              background: g.button,
              color: c.cream,
              minHeight: 44,
              fontFamily: fonts.ui,
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: shadow.button,
              opacity: isLoading || error ? 0.7 : 1,
            }}
          >
            <Download size={16} />
            Export to Excel
          </button>

          <p
            style={{
              margin: 0,
              fontFamily: fonts.ui,
              fontSize: 11,
              color: c.warmGray,
              lineHeight: 1.4,
            }}
          >
            Showing {rangeLabel}
          </p>
        </section>

        {error && (
          <div
            style={{
              borderRadius: 14,
              padding: 12,
              background: "rgba(140,16,7,0.10)",
              color: palette.red,
              fontFamily: fonts.ui,
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {messageAccessWarning && !error && (
          <div
            style={{
              borderRadius: 14,
              padding: 12,
              background: "rgba(198,142,23,0.14)",
              color: "#7A4D00",
              fontFamily: fonts.ui,
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {messageAccessWarning}
          </div>
        )}

        {isLoading ? (
          <div
            style={{
              minHeight: 220,
              display: "grid",
              placeItems: "center",
              color: c.warmGray,
              fontFamily: fonts.ui,
              fontSize: 13,
            }}
          >
            <Loader2 size={22} className="spin" />
            Loading analytics...
          </div>
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <StatCard icon={Users} label="Total Users" value={data.profiles.length} helper={`${filtered.profiles.length} in filter`} />
              <StatCard icon={MessageSquare} label="Messages Sent" value={data.messages.length} helper={`${filtered.messages.length} in filter`} />
              <StatCard icon={BarChart3} label="Students" value={roleCounts.student} helper={`${roleCounts.faculty} faculty`} />
              <StatCard icon={Megaphone} label="Announcements" value={totalAnnouncements} helper={`${filtered.announcements.length} in filter`} />
            </section>

            <ChartCard title="Account Creation" empty={!hasChartData}>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={accountSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(102,11,5,0.10)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: palette.muted }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: palette.muted }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="accounts" stroke={palette.red} strokeWidth={3} dot={{ r: 3, fill: palette.red }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Activity Trend" empty={!hasChartData}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={activitySeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(102,11,5,0.10)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: palette.muted }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: palette.muted }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total activity"
                    stroke={palette.dark}
                    strokeWidth={3}
                    dot={{ r: 3, fill: palette.dark }}
                    activeDot={{ r: 5, fill: palette.red }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {activitySeries.slice(-4).map((row) => (
                  <div
                    key={row.label}
                    style={{
                      borderRadius: 12,
                      background: "rgba(255,240,196,0.42)",
                      border: "1px solid rgba(102,11,5,0.08)",
                      padding: "9px 10px",
                      display: "grid",
                      gap: 7,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: fonts.ui,
                          fontSize: 11,
                          fontWeight: 900,
                          color: c.darkBrown,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.label}
                      </span>
                      <span
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: 12,
                          fontWeight: 900,
                          color: palette.red,
                          flexShrink: 0,
                        }}
                      >
                        {row.total} total
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 6,
                      }}
                    >
                      <ActivityChip label="Accounts" value={row.users} color={palette.red} />
                      <ActivityChip label="Posts" value={row.announcements} color={palette.dark} />
                      <ActivityChip label="Messages" value={row.messages} color={palette.gold} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="Student vs Faculty Accounts"
              empty={rolePie.every((slice) => slice.value === 0)}
            >
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={rolePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={4}>
                    {rolePie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {rolePie.map((entry) => (
                  <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: entry.color, flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: fonts.ui,
                        fontSize: 10,
                        color: c.warmGray,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Announcements Posted By Role" empty={filtered.announcements.length === 0}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={announcementAuthorSeries}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(102,11,5,0.10)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: palette.muted }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: palette.muted }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill={palette.red} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        background: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
        boxShadow: shadow.card,
        border: "1px solid rgba(102,11,5,0.08)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "rgba(140,16,7,0.10)",
          display: "grid",
          placeItems: "center",
          marginBottom: 10,
        }}
      >
        <Icon size={16} color={palette.red} />
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: fonts.mono,
          fontSize: 24,
          fontWeight: 800,
          color: c.darkBrown,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: 800,
          color: palette.dark,
          lineHeight: 1.2,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "3px 0 0",
          fontFamily: fonts.ui,
          fontSize: 10,
          color: c.warmGray,
          lineHeight: 1.25,
        }}
      >
        {helper}
      </p>
    </div>
  );
}

function ActivityChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        borderRadius: 10,
        background: "#FFFFFF",
        padding: "7px 6px",
        border: `1px solid ${color}22`,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: fonts.mono,
          fontSize: 13,
          fontWeight: 900,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontFamily: fonts.ui,
          fontSize: 9,
          fontWeight: 800,
          color: c.warmGray,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
        boxShadow: shadow.card,
        border: "1px solid rgba(102,11,5,0.08)",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          fontFamily: fonts.ui,
          fontSize: 12,
          fontWeight: 900,
          color: c.darkBrown,
        }}
      >
        {title}
      </p>
      {empty ? (
        <div
          style={{
            height: 160,
            borderRadius: 12,
            background: "rgba(255,240,196,0.40)",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 16,
            color: c.warmGray,
            fontFamily: fonts.ui,
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          No data found for the selected date filter.
        </div>
      ) : (
        children
      )}
    </section>
  );
}
