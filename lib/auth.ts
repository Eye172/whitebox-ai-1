"use client";

/** Lightweight demo auth (localStorage). Real deploys wire WorkOS/Clerk per Book V. */
const KEY = "wb_hr_auth";

export interface Session {
  name: string;
  email: string;
  provider: string;
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(KEY);
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function signIn(session: Session) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function signOut() {
  window.localStorage.removeItem(KEY);
}
