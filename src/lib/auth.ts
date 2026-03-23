import { SignJWT, jwtVerify } from "jose";
import * as bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const sql = process.env.POSTGRES_URL ? neon(process.env.POSTGRES_URL) : null;
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.JWT_SECRET || "luncheon-dev-secret-change-in-prod"
);
const COOKIE_NAME = "luncheon_session";

export type SessionUser = { id: string; email: string; alias: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 8);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    alias: user.alias,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    return {
      id: sub,
      email: (payload.email as string) ?? "",
      alias: (payload.alias as string) ?? "",
    };
  } catch {
    return null;
  }
}

export function getSessionCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, v] = c.trim().split("=");
      return [k, decodeURIComponent(v ?? "")];
    })
  );
  return cookies[COOKIE_NAME];
}

/** Get session user from Next.js cookies(). Call from server components/API. */
export async function getSessionUser(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): Promise<SessionUser | null> {
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Get session user from Request (e.g. in API routes). */
export async function getSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
  const token = getSessionCookie(request);
  if (!token) return null;
  return verifySession(token);
}

export { COOKIE_NAME };

export async function createUser(
  email: string,
  password: string,
  alias: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  if (!sql) return { ok: false, error: "Database not configured" };
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedAlias = alias.trim();
  if (!trimmedEmail || !trimmedAlias || password.length < 6) {
    return { ok: false, error: "Email, name and password (min 6 chars) required" };
  }
  if (trimmedAlias.length > 40) return { ok: false, error: "Name max 40 chars" };
  const passwordHash = await hashPassword(password);
  try {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, password_hash, alias)
      VALUES (${id}, ${trimmedEmail}, ${passwordHash}, ${trimmedAlias})
    `;
    return { ok: true, user: { id, email: trimmedEmail, alias: trimmedAlias } };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") return { ok: false, error: "Email already in use" };
    return { ok: false, error: "Signup failed" };
  }
}

export async function updateUserAlias(userId: string, newAlias: string): Promise<boolean> {
  if (!sql) return false;
  const trimmed = newAlias.trim();
  if (!trimmed || trimmed.length > 40) return false;
  const result = await sql`
    UPDATE users SET alias = ${trimmed} WHERE id = ${userId} RETURNING id
  `;
  return Array.isArray(result) && result.length > 0;
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  if (!sql) return { ok: false, error: "Database not configured" };
  const trimmedEmail = email.trim().toLowerCase();
  const rows = await sql`
    SELECT id, email, password_hash, alias FROM users WHERE email = ${trimmedEmail} LIMIT 1
  `;
  if (!rows.length) return { ok: false, error: "Invalid email or password" };
  const row = rows[0] as { id: string; email: string; password_hash: string; alias: string };
  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return { ok: false, error: "Invalid email or password" };
  return {
    ok: true,
    user: { id: row.id, email: row.email, alias: row.alias },
  };
}
