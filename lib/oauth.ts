/**
 * Real OAuth 2.0 provider config. GitHub intentionally omitted — this is a
 * hiring product, not a developer tool. Credentials come from env; when present,
 * the full authorization-code flow (start → callback → token → profile) runs.
 */
export interface OAuthProvider {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  idEnv: string;
  secretEnv: string;
  /** map the provider's userinfo JSON → { email, name } */
  parse: (info: Record<string, unknown>) => { email: string; name: string };
}

export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: "openid email profile",
    idEnv: "GOOGLE_CLIENT_ID",
    secretEnv: "GOOGLE_CLIENT_SECRET",
    parse: (i) => ({ email: String(i.email ?? ""), name: String(i.name ?? i.email ?? "") }),
  },
  microsoft: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
    scope: "openid email profile",
    idEnv: "MICROSOFT_CLIENT_ID",
    secretEnv: "MICROSOFT_CLIENT_SECRET",
    parse: (i) => ({
      email: String(i.email ?? i.upn ?? i.preferred_username ?? ""),
      name: String(i.name ?? i.email ?? ""),
    }),
  },
};

export function getProvider(key: string): OAuthProvider | undefined {
  return OAUTH_PROVIDERS[key];
}

export function providerCredentials(p: OAuthProvider) {
  const clientId = process.env[p.idEnv];
  const clientSecret = process.env[p.secretEnv];
  return { clientId, clientSecret, configured: !!(clientId && clientSecret) };
}

export function redirectUri(origin: string, provider: string) {
  return `${origin}/api/auth/oauth/${provider}/callback`;
}
