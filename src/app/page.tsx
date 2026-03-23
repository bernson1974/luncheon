import { cookies } from "next/headers";
import HomeMapSection, {
  type CountsByYmd,
  type HomeMapDay,
  type HomeRestaurantPinBase,
  type OneSpotLeftByYmd,
} from "@/components/HomeMapSection";
import { getCommittedDateYmdsForUser, listDates } from "@/lib/store";
import { selectableLunchDateYmds } from "@/lib/lunchDateWindow";
import { getSessionUser } from "@/lib/auth";

/** Avoid stale static prerender without manually clearing .next */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ymds = selectableLunchDateYmds();

  const days: HomeMapDay[] = ymds.map((ymd) => ({ ymd }));

  const cookieStore = await cookies();
  const sessionUser = await getSessionUser(cookieStore);
  const userToken = sessionUser?.id ?? null;
  const committedYmds = userToken ? await getCommittedDateYmdsForUser(userToken) : [];

  const countsByYmd: CountsByYmd = {};
  const oneSpotLeftByYmd: OneSpotLeftByYmd = {};
  const restaurantMap = new Map<string, HomeRestaurantPinBase>();

  const allDates = await listDates();
  const datesByYmd = new Map<string, typeof allDates>();
  for (const ymd of ymds) {
    datesByYmd.set(ymd, allDates.filter((d) => d.date === ymd));
  }

  for (const ymd of ymds) {
    const datesForDay = datesByYmd.get(ymd) ?? [];
    countsByYmd[ymd] = {};
    oneSpotLeftByYmd[ymd] = {};
    for (const d of Array.isArray(datesForDay) ? datesForDay : []) {
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

  const restaurantPins = Array.from(restaurantMap.values());

  return (
    <div className="home-page-stack" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="home-map-block">
        <HomeMapSection days={days} countsByYmd={countsByYmd} oneSpotLeftByYmd={oneSpotLeftByYmd} restaurants={restaurantPins} committedYmds={committedYmds} />
      </div>
    </div>
  );
}
