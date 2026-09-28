import { supabase } from "./supabase";

export interface SendWelcomeEmailPayload {
  email: string;
  name: string;
}

/**
 * Triggers an account creation welcome email via the backend.
 * Uses the Supabase Edge Function first, then falls back to /api/send-welcome-email.
 * Client code never contains Brevo SMTP credentials.
 */
export async function sendWelcomeEmail(
  payload: SendWelcomeEmailPayload,
): Promise<{ success: boolean; error?: string }> {
  const { email, name } = payload;
  if (!email || !email.includes("@")) {
    return { success: false, error: "Invalid email address" };
  }

  // 1. Try Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke("send-welcome-email", {
      body: { email, name },
    });

    if (!error && data?.success) {
      return { success: true };
    }
  } catch (err) {
    // Non-blocking warning on client
    console.warn("[emailService] Edge function not reached or failed:", err);
  }

  // 2. Fallback to API endpoint (useful for Vercel deployment or local Vite dev)
  try {
    const res = await fetch("/api/send-welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });

    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      return { success: true, ...json };
    }
  } catch (err) {
    console.warn("[emailService] API fallback endpoint error:", err);
  }

  return {
    success: false,
    error: "Unable to dispatch welcome email through backend",
  };
}
