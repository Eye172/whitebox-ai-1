import { NextRequest, NextResponse } from "next/server";

/**
 * Cheap edge gate: redirect /hr/* to /login when no session cookie is present.
 * Real validation (DB lookup) happens in app/hr/layout.tsx on the Node runtime.
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("wb_session");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/hr/:path*"],
};
