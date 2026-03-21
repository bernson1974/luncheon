import type { LunchDatePublic } from "@/lib/models";
import {
  CREATOR_KEY_PREFIX,
  listCreatorDateIdsFromStorage,
  migrateLegacyCreatorStorage,
} from "@/lib/creatorStorage";

/**
 * True om den här webbläsaren har en aktiv bokning: skapat en dejt eller joinat en.
 * (Endast localStorage – använd `syncLocalBookingStateWithServer` för att städa bort spöknycklar.)
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
 * Jämför localStorage med API: tar bort ogiltiga creator/joined-nycklar.
 * Returnerar true om det fortfarande finns minst en giltig bokning.
 * Anropas bara från klient.
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

    for (const key of creatorKeys) {
      const id = key.slice(CREATOR_KEY_PREFIX.length);
      const res = await fetch(`/api/dates/${id}`);
      if (!res.ok) {
        localStorage.removeItem(key);
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
      if (!res.ok) {
        localStorage.removeItem("myCreatedDateId");
      } else {
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
        localStorage.removeItem(key);
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
 * Kalenderdagar (YYYY-MM-DD) där denna webbläsare har en aktiv dejt (skapare eller deltagare).
 * Synkar localStorage mot server innan lista byggs.
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
