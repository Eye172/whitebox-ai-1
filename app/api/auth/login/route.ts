import { NextResponse } from "next/server";
import { checkCredentials, createSession, SESSION_COOKIE } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });

    const user = checkCredentials(email, password);
    if (!user) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

    const { token, maxAge } = createSession(user.id);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge });
    return res;
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
