import type { LunchDatePublic } from "@/lib/models";

/**
 * True om den här webbläsaren har en aktiv bokning: skapat en dejt eller joinat en.
 * (Endast localStorage – använd `syncLocalBookingStateWithServer` för att städa bort spöknycklar.)
 */
export function hasBookedLunchDate(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("myCreatedDateId")) return true;
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith("joined:")) return true;
  }
  return false;
}

/**
 * Jämför localStorage med API: tar bort myCreatedDateId / joined:* om dejten saknas
 * eller är avbokad. Returnerar true om det fortfarande finns minst en giltig bokning.
 * Anropas bara från klient.
 */
export async function syncLocalBookingStateWithServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    let hasActive = false;

    const createdId = localStorage.getItem("myCreatedDateId");
    if (createdId) {
      const res = await fetch(`/api/dates/${createdId}`);
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
    // Nätverksfel: rör inte localStorage, bete dig som tidigare
    return hasBookedLunchDate();
  }
}
