import { NextResponse } from "next/server";
import { createUser, findUserByEmail, createSession, SESSION_COOKIE } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, name, password, consent } = await req.json();
    if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    if (!consent) return NextResponse.json({ error: "Please accept the terms to continue." }, { status: 400 });
    if (findUserByEmail(email)) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const displayName = name?.trim() || email.split("@")[0];
    const user = createUser(email, displayName, password, "password");
    const { token, maxAge } = createSession(user.id);

    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge });
    return res;
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
