/**
 * Kör scripts/migrate-user-notifications.sql mot POSTGRES_URL (.env.local).
 * node scripts/run-user-notifications-migration.mjs
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

loadDotEnv();
const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("Saknar POSTGRES_URL i .env.local");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_token TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'invitation_cancelled',
    body TEXT NOT NULL,
    lunch_date_id TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

await sql`
  CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
    ON user_notifications (user_token)
    WHERE read_at IS NULL
`;

console.log("Klart: user_notifications + index finns i databasen.");
