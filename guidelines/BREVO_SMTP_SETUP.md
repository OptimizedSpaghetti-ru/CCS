# Brevo SMTP Setup — Forgot Password & Password Reset

This document describes how Brevo SMTP is configured for **CCS Connect** password reset emails.

> [!NOTE]
> Student signups do **not** require email confirmation because accounts are protected by the **Admin Approval** workflow (administrators review uploaded registration documents before activation).

---

### 1. Brevo SMTP Credentials

From your **Brevo Dashboard** (`https://app.brevo.com`) under **Transactional → Settings → Configuration**:

- **SMTP Server**: `smtp-relay.brevo.com`
- **Port**: `587`
- **Login / Username**: Your Brevo SMTP login (e.g. `your-brevo-login@smtp-brevo.com`)
- **Password / SMTP Key**: Your Brevo SMTP Master Key (`xsmtpsib-...`)
- **Encryption**: TLS / STARTTLS

---

### 2. Configure Password Reset in Supabase Auth

Supabase handles token generation, rate limiting, and 1-hour expiration automatically. Connecting Brevo SMTP ensures reliable delivery to student/faculty inboxes.

1. Open your **Supabase Dashboard** (`https://supabase.com/dashboard/project/euliewsfbuwybeghnrne`).
2. Navigate to **Project Settings → Authentication → SMTP Settings**.
3. Toggle **Enable Custom SMTP** to `ON`.
4. Enter the Brevo SMTP credentials:
   - **Sender email**: Your verified Brevo sender email (e.g., `admissions@fatima.edu.ph` or your verified sender)
   - **Sender name**: `CCS Connect — OLFU`
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Username**: Your Brevo SMTP Login
   - **Password**: Your Brevo SMTP Master Key
5. Under **Authentication → URL Configuration**:
   - Add your reset password redirect URL to **Redirect URLs**:
     - Local development: `http://localhost:5173/reset-password`
     - Production: `https://<your-domain>/reset-password`
6. Under **Authentication → Email Templates → Reset Password**:
   - Set the email subject to: `Reset Your Password — CCS Connect`
   - Set the email template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password — CCS Connect</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F5EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #2A141A;">

  <!-- Outer Canvas -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F5EE; padding: 48px 16px;">
    <tr>
      <td align="center">
        
        <!-- Main Card Container (540px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(74, 21, 28, 0.08); border: 1px solid rgba(140, 16, 7, 0.1);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #8C1007 0%, #5E0B05 100%); padding: 36px 32px 32px; text-align: center;">
              
              <!-- Badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom: 12px;">
                <tr>
                  <td style="background: rgba(255, 240, 196, 0.15); border: 1px solid rgba(255, 240, 196, 0.3); border-radius: 20px; padding: 4px 14px;">
                    <span style="color: #FFF0C4; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">College of Computer Studies</span>
                  </td>
                </tr>
              </table>

              <!-- Main Title -->
              <h1 style="margin: 0; color: #FFF0C4; font-size: 26px; font-weight: 800; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                CCS CONNECT
              </h1>
              <p style="margin: 6px 0 0; color: rgba(255, 240, 196, 0.85); font-size: 13px; font-weight: 500; letter-spacing: 0.8px;">
                Our Lady of Fatima University
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              
              <!-- Greeting & Headline -->
              <h2 style="margin: 0 0 14px; font-size: 20px; font-weight: 700; color: #8C1007;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #4B4540;">
                Hello,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4B4540;">
                We received a request to reset the password for your <strong>CCS Connect</strong> portal account. Click the button below to choose a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #8C1007 0%, #6E0D05 100%); box-shadow: 0 4px 14px rgba(140, 16, 7, 0.35);">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 15px 36px; color: #FFF0C4; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px; letter-spacing: 0.3px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice Callout Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBEF; border-left: 4px solid #D97706; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #78350F;">
                      <strong>Security Notice:</strong> This link is valid for <strong>1 hour</strong>. If you did not make this request, you can safely disregard this email—your account and password remain secure.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback Plain URL Box -->
              <p style="margin: 24px 0 6px; font-size: 12px; color: #8C827A; line-height: 1.5;">
                Button not working? Copy and paste the link below into your web browser:
              </p>
              <div style="background-color: #F8F5EE; border: 1px solid rgba(140, 16, 7, 0.12); border-radius: 8px; padding: 10px 14px; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" style="font-size: 12px; color: #8C1007; text-decoration: underline; line-height: 1.4;">
                  {{ .ConfirmationURL }}
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F5EE; padding: 24px 36px; text-align: center; border-top: 1px solid rgba(140, 16, 7, 0.08);">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #5C544E;">
                College of Computer Studies · Our Lady of Fatima University
              </p>
              <p style="margin: 0; font-size: 11px; color: #9C948C; line-height: 1.4;">
                This is an automated system email from CCS Connect. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

### 3. User Flow Verification

1. User clicks **"Forgot Password?"** on the Login screen.
2. User enters their registered email address.
3. System calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
4. Supabase sends the reset email via Brevo SMTP.
5. User clicks the reset link in their email and is directed to `/reset-password`.
6. User enters and confirms a new secure password.
7. System updates password via `supabase.auth.updateUser({ password })` and redirects back to Login.
