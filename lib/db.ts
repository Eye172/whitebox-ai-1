import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Real SQLite database (built into Node 24 via node:sqlite). Persists to
 * data/whitebox.db. Cached on globalThis so Next dev hot-reload doesn't reopen
 * the handle on every request.
 */
declare global {
  // eslint-disable-next-line no-var
  var __wbDb: DatabaseSync | undefined;
}

function init(): DatabaseSync {
  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "whitebox.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      password    TEXT,           -- scrypt hash (null for oauth-only accounts)
      salt        TEXT,
      provider    TEXT NOT NULL DEFAULT 'password',
      role        TEXT NOT NULL DEFAULT 'HR',
      created_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      expires_at  INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__wbDb) globalThis.__wbDb = init();
  return globalThis.__wbDb;
}
