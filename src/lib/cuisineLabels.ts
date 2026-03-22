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

export function cuisineLabel(cuisine: string): string {
  return CUISINE_LABELS[cuisine] ?? cuisine;
}
