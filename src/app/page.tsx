import HomeMapSection, {
  type CountsByYmd,
  type HomeMapDay,
  type HomeRestaurantPinBase,
} from "@/components/HomeMapSection";
import { listDates } from "@/lib/store";
import { restaurants } from "@/lib/restaurants";
import { selectableLunchDateYmds } from "@/lib/lunchDateWindow";

/** Undvik gammal förrenderad statisk HTML utan att behöva rensa .next manuellt. */
export const dynamic = "force-dynamic";

export default function HomePage() {
  const ymds = selectableLunchDateYmds();

  const days: HomeMapDay[] = ymds.map((ymd) => ({ ymd }));

  const countsByYmd: CountsByYmd = {};
  for (const ymd of ymds) {
    countsByYmd[ymd] = {};
    for (const d of listDates({ date: ymd })) {
      const rid = d.restaurant.id;
      countsByYmd[ymd][rid] = (countsByYmd[ymd][rid] ?? 0) + 1;
    }
  }

  const restaurantPins: HomeRestaurantPinBase[] = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
  }));

  return (
    <div className="home-page-stack" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="home-map-block">
        <HomeMapSection days={days} countsByYmd={countsByYmd} restaurants={restaurantPins} />
      </div>
    </div>
  );
}
