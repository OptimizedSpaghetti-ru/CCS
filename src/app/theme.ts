export type ThemePreference = "light" | "dark" | "system";
export type ThemeMode = "light" | "dark";

type Palette = {
  darkestRed: string;
  darkRed: string;
  baseRed: string;
  cream: string;
  creamLight: string;
  white: string;
  darkBrown: string;
  warmGray: string;
  warmGrayLight: string;
};

const paletteByMode: Record<ThemeMode, Palette> = {
  light: {
    darkestRed: "#3A0909",
    darkRed: "#4B0C0C",
    baseRed: "#5E1010",
    cream: "#FFF0C4",
    creamLight: "#FFFBEF",
    white: "#FFFFFF",
    darkBrown: "#2D1B0E",
    warmGray: "#8B7355",
    warmGrayLight: "#C4A882",
  },
  dark: {
    darkestRed: "#1C0709",
    darkRed: "#2B0B11",
    baseRed: "#8F2734",
    cream: "#FFE8D9",
    creamLight: "#12090B",
    white: "#221015",
    darkBrown: "#FFEFE6",
    warmGray: "#D8ADA0",
    warmGrayLight: "#B78379",
  },
};

type GradientTokens = {
  button: string;
  header: string;
  sentBubble: string;
  splash: string;
};

const gradientByMode: Record<ThemeMode, GradientTokens> = {
  light: {
    button: "linear-gradient(135deg, #4B0C0C 0%, #5E1010 100%)",
    header: "linear-gradient(180deg, #3A0909 0%, #4B0C0C 100%)",
    sentBubble: "linear-gradient(135deg, #5E1010 0%, #4B0C0C 100%)",
    splash: "linear-gradient(160deg, #3A0909 0%, #4B0C0C 60%, #5E1010 100%)",
  },
  dark: {
    button: "linear-gradient(135deg, #6E1A26 0%, #8F2734 100%)",
    header: "linear-gradient(180deg, #1C0709 0%, #2B0B11 100%)",
    sentBubble: "linear-gradient(135deg, #8F2734 0%, #6E1A26 100%)",
    splash: "linear-gradient(160deg, #1C0709 0%, #2B0B11 60%, #8F2734 100%)",
  },
};

type ShadowTokens = {
  card: string;
  cardHover: string;
  nav: string;
  toast: string;
  button: string;
};

const shadowByMode: Record<ThemeMode, ShadowTokens> = {
  light: {
    card: "0 4px 20px rgba(62,7,3,0.12)",
    cardHover: "0 8px 32px rgba(62,7,3,0.18)",
    nav: "0 -4px 20px rgba(62,7,3,0.10)",
    toast: "0 8px 32px rgba(0,0,0,0.18)",
    button: "0 4px 14px rgba(94,16,16,0.35)",
  },
  dark: {
    card: "0 8px 28px rgba(0,0,0,0.45)",
    cardHover: "0 12px 40px rgba(0,0,0,0.55)",
    nav: "0 -6px 24px rgba(0,0,0,0.4)",
    toast: "0 12px 36px rgba(0,0,0,0.5)",
    button: "0 8px 22px rgba(0,0,0,0.38)",
  },
};

const STORAGE_KEY = "ccs-theme-preference";
let activeMode: ThemeMode = "light";

function resolveThemeMode(preference: ThemePreference): ThemeMode {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setActiveMode(mode: ThemeMode) {
  activeMode = mode;
}

function getPalette() {
  return paletteByMode[activeMode];
}

function getGradients() {
  return gradientByMode[activeMode];
}

function getShadows() {
  return shadowByMode[activeMode];
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function persistThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, preference);
}

export function applyThemePreference(preference: ThemePreference): ThemeMode {
  const mode = resolveThemeMode(preference);
  setActiveMode(mode);

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.setProperty(
      "--app-shell-bg",
      mode === "dark" ? "#100609" : "#3E0703",
    );
    root.style.setProperty(
      "--app-container-bg",
      mode === "dark"
        ? paletteByMode.dark.creamLight
        : paletteByMode.light.creamLight,
    );
  }

  return mode;
}

export function subscribeToSystemTheme(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onChange();
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
}

export const c = new Proxy({} as Palette, {
  get(_target, prop: string) {
    return getPalette()[prop as keyof Palette];
  },
}) as Palette;

export const g = new Proxy({} as GradientTokens, {
  get(_target, prop: string) {
    return getGradients()[prop as keyof GradientTokens];
  },
}) as GradientTokens;

export const fonts = {
  display: "'Playfair Display', Georgia, serif",
  ui: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const shadow = new Proxy({} as ShadowTokens, {
  get(_target, prop: string) {
    return getShadows()[prop as keyof ShadowTokens];
  },
}) as ShadowTokens;
