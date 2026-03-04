import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export interface ToastData {
  id: string;
  type: "message" | "announcement" | "event" | "error";
  title: string;
  preview: string;
  time: string;
}

interface AppContextType {
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  authError: string | null;
  unreadMessages: number;
  unreadNotifications: number;
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, "id">) => void;
  dismissToast: (id: string) => void;
  signIn: (identifier: string, password: string) => Promise<{ error?: string }>;
  signUp: (payload: {
    firstName: string;
    lastName: string;
    identifier: string;
    email: string;
    department: string;
    yearSection?: string;
    program?: string;
    role: "student" | "faculty";
    password: string;
  }) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  currentUser: {
    name: string;
    role: "student" | "faculty" | "admin";
    status: "pending" | "approved" | "rejected";
    id: string;
    identifier: string;
    department: string;
    yearSection: string;
    email: string;
    avatar: string;
    initials: string;
  };
}

const AppContext = createContext<AppContextType | null>(null);

const FALLBACK_USER: AppContextType["currentUser"] = {
  name: "",
  role: "student",
  status: "pending",
  id: "",
  identifier: "",
  department: "",
  yearSection: "",
  email: "",
  avatar: "",
  initials: "",
};

function getInitials(name: string) {
  const tokens = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (tokens.length === 0) return "U";
  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("");
}

function normalizeRole(value: unknown): "student" | "faculty" | "admin" {
  if (value === "admin" || value === "faculty") return value;
  return "student";
}

function normalizeStatus(value: unknown): "pending" | "approved" | "rejected" {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as Record<string, unknown> | null;
}

function mapUserFromSession(
  session: Session | null,
  profile: Record<string, unknown> | null,
): AppContextType["currentUser"] {
  if (!session?.user) {
    return FALLBACK_USER;
  }

  const metadata = session.user.user_metadata ?? {};
  const fullNameFromProfile =
    typeof profile?.full_name === "string" ? profile.full_name : "";
  const fullNameFromMetadata =
    typeof metadata.full_name === "string" ? metadata.full_name : "";
  const fullName =
    fullNameFromProfile ||
    fullNameFromMetadata ||
    `${String(metadata.first_name ?? "").trim()} ${String(
      metadata.last_name ?? "",
    ).trim()}`.trim() ||
    session.user.email ||
    "User";

  const identifier =
    (typeof profile?.student_id === "string" && profile.student_id) ||
    (typeof profile?.employee_id === "string" && profile.employee_id) ||
    (typeof profile?.id_number === "string" && profile.id_number) ||
    (typeof metadata.id_number === "string" && metadata.id_number) ||
    "";

  const department =
    (typeof profile?.department === "string" && profile.department) ||
    (typeof metadata.department === "string" && metadata.department) ||
    "College of Computer Studies";

  const yearSection =
    (typeof profile?.year_section === "string" && profile.year_section) ||
    (typeof metadata.year_section === "string" && metadata.year_section) ||
    "";

  const avatar =
    (typeof profile?.avatar_url === "string" && profile.avatar_url) ||
    (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
    "";

  const role = normalizeRole(profile?.role ?? metadata.role);
  const status = normalizeStatus(profile?.status ?? metadata.status);

  return {
    name: fullName,
    role,
    status,
    id: session.user.id,
    identifier,
    department,
    yearSection,
    email: session.user.email ?? "",
    avatar,
    initials: getInitials(fullName),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] =
    useState<AppContextType["currentUser"]>(FALLBACK_USER);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  /* ── Fetch unread counts ─────────────────────────────────── */
  const refreshUnreadCounts = useCallback(async (userId: string) => {
    if (!userId) return;
    // Unread messages: messages where I'm a member of the conversation but not the sender, and read_at is null
    const { data: myConvos } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);
    if (myConvos && myConvos.length > 0) {
      const ids = myConvos.map((r: any) => r.conversation_id);
      const { count: msgCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .neq("sender_id", userId)
        .is("read_at", null);
      setUnreadMessages(msgCount ?? 0);
    } else {
      setUnreadMessages(0);
    }
    // Unread notifications: notifications for this user (or role-broadcast) without a read row in notification_status
    const { count: notifCount } = await supabase
      .rpc("count_unread_notifications", { p_user_id: userId })
      .maybeSingle()
      .then((res) => ({ count: (res.data as any) ?? 0 }));
    setUnreadNotifications(typeof notifCount === "number" ? notifCount : 0);
  }, []);

  const showToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const hydrateUser = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setAuthError(null);

    if (!nextSession?.user) {
      setCurrentUser(FALLBACK_USER);
      return;
    }

    try {
      const profile = await fetchProfile(nextSession.user.id);
      setCurrentUser(mapUserFromSession(nextSession, profile));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load profile.";
      setAuthError(message);
      setCurrentUser(mapUserFromSession(nextSession, null));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      await hydrateUser(data.session);
      if (mounted) {
        setIsLoadingAuth(false);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      hydrateUser(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser]);

  /* ── Real-time unread badge refresh ──────────────────────── */
  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    refreshUnreadCounts(uid);

    const msgCh = supabase
      .channel("unread-msgs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          refreshUnreadCounts(uid);
        },
      )
      .subscribe();

    const notifCh = supabase
      .channel("unread-notifs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          refreshUnreadCounts(uid);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_status" },
        () => {
          refreshUnreadCounts(uid);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgCh);
      supabase.removeChannel(notifCh);
    };
  }, [session?.user?.id, refreshUnreadCounts]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized.includes("@")) {
      return { error: "Please use your email address to sign in." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    try {
      const profile = await fetchProfile(data.user.id);
      const status = normalizeStatus(
        profile?.status ?? data.user.user_metadata?.status,
      );
      if (status !== "approved") {
        await supabase.auth.signOut();
        return {
          error:
            "Your account is pending admin approval. Please wait for verification.",
        };
      }
    } catch (profileError) {
      return {
        error:
          profileError instanceof Error
            ? profileError.message
            : "Unable to verify account status.",
      };
    }

    return {};
  }, []);

  const signUp = useCallback(
    async (payload: {
      firstName: string;
      lastName: string;
      identifier: string;
      email: string;
      department: string;
      yearSection?: string;
      program?: string;
      role: "student" | "faculty";
      password: string;
    }) => {
      const email = payload.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: payload.password,
        options: {
          data: {
            first_name: payload.firstName,
            last_name: payload.lastName,
            full_name: `${payload.firstName} ${payload.lastName}`.trim(),
            role: payload.role,
            status: "pending",
            id_number: payload.identifier,
            department: payload.department,
            year_section: payload.yearSection ?? "",
            program: payload.program ?? "",
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("rate limit")) {
          return {
            error:
              "Too many sign-up attempts. Please wait a few minutes before trying again.",
          };
        }
        return { error: error.message };
      }

      if (data.user && data.session) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          full_name: `${payload.firstName} ${payload.lastName}`.trim(),
          role: payload.role,
          status: "pending",
          department: payload.department,
          year_section: payload.yearSection ?? null,
          program: payload.program ?? null,
          student_id: payload.role === "student" ? payload.identifier : null,
          employee_id: payload.role === "faculty" ? payload.identifier : null,
        });

        await supabase.auth.signOut();
      }

      return {
        message: "Account created. Wait for admin approval before logging in.",
      };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session: latestSession },
    } = await supabase.auth.getSession();
    await hydrateUser(latestSession);
  }, [hydrateUser]);

  return (
    <AppContext.Provider
      value={{
        isLoadingAuth,
        isAuthenticated: Boolean(session?.user),
        isApproved: currentUser.status === "approved",
        authError,
        unreadMessages,
        unreadNotifications,
        toasts,
        showToast,
        dismissToast,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        currentUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
