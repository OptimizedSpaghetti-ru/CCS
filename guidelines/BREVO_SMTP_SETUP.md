# Brevo SMTP & Transactional Email Setup

This document describes how Brevo SMTP is configured for **CCS Connect**.

---

### 1. Brevo SMTP Credentials

From your **Brevo Dashboard** (`https://app.brevo.com`) under **Transactional → Settings → Configuration**:

- **SMTP Server**: `smtp-relay.brevo.com`
- **Port**: `587`
- **Login / Username**: Your Brevo SMTP login (e.g. `your-brevo-login@smtp-brevo.com`)
- **Password / SMTP Key**: Your Brevo SMTP Master Key (`xsmtpsib-...`)
- **Encryption**: TLS / STARTTLS

---

### 2. Configure Password Reset Email (Supabase Auth)

Supabase handles password reset tokens, one-time link generation, and token expiration automatically.
To send the password reset emails through Brevo:

1. Open your **Supabase Dashboard** (`https://supabase.com/dashboard/project/euliewsfbuwybeghnrne`).
2. Navigate to **Project Settings → Authentication → SMTP Settings**.
3. Toggle **Enable Custom SMTP** to `ON`.
4. Fill in the Brevo SMTP details:
   - **Sender email**: Your verified Brevo sender email (e.g., `admissions@fatima.edu.ph` or your verified sender)
   - **Sender name**: `CCS Connect — OLFU`
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Username**: Your Brevo SMTP Login
   - **Password**: Your Brevo SMTP Key
5. Under **Authentication → Email Templates → Reset Password**:
   - Set the email template:
     ```html
     <h2>Reset Your Password - CCS Connect</h2>
     <p>Hello,</p>
     <p>We received a request to reset the password for your CCS Connect account.</p>
     <p><a href="{{ .ConfirmationURL }}" style="background-color:#8C1007;color:#FFF0C4;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Reset Password</a></p>
     <p>This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this message.</p>
     <p>Our Lady of Fatima University · College of Computer Studies</p>
     ```
6. Under **Authentication → URL Configuration**:
   - Ensure `https://<your-domain>/reset-password` (or `http://localhost:5173/reset-password`) is listed in **Redirect URLs**.

---

### 3. Server Environment Variables for Welcome Emails

For server-side sending of transactional welcome emails (via Supabase Edge Function or Vercel serverless):

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_smtp_login
BREVO_SMTP_PASSWORD=your_brevo_smtp_key
BREVO_FROM_EMAIL=your_verified_sender_email
BREVO_FROM_NAME=CCS Connect — OLFU
```

> [!IMPORTANT]
> Never prefix these variables with `VITE_`. They must remain server-side only to ensure secrets are never bundled into the browser or Android Capacitor application.

---

### 4. Signup Confirmation & Welcome Email

#### Does sign-up email work automatically?
**Yes.** As soon as a user submits the 2-step registration in the app, the system automatically triggers the transactional welcome email (`sendWelcomeEmail`) via Brevo to their registered email address.

#### Should you enable "Confirm sign up" (Email Confirmation) in Supabase?

> [!WARNING]
> **Recommended: Keep "Confirm email" DISABLED (OFF) in Supabase Auth.**
> 
> **Why?**
> The application uses a 2-step registration process where students immediately upload their **Registration Card** and **1x1 photo** to Supabase Storage:
> - Storage RLS requires an authenticated session (`auth.uid() = user_id`).
> - When "Confirm email" is **OFF**, Supabase issues an active session upon sign-up, allowing the app to upload the student's documents and create the profile row before logging them out (`signOut`) to await admin approval.
> - If "Confirm email" is **ON**, Supabase returns a `null` session until the user clicks the email link, which blocks document uploads to Storage during registration.
>
> Your system's verification is already secured by the **Admin Approval** workflow (accounts remain in `pending` status and cannot log in until an administrator verifies the uploaded documents).

---

### 5. Supabase "Confirm Signup" Email Template (If Enabled)

If you still choose to enable **Confirm email** in Supabase under **Authentication → Providers → Email → Confirm email**:

Under **Authentication → Email Templates → Confirm signup**, set the template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirm Your Email - CCS Connect</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFBEF; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFBEF; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid rgba(139,115,85,0.18); box-shadow: 0 4px 20px rgba(62,7,3,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #660B05 0%, #8C1007 100%); padding: 30px 24px; text-align: center;">
              <h1 style="color: #FFF0C4; font-size: 26px; margin: 0; font-family: Georgia, serif; font-weight: 700;">CCS Connect</h1>
              <p style="color: rgba(255, 240, 196, 0.85); font-size: 13px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1px;">Our Lady of Fatima University</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="color: #2D1B0E; font-size: 20px; margin: 0 0 14px;">Confirm Your Email Address</h2>
              <p style="color: #6B5D52; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                Thank you for registering with <strong>CCS Connect</strong>. Please confirm your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #660B05 0%, #8C1007 100%); color: #FFF0C4; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block;">Confirm Email Address</a>
              </div>

              <p style="color: #6B5D52; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
                Once confirmed, your account will be placed into the verification queue for administrator approval.
              </p>

              <div style="border-top: 1px solid rgba(139,115,85,0.15); padding-top: 16px; margin-top: 20px;">
                <p style="color: #8B7355; font-size: 12px; line-height: 1.5; margin: 0;">
                  If you did not sign up for a CCS Connect account, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8F4EA; padding: 16px 24px; text-align: center; border-top: 1px solid rgba(139,115,85,0.12);">
              <p style="margin: 0; font-size: 11px; color: #8B7355;">
                &copy; Our Lady of Fatima University · College of Computer Studies
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
