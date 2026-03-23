import { NextResponse } from "next/server";
import { listDates } from "@/lib/store";
import { selectableLunchDateYmds } from "@/lib/lunchDateWindow";

export const dynamic = "force-dynamic";

/** Fresh map pin data – always excludes full dates. Use for Find tab to avoid stale cache. */
export async function GET() {
  const ymds = selectableLunchDateYmds();
  const countsByYmd: Record<string, Record<string, number>> = {};
  const oneSpotLeftByYmd: Record<string, Record<string, boolean>> = {};
  const restaurantMap = new Map<string, { id: string; name: string; latitude: number; longitude: number }>();

  for (const ymd of ymds) {
    countsByYmd[ymd] = {};
    oneSpotLeftByYmd[ymd] = {};
    for (const d of await listDates({ date: ymd })) {
      if (d.spotsLeft === 0) continue;
      const rid = d.restaurant.id;
      countsByYmd[ymd][rid] = (countsByYmd[ymd][rid] ?? 0) + 1;
      if (d.spotsLeft === 1) {
        oneSpotLeftByYmd[ymd][rid] = true;
      }
      if (!restaurantMap.has(rid)) {
        restaurantMap.set(rid, {
          id: d.restaurant.id,
          name: d.restaurant.name,
          latitude: d.restaurant.latitude,
          longitude: d.restaurant.longitude,
        });
      }
    }
  }

  return NextResponse.json({
    days: ymds.map((ymd) => ({ ymd })),
    countsByYmd,
    oneSpotLeftByYmd,
    restaurants: Array.from(restaurantMap.values()),
  });
}
