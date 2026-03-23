import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Geocoding via OpenStreetMap Nominatim.
 * Use for user-triggered map search (place names, addresses).
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Luncheon/1.0 (lunch date app)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding failed" },
        { status: res.status >= 500 ? 502 : 400 }
      );
    }

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) {
      return NextResponse.json({ lat: null, lng: null });
    }

    return NextResponse.json({
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
    });
  } catch (e) {
    console.error("Geocode error:", e);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
