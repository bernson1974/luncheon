/**
 * Admin: radera användare via e-post (samma steg som deleteUser i auth).
 * node scripts/delete-user-by-email.mjs <email>
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
const emailArg = process.argv[2]?.trim().toLowerCase();
if (!emailArg) {
  console.error("Användning: node scripts/delete-user-by-email.mjs <email>");
  process.exit(1);
}

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("Saknar POSTGRES_URL (.env.local)");
  process.exit(1);
}

const sql = neon(url);
const rows = await sql`SELECT id, email, alias FROM users WHERE email = ${emailArg} LIMIT 1`;
if (rows.length === 0) {
  console.error(`Hittade ingen användare med e-post: ${emailArg}`);
  process.exit(1);
}
const { id: userId, email, alias } = rows[0];
console.log(`Raderar: ${email} (${alias}) id=${userId}`);

await sql`UPDATE dates SET status = 'cancelled' WHERE creator_token = ${userId}`;
await sql`DELETE FROM participants WHERE user_token = ${userId}`;
await sql`DELETE FROM users WHERE id = ${userId}`;

console.log("Klart.");
