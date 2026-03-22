/** Sync userToken to cookie so server can read it (My Bites, same instance as page render). */
export function setUserTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `luncheon_user_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
}
