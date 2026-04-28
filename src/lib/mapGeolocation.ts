/** Lindholmen – används när geolocation saknas, nekas eller timeoutar */
export const MAP_FALLBACK_CENTER = { lat: 57.7065, lng: 11.9384 } as const;

const SESSION_CENTER_KEY = "luncheon-map-user-center";
const SESSION_CENTER_MAX_AGE_MS = 30 * 60 * 1000;

/** Senast lyckade position (samma flik-session), för snabb första bild vid remount. */
export function getCachedMapUserCenter(
  fallback: { lat: number; lng: number } = MAP_FALLBACK_CENTER
): { lat: number; lng: number } {
  if (typeof window === "undefined") return { lat: fallback.lat, lng: fallback.lng };
  try {
    const raw = sessionStorage.getItem(SESSION_CENTER_KEY);
    if (!raw) return { lat: fallback.lat, lng: fallback.lng };
    const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown; t?: unknown };
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number" || typeof parsed.t !== "number") {
      return { lat: fallback.lat, lng: fallback.lng };
    }
    if (Date.now() - parsed.t > SESSION_CENTER_MAX_AGE_MS) return { lat: fallback.lat, lng: fallback.lng };
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return { lat: fallback.lat, lng: fallback.lng };
  }
}

function rememberMapUserCenter(lat: number, lng: number) {
  try {
    sessionStorage.setItem(
      SESSION_CENTER_KEY,
      JSON.stringify({ lat, lng, t: Date.now() })
    );
  } catch {
    /* quota / private mode */
  }
}

/** En gemensam begäran – undviker Strict Mode / flera kartor som kör getCurrentPosition samtidigt (då kan en snabb timeout sätta Lindholmen medan den senare lyckade positionen kastas bort). */
let inFlightUserCenter: Promise<{ lat: number; lng: number }> | null = null;

/**
 * Försöker läsa enhetens position (webbläsarens dialog kan visas).
 * Vid fel/timeout: returnerar `fallback` (standard Lindholmen).
 */
export function getUserMapCenterOrFallback(
  fallback: { lat: number; lng: number } = MAP_FALLBACK_CENTER
): Promise<{ lat: number; lng: number }> {
  if (typeof window === "undefined") return Promise.resolve({ lat: fallback.lat, lng: fallback.lng });
  if (!navigator.geolocation) return Promise.resolve({ lat: fallback.lat, lng: fallback.lng });

  if (!inFlightUserCenter) {
    const innerTimeoutMs = 28_000;
    const safetyTimeoutMs = 32_000;

    inFlightUserCenter = new Promise<{ lat: number; lng: number }>((resolve) => {
      let settled = false;
      const finish = (c: { lat: number; lng: number }, fromGps: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(safetyTimer);
        if (fromGps) rememberMapUserCenter(c.lat, c.lng);
        resolve(c);
      };

      const safetyTimer = window.setTimeout(
        () => finish({ lat: fallback.lat, lng: fallback.lng }, false),
        safetyTimeoutMs
      );

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          finish({ lat, lng }, true);
        },
        () => finish({ lat: fallback.lat, lng: fallback.lng }, false),
        {
          enableHighAccuracy: false,
          timeout: innerTimeoutMs,
          maximumAge: 5 * 60 * 1000,
        }
      );
    }).finally(() => {
      inFlightUserCenter = null;
    });
  }

  return inFlightUserCenter;
}
