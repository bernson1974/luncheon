import type { LunchDatePublic } from "@/lib/models";
import {
  CREATOR_KEY_PREFIX,
  listCreatorDateIdsFromStorage,
  migrateLegacyCreatorStorage,
} from "@/lib/creatorStorage";

/**
 * True if this browser has an active booking: created a date or joined one.
 * (localStorage only – use `syncLocalBookingStateWithServer` to prune stale keys.)
 */
export function hasBookedLunchDate(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("myCreatedDateId")) return true;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("joined:") || k?.startsWith(CREATOR_KEY_PREFIX)) return true;
  }
  return false;
}

/**
 * Reconcile localStorage with API: removes invalid creator/joined keys.
 * Returns true if at least one valid booking remains.
 * Client-only.
 */
export async function syncLocalBookingStateWithServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    let hasActive = false;
    const userToken = localStorage.getItem("userToken");
    migrateLegacyCreatorStorage(userToken);

    const creatorKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CREATOR_KEY_PREFIX)) creatorKeys.push(key);
    }

    /* Don't remove on 404 – serverless may hit different instance with empty store */
    for (const key of creatorKeys) {
      const id = key.slice(CREATOR_KEY_PREFIX.length);
      const res = await fetch(`/api/dates/${id}`);
      if (!res.ok) {
        if (res.status !== 404) localStorage.removeItem(key);
        continue;
      }
      const d = (await res.json()) as LunchDatePublic;
      if (d.status === "cancelled") {
        localStorage.removeItem(key);
        continue;
      }
      hasActive = true;
    }

    const legacyCreated = localStorage.getItem("myCreatedDateId");
    if (legacyCreated) {
      const res = await fetch(`/api/dates/${legacyCreated}`);
      if (res.ok) {
        const d = (await res.json()) as LunchDatePublic;
        if (d.status === "cancelled") {
          localStorage.removeItem("myCreatedDateId");
        } else {
          hasActive = true;
        }
      }
    }

    const joinedKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("joined:")) joinedKeys.push(key);
    }

    for (const key of joinedKeys) {
      const id = key.slice("joined:".length);
      const res = await fetch(`/api/dates/${id}`);
      if (!res.ok) {
        if (res.status !== 404) localStorage.removeItem(key);
        continue;
      }
      const d = (await res.json()) as LunchDatePublic;
      if (d.status === "cancelled") {
        localStorage.removeItem(key);
        continue;
      }
      hasActive = true;
    }

    return hasActive;
  } catch {
    return hasBookedLunchDate();
  }
}

/**
 * Calendar days (YYYY-MM-DD) where this browser has an active date (host or participant).
 * Syncs localStorage with server before building the set.
 */
export async function getUserBookedDateYmds(): Promise<Set<string>> {
  if (typeof window === "undefined") return new Set();

  await syncLocalBookingStateWithServer();

  const ids: string[] = [];
  for (const id of listCreatorDateIdsFromStorage()) {
    if (!ids.includes(id)) ids.push(id);
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("joined:")) {
      const id = key.slice("joined:".length);
      if (!ids.includes(id)) ids.push(id);
    }
  }

  if (ids.length === 0) return new Set();

  const results = await Promise.all(
    ids.map((id) =>
      fetch(`/api/dates/${id}`)
        .then((r) => (r.ok ? (r.json() as Promise<LunchDatePublic>) : null))
        .catch(() => null)
    )
  );

  const ymds = new Set<string>();
  for (const d of results) {
    if (d && d.status !== "cancelled") ymds.add(d.date);
  }
  return ymds;
}
