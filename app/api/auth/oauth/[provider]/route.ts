import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getProvider, providerCredentials, redirectUri } from "@/lib/oauth";

export const runtime = "nodejs";

/**
 * Real OAuth entry point. If the provider's credentials are configured, this
 * redirects the browser to the provider's genuine consent screen. Otherwise it
 * returns an honest 501 with setup instructions (no fake login).
 */
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const p = getProvider(provider);
  if (!p) return NextResponse.json({ error: "Unknown provider." }, { status: 404 });

  const { clientId, configured } = providerCredentials(p);
  if (!configured || !clientId) {
    return NextResponse.json(
      {
        error: `${provider[0].toUpperCase() + provider.slice(1)} sign-in isn't configured yet.`,
        detail: `Add ${p.idEnv} and ${p.secretEnv} to .env (see .env.example / SETUP-OAUTH.md), then restart. The whole flow is built and ready. Email + password works right now.`,
        needsConfig: true,
      },
      { status: 501 }
    );
  }

  const origin = new URL(req.url).origin;
  const state = randomBytes(16).toString("hex");
  const url = new URL(p.authUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri(origin, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", p.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("wb_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
