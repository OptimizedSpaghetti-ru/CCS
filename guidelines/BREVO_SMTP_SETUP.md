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
