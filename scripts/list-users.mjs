/**
 * Lista registrerade användare (samma tabell som auth).
 * Kör från projektrot: node scripts/list-users.mjs
 * Laddar .env.local / .env om POSTGRES_URL saknas i miljön.
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
  console.error("Saknar POSTGRES_URL. Sätt i .env.local eller kör i Neon SQL Editor:");
  console.error("  SELECT id, email, alias, created_at FROM users ORDER BY created_at;");
  process.exit(1);
}

const sql = neon(url);
const rows = await sql`
  SELECT id, email, alias, created_at
  FROM users
  ORDER BY created_at ASC NULLS FIRST, email ASC
`;
if (rows.length === 0) {
  console.log("Inga rader i users-tabellen.");
  process.exit(0);
}
console.log(`Antal användare: ${rows.length}\n`);
console.table(
  rows.map((r) => ({
    id: r.id,
    email: r.email,
    alias: r.alias,
    created_at: r.created_at,
  }))
);
