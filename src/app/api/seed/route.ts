import { NextResponse } from "next/server";
import { createDate, joinDate } from "@/lib/store";
import { selectableLunchDateYmds } from "@/lib/lunchDateWindow";

/** Lindholmen bounding box (ne, sw) for Foursquare search */
const LINDHOLMEN_NE = "57.72,11.97";
const LINDHOLMEN_SW = "57.69,11.90";

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

/** Dev seed: ~30 bookings across visible restaurants, all days except one, fictive users only. */
export async function POST() {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Foursquare API key required" }, { status: 500 });
  }

  const url = new URL("https://places-api.foursquare.com/places/search");
  url.searchParams.set("query", "restaurant");
  url.searchParams.set("ne", LINDHOLMEN_NE);
  url.searchParams.set("sw", LINDHOLMEN_SW);
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
    return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 502 });
  }
  const data = (await fsqRes.json()) as { results?: Array<{ fsq_id?: string; fsq_place_id?: string; latitude?: number; longitude?: number; name?: string; categories?: Array<{ name: string; primary?: boolean }> }> };
  const restaurants = (data.results ?? []).map((p) => ({
    fsq_id: p.fsq_id ?? p.fsq_place_id ?? "",
    name: p.name ?? "Unknown",
    latitude: p.latitude ?? 0,
    longitude: p.longitude ?? 0,
    cuisine: extractCuisine(p),
  }));
  if (restaurants.length === 0) {
    return NextResponse.json({ error: "No restaurants found in area" }, { status: 404 });
  }

  const days = selectableLunchDateYmds();
  const skipIndex = Math.floor(Math.random() * days.length);
  const daysToUse = days.filter((_, i) => i !== skipIndex);

  const times = ["11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00"];
  let creatorIndex = 0;
  let participantIndex = 0;
  function nextCreatorToken(): string {
    return `seed-creator-${creatorIndex++}`;
  }
  function nextParticipantToken(): string {
    return `seed-participant-${participantIndex++}`;
  }

  const targetCount = 30;
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

    // 3 fully booked, 8 with 1 spot left, rest random
    let numJoins: number;
    if (i < 3) {
      numJoins = maxParticipants - 1; // fully booked
    } else if (i < 11) {
      numJoins = maxParticipants - 2; // 1 spot left
    } else {
      numJoins = Math.floor(Math.random() * (maxParticipants - 2)); // at least 2 spots left
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
    daysUsed: daysToUse.length,
    skippedDay: days[skipIndex],
  });
}
