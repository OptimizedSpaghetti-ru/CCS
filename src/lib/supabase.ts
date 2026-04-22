import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

const isNativePlatform = Capacitor.isNativePlatform();

const webStorage: SupportedStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

const nativeStorage: SupportedStorage = {
  getItem: async (key) => {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // Fallback to localStorage when native preferences access fails.
    }

    if (typeof window !== "undefined") {
      return window.localStorage.getItem(key);
    }

    return null;
  },
  setItem: async (key, value) => {
    try {
      await Preferences.set({ key, value });
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    }
  },
  removeItem: async (key) => {
    try {
      await Preferences.remove({ key });
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "ccs-connect-auth",
    storage: isNativePlatform ? nativeStorage : webStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
