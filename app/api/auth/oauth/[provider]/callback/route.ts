import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProvider, providerCredentials, redirectUri } from "@/lib/oauth";
import { findUserByEmail, createUser, createSession, SESSION_COOKIE } from "@/lib/auth-server";

export const runtime = "nodejs";

/**
 * Real OAuth callback. Exchanges the authorization code for tokens, fetches the
 * user's profile, upserts them into the SQLite users table, and starts a real
 * session — the same session the rest of the app uses.
 */
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const p = getProvider(provider);
  const origin = new URL(req.url).origin;
  const fail = (msg: string) => NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);

  if (!p) return fail("Unknown provider.");
  const { clientId, clientSecret, configured } = providerCredentials(p);
  if (!configured || !clientId || !clientSecret) return fail(`${provider} is not configured.`);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");
  if (providerError) return fail(`${provider} returned: ${providerError}`);
  if (!code) return fail("No authorization code returned.");

  // CSRF: state must match the cookie we set at start
  const jar = await cookies();
  const expectedState = jar.get("wb_oauth_state")?.value;
  if (!expectedState || expectedState !== state) return fail("State mismatch — please try signing in again.");

  try {
    // 1) exchange code for tokens
    const tokenRes = await fetch(p.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(origin, provider),
      }),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      return fail(`Token exchange failed (${tokenRes.status}). ${t.slice(0, 120)}`);
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return fail("No access token received.");

    // 2) fetch the user's profile
    const infoRes = await fetch(p.userInfoUrl, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!infoRes.ok) return fail(`Couldn't fetch profile (${infoRes.status}).`);
    const info = (await infoRes.json()) as Record<string, unknown>;
    const { email, name } = p.parse(info);
    if (!email) return fail("Provider did not return an email address.");

    // 3) upsert user + start a real session
    const existing = findUserByEmail(email);
    const user = existing ?? createUser(email, name || email.split("@")[0], null, provider);
    const { token, maxAge } = createSession(user.id);

    const res = NextResponse.redirect(`${origin}/hr/dashboard`);
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge });
    res.cookies.set("wb_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network error";
    // The common failure on TLS-inspecting corporate networks:
    return fail(
      /certificate|self.signed|UNABLE_TO_VERIFY/i.test(msg)
        ? "TLS error reaching the provider. Run the dev server with --use-system-ca (already set in the dev script) or set NODE_EXTRA_CA_CERTS to your corporate root CA."
        : `OAuth error: ${msg}`
    );
  }
}
