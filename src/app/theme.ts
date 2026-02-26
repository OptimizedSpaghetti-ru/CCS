export const c = {
  darkestRed: "#3A0909",
  darkRed: "#4B0C0C",
  baseRed: "#5E1010",
  cream: "#FFF0C4",
  creamLight: "#FFFBEF",
  white: "#FFFFFF",
  darkBrown: "#2D1B0E",
  warmGray: "#8B7355",
  warmGrayLight: "#C4A882",
};

export const g = {
  button: `linear-gradient(135deg, ${c.darkRed} 0%, ${c.baseRed} 100%)`,
  header: `linear-gradient(180deg, ${c.darkestRed} 0%, ${c.darkRed} 100%)`,
  sentBubble: `linear-gradient(135deg, ${c.baseRed} 0%, ${c.darkRed} 100%)`,
  splash: `linear-gradient(160deg, ${c.darkestRed} 0%, ${c.darkRed} 60%, ${c.baseRed} 100%)`,
};

export const fonts = {
  display: "'Playfair Display', Georgia, serif",
  ui: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const shadow = {
  card: "0 4px 20px rgba(62,7,3,0.12)",
  cardHover: "0 8px 32px rgba(62,7,3,0.18)",
  nav: "0 -4px 20px rgba(62,7,3,0.10)",
  toast: "0 8px 32px rgba(0,0,0,0.18)",
  button: "0 4px 14px rgba(94,16,16,0.35)",
};
