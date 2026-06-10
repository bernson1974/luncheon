import { createDate, joinDate } from "@/lib/store";
import { selectableLunchDateYmds } from "@/lib/lunchDateWindow";

/**
 * Fyra ne/sw-rutor som täcker tätbebyggt Göteborg (ungefär kommunens kärna).
 */
const GBG_QUADRANTS: Array<{ ne: string; sw: string }> = [
  { ne: "57.780,11.940", sw: "57.705,11.680" },
  { ne: "57.780,12.120", sw: "57.705,11.940" },
  { ne: "57.705,11.940", sw: "57.625,11.680" },
  { ne: "57.705,12.120", sw: "57.625,11.940" },
];

const FAKE_CREATOR_ALIASES = [
  "Anna", "Erik", "Sofia", "Marcus", "Lisa", "Johan", "Emma", "Gustav",
  "Maria", "Oscar", "Elin", "Ludvig", "Maja", "Filip", "Ida", "Viktor",
];

const FAKE_PARTICIPANT_ALIASES = [
  "Klara", "Emil", "Nora", "Axel", "Alma", "Leo", "Saga", "Hugo",
  "Wilma", "Felix", "Agnes", "Noah", "Linnea", "William", "Alice", "Oliver",
];

const TOPICS = [
  "AI and the future of work",
  "Premier League",
  "New coffee spots in town",
  "Sustainability at work",
  "Best lunch places",
  "Side projects",
  "Travel plans",
  "Music recommendations",
];

const TIMES = ["11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00"];

export const DEFAULT_MOCK_SEED_COUNT = 50;

type SeededRestaurant = {
  fsq_id: string;
  name: string;
  latitude: number;
  longitude: number;
  cuisine: string;
};

export type SeedMockDatesResult = {
  ok: true;
  created: number;
  restaurants: number;
  daysUsed: string[];
  daysSkipped: string[];
  perDay: Record<string, number>;
  batchId: string;
  area: string;
};

function extractCuisine(p: { categories?: Array<{ name?: string; primary?: boolean }> }): string {
  const cats = p.categories ?? [];
  const primary = cats.find((c) => c.primary) ?? cats[0];
  if (primary?.name) return primary.name.toLowerCase().replace(/\s+/g, "_");
  return "restaurant";
}

/** Every other day in the 6-day lunch window (e.g. day 1, 3, 5). */
export function alternatingLunchDateYmds(allDays: string[] = selectableLunchDateYmds()): string[] {
  return allDays.filter((_, i) => i % 2 === 0);
}

async function fetchRestaurantsInBbox(
  apiKey: string,
  ne: string,
  sw: string
): Promise<SeededRestaurant[]> {
  const url = new URL("https://places-api.foursquare.com/places/search");
  url.searchParams.set("query", "restaurant");
  url.searchParams.set("ne", ne);
  url.searchParams.set("sw", sw);
  url.searchParams.set("limit", "50");
  url.searchParams.set("fields", "fsq_place_id,latitude,longitude,name,categories");

  const fsqRes = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      Accept: "application/json",
      "X-Places-Api-Version": "2025-06-17",
    },
    next: { revalidate: 0 },
  });
  if (!fsqRes.ok) return [];

  const data = (await fsqRes.json()) as {
    results?: Array<{
      fsq_id?: string;
      fsq_place_id?: string;
      latitude?: number;
      longitude?: number;
      name?: string;
      categories?: Array<{ name: string; primary?: boolean }>;
    }>;
  };

  return (data.results ?? []).map((p) => ({
    fsq_id: p.fsq_id ?? p.fsq_place_id ?? "",
    name: p.name ?? "Unknown",
    latitude: p.latitude ?? 0,
    longitude: p.longitude ?? 0,
    cuisine: extractCuisine(p),
  }));
}

async function fetchGothenburgRestaurants(apiKey: string): Promise<SeededRestaurant[]> {
  const quadrantLists = await Promise.all(
    GBG_QUADRANTS.map((q) => fetchRestaurantsInBbox(apiKey, q.ne, q.sw))
  );
  const byId = new Map<string, SeededRestaurant>();
  for (const list of quadrantLists) {
    for (const r of list) {
      if (r.fsq_id) byId.set(r.fsq_id, r);
    }
  }
  return [...byId.values()];
}

export async function seedMockDates(options?: {
  count?: number;
  batchId?: string;
  days?: string[];
}): Promise<SeedMockDatesResult> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    throw new Error("Foursquare API key required");
  }

  const restaurants = await fetchGothenburgRestaurants(apiKey);
  if (restaurants.length === 0) {
    throw new Error("No restaurants found in area");
  }

  const allDays = selectableLunchDateYmds();
  const daysToUse = options?.days ?? alternatingLunchDateYmds(allDays);
  if (daysToUse.length === 0) {
    throw new Error("No selectable days in window");
  }

  const targetCount = options?.count ?? DEFAULT_MOCK_SEED_COUNT;
  const batchId = options?.batchId ?? Date.now().toString(36);
  let creatorIndex = 0;
  let participantIndex = 0;

  function nextCreatorToken(): string {
    return `seed-creator-${batchId}-${creatorIndex++}`;
  }
  function nextParticipantToken(): string {
    return `seed-participant-${batchId}-${participantIndex++}`;
  }

  const perDay = Math.floor(targetCount / daysToUse.length);
  const extra = targetCount % daysToUse.length;
  const dayQuotas = daysToUse.map((_, i) => perDay + (i < extra ? 1 : 0));
  const dayCounts = daysToUse.map(() => 0);

  for (let i = 0; i < targetCount; i++) {
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    let dayIdx = daysToUse.findIndex((_, idx) => dayCounts[idx] < dayQuotas[idx]);
    if (dayIdx < 0) dayIdx = Math.floor(Math.random() * daysToUse.length);
    const ymd = daysToUse[dayIdx];
    dayCounts[dayIdx]++;

    const timeStart = TIMES[Math.floor(Math.random() * TIMES.length)];
    const maxParticipants = 3 + Math.floor(Math.random() * 4);
    const creatorAlias = FAKE_CREATOR_ALIASES[creatorIndex % FAKE_CREATOR_ALIASES.length];
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const date = await createDate({
      creatorAlias,
      creatorToken: nextCreatorToken(),
      date: ymd,
      timeStart,
      timeEnd: Math.random() > 0.5 ? "13:30" : undefined,
      restaurantId: restaurant.fsq_id,
      restaurant: {
        id: restaurant.fsq_id,
        name: restaurant.name,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        cuisine: restaurant.cuisine || "restaurant",
      },
      topic,
      maxParticipants,
    });

    let numJoins: number;
    if (i < Math.max(1, Math.floor(targetCount * 0.1))) {
      numJoins = maxParticipants - 1;
    } else if (i < Math.floor(targetCount * 0.35)) {
      numJoins = maxParticipants - 2;
    } else {
      numJoins = Math.floor(Math.random() * Math.max(1, maxParticipants - 2));
    }

    for (let j = 0; j < numJoins; j++) {
      const alias = FAKE_PARTICIPANT_ALIASES[(participantIndex + j) % FAKE_PARTICIPANT_ALIASES.length];
      await joinDate(date.id, alias, nextParticipantToken());
    }
  }

  return {
    ok: true,
    created: targetCount,
    restaurants: restaurants.length,
    daysUsed: daysToUse,
    daysSkipped: allDays.filter((d) => !daysToUse.includes(d)),
    perDay: Object.fromEntries(daysToUse.map((d, i) => [d, dayCounts[i]])),
    batchId,
    area: "Göteborg (4 Foursquare bbox, sammanslagna)",
  };
}
