import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Real OAuth entry point. If provider credentials are configured via env vars,
 * this redirects to the provider's genuine authorization screen. Otherwise it
 * returns an honest 501 (not a fake login) — because real OAuth also needs
 * outbound network access to the provider, which this environment blocks.
 */
const PROVIDERS: Record<string, { authUrl: string; scope: string; env: string }> = {
  google: { authUrl: "https://accounts.google.com/o/oauth2/v2/auth", scope: "openid email profile", env: "GOOGLE_CLIENT_ID" },
  github: { authUrl: "https://github.com/login/oauth/authorize", scope: "read:user user:email", env: "GITHUB_CLIENT_ID" },
  microsoft: { authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", scope: "openid email profile", env: "MICROSOFT_CLIENT_ID" },
};

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const cfg = PROVIDERS[provider];
  if (!cfg) return NextResponse.json({ error: "Unknown provider." }, { status: 404 });

  const clientId = process.env[cfg.env];
  if (!clientId) {
    return NextResponse.json(
      {
        error: `${provider} sign-in isn't configured on this deployment.`,
        detail: `Set ${cfg.env} and ${cfg.env.replace("_ID", "_SECRET")} in .env, and note that OAuth needs outbound network access to ${provider}. Use email + password (fully working, SQL-backed) in the meantime.`,
        needsConfig: true,
      },
      { status: 501 }
    );
  }

  const origin = new URL(req.url).origin;
  const url = new URL(cfg.authUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/oauth/${provider}/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scope);
  url.searchParams.set("state", crypto.randomUUID());
  return NextResponse.redirect(url.toString());
}
