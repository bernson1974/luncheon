"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

/** ymd → restaurantId → true if any date at that restaurant that day has 1 spot left */
export type OneSpotLeftByYmd = Record<string, Record<string, boolean>>;


function dayHasAnyBookings(ymd: string, countsByYmd: CountsByYmd): boolean {
  const c = countsByYmd[ymd];
  if (!c) return false;
  return Object.values(c).some((n) => n > 0);
}

export default function HomeMapSection({
  days: serverDays,
  countsByYmd: serverCounts,
  oneSpotLeftByYmd: serverOneSpot = {},
  restaurants: serverRestaurants,
  committedYmds: serverCommittedYmds = [],
}: {
  days: HomeMapDay[];
  countsByYmd: CountsByYmd;
  oneSpotLeftByYmd?: OneSpotLeftByYmd;
  restaurants: HomeRestaurantPinBase[];
  /** Days where user has a date (from server cookie) */
  committedYmds?: string[];
}) {
  const [days, setDays] = useState(serverDays);
  const [countsByYmd, setCountsByYmd] = useState(serverCounts);
  const [oneSpotLeftByYmd, setOneSpotLeftByYmd] = useState(serverOneSpot);
  const [restaurants, setRestaurants] = useState<HomeRestaurantPinBase[]>(serverRestaurants);
  const [selectedYmd, setSelectedYmd] = useState(serverDays[0]?.ymd ?? "");
  const [clientCommittedYmds, setClientCommittedYmds] = useState<string[] | null>(null);

  const fetchMapPins = () => {
    fetch("/api/map-pins")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.days) {
          setDays(data.days);
          setCountsByYmd(data.countsByYmd ?? {});
          setOneSpotLeftByYmd(data.oneSpotLeftByYmd ?? {});
          if (data.restaurants?.length) setRestaurants(data.restaurants);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const onFocus = () => fetchMapPins();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (serverCommittedYmds.length > 0) return;
    fetch("/api/user/commitments", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { committedYmds: [] }))
      .then((data: { committedYmds?: string[] }) =>
        setClientCommittedYmds(data.committedYmds ?? [])
      )
      .catch(() => setClientCommittedYmds([]));
  }, [serverCommittedYmds.length]);

  const committedYmds = serverCommittedYmds.length > 0 ? serverCommittedYmds : (clientCommittedYmds ?? []);
  const alreadyHasDateOnDay = selectedYmd.length > 0 && committedYmds.includes(selectedYmd);

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
    const oneSpotLeft = oneSpotLeftByYmd[selectedYmd] ?? {};
    return restaurants
      .map((r) => ({
        id: r.id,
        name: r.name,
        lat: r.latitude,
        lng: r.longitude,
        dateCount: counts[r.id] ?? 0,
        oneSpotLeft: oneSpotLeft[r.id] ?? false,
      }))
      .filter((pin) => pin.dateCount > 0);
  }, [selectedYmd, countsByYmd, oneSpotLeftByYmd, restaurants]);

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

      <div style={{ position: "relative" }}>
        {alreadyHasDateOnDay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
              borderRadius: "0.75rem",
            }}
          >
            <Link
              href={`/my-lunch?date=${encodeURIComponent(selectedYmd)}`}
              className="danger-button"
              style={{
                width: "auto",
                minWidth: "200px",
                marginTop: 0,
              }}
            >
              You're already booked this day.
            </Link>
          </div>
        )}
        <MapWrapper
        pins={pins}
        selectedYmd={selectedYmd}
        greyedOut={alreadyHasDateOnDay}
      />
      </div>
    </>
  );
}
