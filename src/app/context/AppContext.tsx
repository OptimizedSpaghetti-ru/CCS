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
import {
  applyThemePreference,
  getStoredThemePreference,
  persistThemePreference,
  subscribeToSystemTheme,
  type ThemeMode,
  type ThemePreference,
} from "../theme";

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
  isNewSignUp: boolean;
  authError: string | null;
  unreadMessages: number;
  unreadNotifications: number;
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, "id">) => void;
  dismissToast: (id: string) => void;
  themePreference: ThemePreference;
  resolvedThemeMode: ThemeMode;
  setThemePreference: (preference: ThemePreference) => void;
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
    regCardFile?: File;
    profilePicFile?: File;
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
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
  const [isNewSignUp, setIsNewSignUp] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    getStoredThemePreference,
  );
  const [resolvedThemeMode, setResolvedThemeMode] = useState<ThemeMode>(() =>
    applyThemePreference(getStoredThemePreference()),
  );

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
  }, []);

  useEffect(() => {
    const mode = applyThemePreference(themePreference);
    setResolvedThemeMode(mode);
    persistThemePreference(themePreference);
  }, [themePreference]);

  useEffect(() => {
    if (themePreference !== "system") return;
    return subscribeToSystemTheme(() => {
      const mode = applyThemePreference("system");
      setResolvedThemeMode(mode);
    });
  }, [themePreference]);

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
      await supabase
        .from("profiles")
        .update({ is_online: true })
        .eq("id", nextSession.user.id);

      const profile = await fetchProfile(nextSession.user.id);
      setCurrentUser(mapUserFromSession(nextSession, profile));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load profile.");
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
    setIsNewSignUp(false);
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
      let profile: Record<string, unknown> | null = null;
      for (const delayMs of [0, 400, 1200]) {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        profile = await fetchProfile(data.user.id);
        if (profile?.status === "approved") {
          break;
        }
      }

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
        error: getErrorMessage(
          profileError,
          "Unable to verify account status.",
        ),
      };
    }

    return {};
  }, []);

  /* ── File validation constants (HIGH-4 security fix) ── */
  const ALLOWED_PROFILE_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  const ALLOWED_REG_CARD_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];
  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

  const validateUploadFile = (
    file: File | undefined,
    label: string,
    allowedTypes: string[],
  ): string | null => {
    if (!file) return null;
    if (!allowedTypes.includes(file.type)) {
      return `${label} file type is not allowed.`;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      return `${label} must be 5 MB or smaller.`;
    }
    return null;
  };

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
      regCardFile?: File;
      profilePicFile?: File;
    }) => {
      try {
        /* ── Validate uploaded files before proceeding ── */
        const regCardError = validateUploadFile(
          payload.regCardFile,
          "Registration card",
          ALLOWED_REG_CARD_TYPES,
        );
        if (regCardError) return { error: regCardError };

        const profilePicError = validateUploadFile(
          payload.profilePicFile,
          "Profile picture",
          ALLOWED_PROFILE_IMAGE_TYPES,
        );
        if (profilePicError) return { error: profilePicError };

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
          let avatarUrl: string | null = null;
          let regCardUrl: string | null = null;
          let profilePicUrl: string | null = null;

          /* ── Upload files for students ── */
          if (payload.role === "student") {
            const userId = data.user.id;

            if (payload.regCardFile) {
              const ext = payload.regCardFile.name.split(".").pop() ?? "jpg";
              const regPath = `reg-cards/${userId}/reg-card.${ext}`;
              const { error: regUploadError } = await supabase.storage
                .from("student-documents")
                .upload(regPath, payload.regCardFile, { upsert: true });
              if (regUploadError) {
                return { error: regUploadError.message };
              }
              regCardUrl = supabase.storage
                .from("student-documents")
                .getPublicUrl(regPath).data.publicUrl;
            }

            if (payload.profilePicFile) {
              const ext = payload.profilePicFile.name.split(".").pop() ?? "jpg";
              const picPath = `profile-pics/${userId}/profile-pic.${ext}`;
              const { error: picUploadError } = await supabase.storage
                .from("student-documents")
                .upload(picPath, payload.profilePicFile, { upsert: true });
              if (picUploadError) {
                return { error: picUploadError.message };
              }
              avatarUrl = supabase.storage
                .from("student-documents")
                .getPublicUrl(picPath).data.publicUrl;
              profilePicUrl = avatarUrl;
            }
          }

          /* ── Upsert profile first (satisfies FK before student_documents insert) ── */
          const { error: profileUpsertError } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              email,
              full_name: `${payload.firstName} ${payload.lastName}`.trim(),
              role: payload.role,
              status: "pending",
              department: payload.department,
              year_section: payload.yearSection ?? null,
              program: payload.program ?? null,
              student_id:
                payload.role === "student" ? payload.identifier : null,
              employee_id:
                payload.role === "faculty" ? payload.identifier : null,
              ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
            });
          if (profileUpsertError) {
            return { error: profileUpsertError.message };
          }

          /* ── Insert student_documents after profile row exists ── */
          if (payload.role === "student") {
            const { error: docsInsertError } = await supabase
              .from("student_documents")
              .insert({
                user_id: data.user.id,
                reg_card_url: regCardUrl,
                profile_pic_url: profilePicUrl,
              });
            if (docsInsertError) {
              return { error: docsInsertError.message };
            }
          }

          await supabase.auth.signOut();
        }

        setIsNewSignUp(true);
        return {
          message:
            "Account created. Wait for admin approval before logging in.",
        };
      } catch (signUpError) {
        return {
          error: getErrorMessage(
            signUpError,
            "Unable to create account right now. Please try again.",
          ),
        };
      }
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
        isNewSignUp,
        authError,
        unreadMessages,
        unreadNotifications,
        toasts,
        showToast,
        dismissToast,
        themePreference,
        resolvedThemeMode,
        setThemePreference,
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
