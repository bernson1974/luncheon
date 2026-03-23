import { clearStoredAlias } from "./userAlias";
import { CREATOR_KEY_PREFIX } from "./creatorStorage";

/** Clear all Luncheon data from this browser (localStorage + cookie). Use when cache/cookies won't clear in embedded browsers. */
export function clearAppData(): void {
  if (typeof window === "undefined") return;

  clearStoredAlias();
  localStorage.removeItem("userToken");

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("joined:") || key?.startsWith(CREATOR_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.push("myCreatedDateId");
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }

  document.cookie = "luncheon_user_token=; path=/; max-age=0; SameSite=Lax";
}
