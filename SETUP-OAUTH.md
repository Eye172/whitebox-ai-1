# Enabling “Sign in with Google / Microsoft”

Email + password already works with no setup (it’s backed by a real SQLite
database at `data/whitebox.db`). This guide turns on the social buttons.

**Why a setup step is unavoidable:** every app that offers “Sign in with Google”
— Slack, Notion, Figma, all of them — must register an app with the provider and
receive a **Client ID** and **Client Secret**. There is no way to skip this; it’s
how OAuth proves *which* app is asking for the user’s account. The full flow is
already coded here — you only need to paste two values.

---

## Google (≈ 2 minutes)

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. **Create Credentials → OAuth client ID** → Application type **Web application**.
3. Under **Authorized redirect URIs**, add exactly:
   ```
   http://localhost:4311/api/auth/oauth/google/callback
   ```
   (add your production URL too when you deploy).
4. Copy the **Client ID** and **Client secret**.
5. Create a `.env` file (copy `.env.example`) and set:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
6. Restart `npm run dev`. Click **Continue with Google** — it now redirects to the
   real Google consent screen, then lands you in the dashboard with a real
   session. The account is created in the SQLite `users` table.

## Microsoft (Entra ID)

1. <https://portal.azure.com> → **App registrations → New registration**.
2. Redirect URI (platform **Web**):
   ```
   http://localhost:4311/api/auth/oauth/microsoft/callback
   ```
3. **Certificates & secrets → New client secret**, copy the value.
4. In `.env`:
   ```
   MICROSOFT_CLIENT_ID=<Application (client) ID>
   MICROSOFT_CLIENT_SECRET=<the secret value>
   ```
5. Restart.

---

## Behind a corporate proxy (TLS inspection)

If the server-side token exchange fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`,
your network rewrites TLS certs. Two fixes (pick one):

- The dev script already runs Node with `--use-system-ca`, which trusts your
  Windows certificate store (where the corporate CA usually lives).
- Or export your corporate root CA and set `NODE_EXTRA_CA_CERTS` in `.env`.

The browser redirect to Google/Microsoft always works (the browser trusts the
system store); this only affects the server’s follow-up call to the token
endpoint.
