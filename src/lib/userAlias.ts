/** localStorage key for the user's chosen display alias (no login). */
export const USER_ALIAS_KEY = "luncheon_user_alias";

export function getStoredAlias(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(USER_ALIAS_KEY);
  return v?.trim() ? v.trim() : null;
}

export function setStoredAlias(alias: string): void {
  localStorage.setItem(USER_ALIAS_KEY, alias.trim());
}

export function clearStoredAlias(): void {
  localStorage.removeItem(USER_ALIAS_KEY);
}
