/** Display labels for restaurant cuisine keys */
export const CUISINE_LABELS: Record<string, string> = {
  indian: "Indian",
  thai: "Thai",
  swedish: "Swedish",
  japanese: "Japanese / Sushi",
  pizza: "Pizza",
  burgers: "Burgers",
  asian: "Asian",
};

const RESTAURANT_SUFFIX = "_restaurant";

function stripRestaurantSuffix(key: string): string {
  if (key.endsWith(RESTAURANT_SUFFIX)) {
    return key.slice(0, -RESTAURANT_SUFFIX.length);
  }
  return key;
}

/** Human-readable cuisine for UI (dropdowns, cards). Option values stay raw keys for filtering. */
export function cuisineLabel(cuisine: string): string {
  const raw = cuisine.trim();
  if (!raw) return "";

  const mapped = CUISINE_LABELS[raw] ?? CUISINE_LABELS[stripRestaurantSuffix(raw)];
  if (mapped) return mapped;

  let display = stripRestaurantSuffix(raw).replaceAll("_", " ").trim();
  if (!display) display = raw.replaceAll("_", " ").trim();
  if (!display) return raw;

  return display.charAt(0).toLocaleUpperCase("en") + display.slice(1);
}
