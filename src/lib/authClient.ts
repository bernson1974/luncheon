import { clearAppData } from "@/lib/clearAppData";

/** Client-side auth helpers. Session is httpOnly; use /api/auth/me for user. */
export type AuthUser = { id: string; email: string; alias: string };

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: AuthUser | null };
  return data.user;
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (res.ok && data.ok) return { ok: true };
  return { ok: false, error: data.error ?? "Login failed" };
}

export async function signup(
  email: string,
  password: string,
  alias: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, alias }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (res.ok && data.ok) return { ok: true };
  return { ok: false, error: data.error ?? "Signup failed" };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  /** Rensa legacy localStorage (creator:/joined:) så nästa konto inte ärver förra användarens spår. */
  clearAppData();
}

export async function deleteAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/auth/delete", { method: "POST", credentials: "include" });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (res.ok && data.ok) {
    clearAppData();
    return { ok: true };
  }
  return { ok: false, error: data.error ?? "Could not delete account" };
}
