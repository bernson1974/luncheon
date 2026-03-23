import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Proxy to Foursquare Place Search (Pro tier).
 * Accepts map bounds (ne, sw) and returns restaurants with name, coordinates, cuisine.
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Foursquare API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const ne = searchParams.get("ne"); // "lat,lng" northeast corner
  const sw = searchParams.get("sw"); // "lat,lng" southwest corner

  if (!ne || !sw) {
    return NextResponse.json({ error: "Missing ne or sw bounds" }, { status: 400 });
  }

  const url = new URL("https://places-api.foursquare.com/places/search");
  url.searchParams.set("query", "restaurant");
  url.searchParams.set("ne", ne);
  url.searchParams.set("sw", sw);
  url.searchParams.set("limit", "50");
  url.searchParams.set("fields", "fsq_place_id,latitude,longitude,name,categories");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: "application/json",
        "X-Places-Api-Version": "2025-06-17",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Foursquare Place Search error:", res.status, err);
      return NextResponse.json(
        { error: "Foursquare request failed" },
        { status: res.status >= 500 ? 502 : 400 }
      );
    }

    const data = (await res.json()) as FoursquareSearchResponse;
    const places = (data.results ?? []).map((p) => {
      const place = p as { fsq_id?: string; fsq_place_id?: string; latitude?: number; longitude?: number; name?: string };
      return {
        fsq_id: place.fsq_id ?? place.fsq_place_id ?? "",
        name: place.name ?? "Unknown",
        latitude: place.latitude ?? 0,
        longitude: place.longitude ?? 0,
        cuisine: extractCuisine(p),
      };
    });

    return NextResponse.json({ places });
  } catch (e) {
    console.error("Foursquare Place Search:", e);
    return NextResponse.json({ error: "Place search failed" }, { status: 500 });
  }
}

function extractCuisine(place: FoursquarePlace): string {
  const cats = place.categories ?? [];
  const primary = cats.find((c) => c.primary) ?? cats[0];
  if (primary?.name) return primary.name.toLowerCase().replace(/\s+/g, "_");
  return "restaurant";
}

interface FoursquarePlace {
  fsq_id: string;
  name?: string;
  geocodes?: { main?: { latitude: number; longitude: number } };
  categories?: Array< { name: string; primary?: boolean } >;
}

interface FoursquareSearchResponse {
  results?: FoursquarePlace[];
}
