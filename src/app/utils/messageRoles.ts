export type MessageRole = "student" | "faculty" | "admin" | "it_support";
export type ConversationRole = MessageRole | "group";

export const MESSAGE_ROLE_COLORS: Record<ConversationRole, string> = {
  admin: "#7C3AED",
  faculty: "#8C1007",
  student: "#059669",
  it_support: "#0F766E",
  group: "#1D4ED8",
};

export function normalizeMessageRole(value: unknown): MessageRole {
  if (typeof value !== "string") return "student";
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (
    normalized === "admin" ||
    normalized === "faculty" ||
    normalized === "student" ||
    normalized === "it_support"
  ) {
    return normalized;
  }
  return "student";
}

export function roleLabel(role: string) {
  const normalized = role === "group" ? "group" : normalizeMessageRole(role);
  if (normalized === "admin") return "Admin";
  if (normalized === "faculty") return "Faculty";
  if (normalized === "it_support") return "IT Support";
  if (normalized === "group") return "Group";
  return "Student";
}
