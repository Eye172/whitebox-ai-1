import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export const SESSION_COOKIE = "wb_session";
const SESSION_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  role: string;
}

/* ---------- password hashing (scrypt, Node built-in) ---------- */
function hashPassword(password: string, salt?: string) {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 64).toString("hex");
  return { salt: s, hash };
}
function verifyPassword(password: string, salt: string, expected: string) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- users ---------- */
export function findUserByEmail(email: string) {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as
    | (User & { password: string; salt: string })
    | undefined;
}

export function createUser(email: string, name: string, password: string | null, provider = "password") {
  const db = getDb();
  const id = randomUUID();
  const now = Date.now();
  const creds = password ? hashPassword(password) : { salt: null, hash: null };
  db.prepare(
    "INSERT INTO users (id, email, name, password, salt, provider, role, created_at) VALUES (?, ?, ?, ?, ?, ?, 'HR', ?)"
  ).run(id, email.toLowerCase(), name, creds.hash, creds.salt, provider, now);
  return { id, email: email.toLowerCase(), name, provider, role: "HR" } as User;
}

export function checkCredentials(email: string, password: string): User | null {
  const u = findUserByEmail(email);
  if (!u || !u.password || !u.salt) return null;
  if (!verifyPassword(password, u.salt, u.password)) return null;
  return { id: u.id, email: u.email, name: u.name, provider: u.provider, role: u.role };
}

/* ---------- sessions ---------- */
export function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  getDb()
    .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(token, userId, now, now + SESSION_TTL);
  return { token, maxAge: SESSION_TTL / 1000 };
}

export function destroySession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function getUserByToken(token: string | undefined): User | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.provider, u.role, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as (User & { expires_at: number }) | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, provider: row.provider, role: row.role };
}

/** Read the current session user from the request cookies (server components / route handlers). */
export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getUserByToken(token);
}
