import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    {
      name: 'api-dev-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/send-welcome-email' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const { email, name } = JSON.parse(body || '{}');
                const brevoKey =
                  process.env.BREVO_SMTP_KEY ||
                  process.env.BREVO_API_KEY ||
                  process.env.BREVO_SMTP_PASSWORD;
                const senderEmail =
                  process.env.BREVO_FROM_EMAIL ||
                  'noreply@ccsconnect.fatima.edu.ph';
                const senderName =
                  process.env.BREVO_FROM_NAME || 'CCS Connect — OLFU';

                if (!brevoKey) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      success: false,
                      warning: 'Brevo key not configured in environment',
                    }),
                  );
                  return;
                }

                const brevoRes = await fetch(
                  'https://api.brevo.com/v3/smtp/email',
                  {
                    method: 'POST',
                    headers: {
                      Accept: 'application/json',
                      'Content-Type': 'application/json',
                      'api-key': brevoKey,
                    },
                    body: JSON.stringify({
                      sender: { name: senderName, email: senderEmail },
                      to: [{ email, name: name || 'Student' }],
                      subject: 'Welcome to CCS Connect — OLFU',
                      htmlContent: `<h2>Welcome to CCS Connect, ${name || 'Student'}!</h2><p>Your account registration has been confirmed and is pending admin approval.</p>`,
                    }),
                  },
                );

                const data = await brevoRes.json().catch(() => ({}));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: brevoRes.ok, data }));
              } catch (e: any) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
