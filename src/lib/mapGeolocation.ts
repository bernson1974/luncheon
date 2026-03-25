/** Lindholmen – används när geolocation saknas, nekas eller timeoutar */
export const MAP_FALLBACK_CENTER = { lat: 57.7065, lng: 11.9384 } as const;

/**
 * Försöker läsa enhetens position (webbläsarens dialog kan visas).
 * Vid fel/timeout: returnerar `fallback` (standard Lindholmen).
 */
export async function getUserMapCenterOrFallback(
  fallback: { lat: number; lng: number } = MAP_FALLBACK_CENTER
): Promise<{ lat: number; lng: number }> {
  if (typeof window === "undefined") return { lat: fallback.lat, lng: fallback.lng };
  if (!navigator.geolocation) return { lat: fallback.lat, lng: fallback.lng };

  return new Promise((resolve) => {
    const finish = (c: { lat: number; lng: number }) => resolve(c);
    const timeoutMs = 10000;
    const timer = window.setTimeout(() => finish({ lat: fallback.lat, lng: fallback.lng }), timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer);
        finish({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        window.clearTimeout(timer);
        finish({ lat: fallback.lat, lng: fallback.lng });
      },
      {
        enableHighAccuracy: false,
        timeout: 9000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
}
