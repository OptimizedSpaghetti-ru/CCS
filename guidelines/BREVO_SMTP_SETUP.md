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
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password - CCS Connect</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBEF; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFBEF; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid rgba(140, 16, 7, 0.12); box-shadow: 0 4px 20px rgba(74, 21, 28, 0.06); overflow: hidden;" cellspacing="0" cellpadding="0">
          
          <!-- Header with School Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #8C1007 0%, #4A151C 100%); padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; color: #FFF0C4; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">CCS CONNECT</h1>
              <p style="margin: 6px 0 0; color: rgba(255, 240, 196, 0.85); font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Our Lady of Fatima University</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px; color: #2A141A;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #8C1007;">Password Reset Request</h2>
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: #4B4540;">
                We received a request to reset the password for your CCS Connect account. Click the button below to set a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #8C1007 0%, #6E0D05 100%);">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #FFF0C4; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: #78716C;">
                This link will expire in <strong>1 hour</strong>. If you did not request this password reset, please ignore this message. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FFF8E7; padding: 20px 32px; text-align: center; border-top: 1px solid rgba(140, 16, 7, 0.08);">
              <p style="margin: 0; font-size: 12px; color: #78716C;">
                College of Computer Studies · Our Lady of Fatima University
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
