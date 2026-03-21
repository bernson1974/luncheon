"use client";

import { useEffect, useMemo, useState } from "react";
import MapWrapper from "@/components/MapWrapper";
import { getUserBookedDateYmds } from "@/lib/bookingState";
import {
  lunchDateShortTabLabelSv,
  stockholmTodayYmd,
} from "@/lib/lunchDateWindow";

export type HomeMapDay = {
  ymd: string;
};

export type HomeRestaurantPinBase = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

/** ymd → restaurantId → antal dejter den dagen */
export type CountsByYmd = Record<string, Record<string, number>>;

export default function HomeMapSection({
  days,
  countsByYmd,
  restaurants,
}: {
  days: HomeMapDay[];
  countsByYmd: CountsByYmd;
  restaurants: HomeRestaurantPinBase[];
}) {
  const [selectedYmd, setSelectedYmd] = useState(days[0]?.ymd ?? "");
  const [userBookedYmds, setUserBookedYmds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ymds = await getUserBookedDateYmds();
      if (!cancelled) setUserBookedYmds(ymds);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pins = useMemo(() => {
    const counts = countsByYmd[selectedYmd] ?? {};
    return restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      dateCount: counts[r.id] ?? 0,
    }));
  }, [selectedYmd, countsByYmd, restaurants]);

  const todayYmd = stockholmTodayYmd();

  if (days.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="my-lunch-tablist home-map-tablist"
        role="tablist"
        aria-label="Välj dag för kartan"
      >
        {days.map((d) => {
          const isActive = selectedYmd === d.ymd;
          const hasUserBooking =
            userBookedYmds !== null && userBookedYmds.has(d.ymd);
          const tabClass = [
            "my-lunch-tab",
            userBookedYmds !== null &&
              (hasUserBooking
                ? "home-map-tab--has-booking"
                : "home-map-tab--no-user-booking"),
            isActive ? "my-lunch-tab--active" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={d.ymd}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`home-map-tab-${d.ymd}`}
              className={tabClass}
              onClick={() => setSelectedYmd(d.ymd)}
            >
              <span style={{ display: "block" }}>
                {lunchDateShortTabLabelSv(d.ymd)}
              </span>
              {d.ymd === todayYmd && (
                <span className="my-lunch-tab-today">Idag</span>
              )}
            </button>
          );
        })}
      </div>

      <MapWrapper pins={pins} selectedYmd={selectedYmd} />
    </>
  );
}
