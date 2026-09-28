import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, name } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Missing recipient email" });
    }

    const brevoApiKey =
      process.env.BREVO_SMTP_KEY ||
      process.env.BREVO_API_KEY ||
      process.env.BREVO_SMTP_PASSWORD;

    const senderEmail = process.env.BREVO_FROM_EMAIL || "noreply@ccsconnect.fatima.edu.ph";
    const senderName = process.env.BREVO_FROM_NAME || "CCS Connect — OLFU";

    if (!brevoApiKey) {
      console.warn("BREVO_SMTP_PASSWORD/BREVO_API_KEY is not set in server environment.");
      return res.status(200).json({
        success: false,
        warning: "Brevo credentials not configured in server environment",
      });
    }

    const recipientName = name || "Student";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to CCS Connect</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBEF; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFBEF; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid rgba(139,115,85,0.18); box-shadow: 0 4px 20px rgba(62,7,3,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #660B05 0%, #8C1007 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #FFF0C4; font-size: 26px; margin: 0; font-family: Georgia, serif; font-weight: 700; letter-spacing: 0.5px;">CCS Connect</h1>
              <p style="color: rgba(255, 240, 196, 0.85); font-size: 13px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1px;">Our Lady of Fatima University</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="color: #2D1B0E; font-size: 20px; margin: 0 0 14px;">Welcome, ${recipientName}!</h2>
              <p style="color: #6B5D52; font-size: 14px; line-height: 1.6; margin: 0 0 18px;">
                Your account registration for <strong>CCS Connect</strong> has been successfully submitted and confirmed.
              </p>
              
              <table role="presentation" width="100%" style="background-color: #FFFBEF; border-radius: 8px; border: 1px solid rgba(139,115,85,0.14); margin-bottom: 22px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; font-size: 12px; color: #8B7355; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Registered Authentication Email</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #2D1B0E; font-weight: 600; font-family: monospace;">${email}</p>
                  </td>
                </tr>
              </table>

              <p style="color: #6B5D52; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                <strong>Next Step:</strong> Your account is currently pending verification by the College of Computer Studies administration. You will be able to log in and access academic inquiries, communications, and navigation once your account status is verified.
              </p>

              <div style="text-align: center; margin: 28px 0;">
                <a href="https://ccsconnect.fatima.edu.ph/login" style="background: linear-gradient(135deg, #660B05 0%, #8C1007 100%); color: #FFF0C4; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block;">Go to Login Page</a>
              </div>

              <div style="border-top: 1px solid rgba(139,115,85,0.15); padding-top: 18px; margin-top: 24px;">
                <p style="color: #8B7355; font-size: 12px; line-height: 1.5; margin: 0 0 8px;">
                  🔒 <strong>Security Reminder:</strong> OLFU CCS Connect staff will never ask for your password. Please keep your authentication credentials safe and do not share them.
                </p>
                <p style="color: #8B7355; font-size: 12px; line-height: 1.5; margin: 0;">
                  Need assistance? Contact CCS IT Support or visit the College of Computer Studies dean's office.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8F4EA; padding: 18px 24px; text-align: center; border-top: 1px solid rgba(139,115,85,0.12);">
              <p style="margin: 0; font-size: 11px; color: #8B7355;">
                &copy; ${new Date().getFullYear()} Our Lady of Fatima University · College of Computer Studies
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name: recipientName }],
        subject: "Welcome to CCS Connect — OLFU",
        htmlContent,
      }),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.text();
      console.error("[api/send-welcome-email] Brevo error:", err);
      return res.status(200).json({ success: false, error: err });
    }

    return res.status(200).json({ success: true, message: "Email sent" });
  } catch (err: any) {
    console.error("[api/send-welcome-email] Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
