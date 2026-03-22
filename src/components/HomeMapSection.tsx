"use client";

import { useEffect, useMemo, useState } from "react";
import MapWrapper from "@/components/MapWrapper";
import DayPickerSubtabs from "@/components/DayPickerSubtabs";

export type HomeMapDay = {
  ymd: string;
};

export type HomeRestaurantPinBase = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

/** ymd → restaurantId → count of dates that day */
export type CountsByYmd = Record<string, Record<string, number>>;

function dayHasAnyBookings(ymd: string, countsByYmd: CountsByYmd): boolean {
  const c = countsByYmd[ymd];
  if (!c) return false;
  return Object.values(c).some((n) => n > 0);
}

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

  const hasAnyBookingsInWindow = useMemo(
    () => days.some((d) => dayHasAnyBookings(d.ymd, countsByYmd)),
    [days, countsByYmd]
  );

  /** Tomma dagar är ej klickbara när minst en annan dag har minst en dejt (som My Bites). */
  const isDayDisabled = (ymd: string) =>
    hasAnyBookingsInWindow && !dayHasAnyBookings(ymd, countsByYmd);

  useEffect(() => {
    setSelectedYmd((prev) => {
      const prevOk =
        prev &&
        days.some((d) => d.ymd === prev) &&
        (!hasAnyBookingsInWindow || dayHasAnyBookings(prev, countsByYmd));
      if (prevOk) return prev;
      if (hasAnyBookingsInWindow) {
        const first = days.find((d) => dayHasAnyBookings(d.ymd, countsByYmd));
        return first?.ymd ?? days[0]?.ymd ?? "";
      }
      return days[0]?.ymd ?? "";
    });
  }, [days, countsByYmd, hasAnyBookingsInWindow]);

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

  if (days.length === 0) {
    return null;
  }

  return (
    <>
      <DayPickerSubtabs
        days={days}
        selectedYmd={selectedYmd}
        onSelect={setSelectedYmd}
        ariaLabel="Choose day for map"
        idPrefix="home-map"
        isDisabled={isDayDisabled}
        isActive={(ymd) => !isDayDisabled(ymd) && selectedYmd === ymd}
      />

      <MapWrapper pins={pins} selectedYmd={selectedYmd} />
    </>
  );
}
