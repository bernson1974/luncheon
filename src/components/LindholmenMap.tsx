"use client";

import { useEffect, useRef, useState } from "react";

const LINDHOLMEN_LAT = 57.7065;
const LINDHOLMEN_LNG = 11.9384;

interface RestaurantPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dateCount: number;
}

interface Props {
  pins?: RestaurantPin[];
}

function makeBadgeIcon(L: typeof import("leaflet"), count: number) {
  const color = count > 0 ? "#0f766e" : "#94a3b8";
  const textColor = count > 0 ? "#ffffff" : "#ffffff";
  const html = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${textColor};
        font-size: 13px;
        font-weight: 700;
        font-family: system-ui, sans-serif;
      ">${count}</div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
}

const DEFAULT_PINS: RestaurantPin[] = [
  { id: "krishna-das", name: "Krishna Das", lat: 57.7074, lng: 11.9381, dateCount: 0 },
  { id: "thai-orchid", name: "Thai Orchid Lindholmen", lat: 57.7071, lng: 11.9375, dateCount: 0 },
  { id: "smaka", name: "Smaka", lat: 57.7069, lng: 11.939, dateCount: 0 },
  { id: "sushirullen", name: "Sushirullen", lat: 57.7072, lng: 11.9385, dateCount: 0 },
  { id: "leos-lunchbar", name: "Leos Lunchbar", lat: 57.7068, lng: 11.9378, dateCount: 0 },
  { id: "lindholmen-pizza", name: "Lindholmen Pizza & Grill", lat: 57.7075, lng: 11.937, dateCount: 0 },
  { id: "burgery", name: "Burgery", lat: 57.7066, lng: 11.9382, dateCount: 0 },
  { id: "wok-of-fame", name: "Wok of Fame", lat: 57.7073, lng: 11.9368, dateCount: 0 },
  { id: "paj-och-mer", name: "Paj & Mer", lat: 57.707, lng: 11.9393, dateCount: 0 },
  { id: "chalmers-karen", name: "Chalmers Kåren", lat: 57.7076, lng: 11.9377, dateCount: 0 }
];

export default function LindholmenMap({ pins }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [error, setError] = useState(false);

  const activePins = pins ?? DEFAULT_PINS;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          scrollWheelZoom: false
        }).setView([LINDHOLMEN_LAT, LINDHOLMEN_LNG], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        activePins.forEach((pin) => {
          const icon = makeBadgeIcon(L, pin.dateCount);
          const countText =
            pin.dateCount > 0
              ? `${pin.dateCount} lunchdejt${pin.dateCount > 1 ? "er" : ""} idag`
              : "Inga dejter idag";
          const linkHref = `/browse?restaurantId=${pin.id}`;
          const popupHtml = `
            <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.5;">
              <strong>${pin.name}</strong><br>
              <span style="color: #64748b;">${countText}</span><br>
              <a
                href="${linkHref}"
                style="color: #0f766e; font-weight: 600; text-decoration: none; margin-top: 4px; display: inline-block;"
              >Se dejtar →</a>
            </div>
          `;
          L.marker([pin.lat, pin.lng], { icon })
            .addTo(map)
            .bindPopup(popupHtml);
        });

        mapRef.current = map;
      } catch {
        setError(true);
      }
    }

    initMap();

    return () => {
      if (mapRef.current) {
        (mapRef.current as import("leaflet").Map).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div
        style={{
          height: "260px",
          borderRadius: "0.75rem",
          background: "#e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: "0.85rem"
        }}
      >
        Lindholmen, Göteborg
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ borderRadius: "0.75rem", overflow: "hidden", height: "260px" }}
    />
  );
}
