/**
 * Tracks lunch dates this browser created (multiple days possible).
 * Value is userToken for server verification.
 */
export const CREATOR_KEY_PREFIX = "creator:";

export function creatorStorageKey(dateId: string): string {
  return `${CREATOR_KEY_PREFIX}${dateId}`;
}

/** Migrate legacy single key myCreatedDateId → creator:<id>. */
export function migrateLegacyCreatorStorage(userToken: string | null): void {
  if (typeof window === "undefined" || !userToken) return;
  const legacy = localStorage.getItem("myCreatedDateId");
  if (!legacy) return;
  localStorage.setItem(creatorStorageKey(legacy), userToken);
  localStorage.removeItem("myCreatedDateId");
}

export function rememberCreatedDate(dateId: string, userToken: string): void {
  migrateLegacyCreatorStorage(userToken);
  localStorage.setItem(creatorStorageKey(dateId), userToken);
}

export function forgetCreatedDate(dateId: string): void {
  localStorage.removeItem(creatorStorageKey(dateId));
  const legacy = localStorage.getItem("myCreatedDateId");
  if (legacy === dateId) localStorage.removeItem("myCreatedDateId");
}

export function isCreatorOfDateInStorage(dateId: string, userToken: string): boolean {
  const v = localStorage.getItem(creatorStorageKey(dateId));
  if (v === userToken) return true;
  const legacy = localStorage.getItem("myCreatedDateId");
  return legacy === dateId;
}

export function listCreatorDateIdsFromStorage(): string[] {
  const ids: string[] = [];
  const legacy = localStorage.getItem("myCreatedDateId");
  if (legacy) ids.push(legacy);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CREATOR_KEY_PREFIX)) {
      const id = key.slice(CREATOR_KEY_PREFIX.length);
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}
