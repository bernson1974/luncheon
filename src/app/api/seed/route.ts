import { NextResponse } from "next/server";
import { createDate, joinDate } from "@/lib/store";
import { selectableLunchDateYmds } from "@/lib/lunchDateWindow";

/**
 * Fyra ne/sw-rutor som täcker tätbebyggt Göteborg (ungefär kommunens kärna),
 * så Foursquare-sökningen inte bara träffar centrum.
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

function extractCuisine(p: { categories?: Array<{ name?: string; primary?: boolean }> }): string {
  const cats = p.categories ?? [];
  const primary = cats.find((c) => c.primary) ?? cats[0];
  if (primary?.name) return primary.name.toLowerCase().replace(/\s+/g, "_");
  return "restaurant";
}

type SeededRestaurant = {
  fsq_id: string;
  name: string;
  latitude: number;
  longitude: number;
  cuisine: string;
};

const SEED_TARGET_BOOKINGS = 100;

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
  if (!fsqRes.ok) {
    return [];
  }
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

/** Dev seed: 100 bokningar, slumpade över alla lunchfönsterdagar och Göteborg (Foursquare-rutor). */
export async function POST() {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Foursquare API key required" }, { status: 500 });
  }

  const quadrantLists = await Promise.all(
    GBG_QUADRANTS.map((q) => fetchRestaurantsInBbox(apiKey, q.ne, q.sw))
  );
  const byId = new Map<string, SeededRestaurant>();
  for (const list of quadrantLists) {
    for (const r of list) {
      if (r.fsq_id) byId.set(r.fsq_id, r);
    }
  }
  const restaurants = [...byId.values()];
  if (restaurants.length === 0) {
    return NextResponse.json({ error: "No restaurants found in area" }, { status: 404 });
  }

  const daysToUse = selectableLunchDateYmds();
  if (daysToUse.length === 0) {
    return NextResponse.json({ error: "No selectable days in window" }, { status: 400 });
  }

  const times = ["11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00"];
  let creatorIndex = 0;
  let participantIndex = 0;
  function nextCreatorToken(): string {
    return `seed-creator-${creatorIndex++}`;
  }
  function nextParticipantToken(): string {
    return `seed-participant-${participantIndex++}`;
  }

  const targetCount = SEED_TARGET_BOOKINGS;
  const created: Array<{ id: string; date: string; restaurant: string }> = [];

  for (let i = 0; i < targetCount; i++) {
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const ymd = daysToUse[Math.floor(Math.random() * daysToUse.length)];
    const timeStart = times[Math.floor(Math.random() * times.length)];
    const maxParticipants = 3 + Math.floor(Math.random() * 4); // 3–6
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
    created.push({ id: date.id, date: ymd, restaurant: restaurant.name });

    // ~10 fulla, ~25 med 1 plats kvar, resten blandat
    let numJoins: number;
    if (i < 10) {
      numJoins = maxParticipants - 1;
    } else if (i < 35) {
      numJoins = maxParticipants - 2;
    } else {
      numJoins = Math.floor(Math.random() * (maxParticipants - 2));
    }
    for (let j = 0; j < numJoins; j++) {
      const alias = FAKE_PARTICIPANT_ALIASES[(participantIndex + j) % FAKE_PARTICIPANT_ALIASES.length];
      const token = nextParticipantToken();
      await joinDate(date.id, alias, token);
    }
  }

  return NextResponse.json({
    ok: true,
    created: created.length,
    restaurants: restaurants.length,
    daysUsed: daysToUse,
    area: "Göteborg (4 Foursquare bbox, sammanslagna)",
  });
}
