"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup as LeafletLayerGroup } from "leaflet";
import { lunchDateLabel } from "@/lib/lunchDateWindow";

type LeafletNs = typeof import("leaflet");

const LINDHOLMEN_LAT = 57.7065;
const LINDHOLMEN_LNG = 11.9384;

export interface RestaurantPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dateCount: number;
}

interface Props {
  pins?: RestaurantPin[];
  /** Selected day for popup and Find link. */
  selectedYmd: string;
}

function makeBadgeIcon(L: LeafletNs, count: number) {
  const color = count > 0 ? "#0f766e" : "#94a3b8";
  const textColor = "#ffffff";
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
    popupAnchor: [0, -18],
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
  { id: "chalmers-karen", name: "Chalmers Kåren", lat: 57.7076, lng: 11.9377, dateCount: 0 },
];

export default function LindholmenMap({ pins, selectedYmd }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LeafletLayerGroup | null>(null);
  const leafletRef = useRef<LeafletNs | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(false);

  const activePins = pins ?? DEFAULT_PINS;
  const dayLabel = selectedYmd ? lunchDateLabel(selectedYmd) : "";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      try {
        const raw = await import("leaflet");
        const L = (raw as { default?: LeafletNs }).default ?? (raw as unknown as LeafletNs);
        await import("leaflet/dist/leaflet.css");

        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
        }).setView([LINDHOLMEN_LAT, LINDHOLMEN_LNG], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);

        mapRef.current = map;
        markersLayerRef.current = markersLayer;
        leafletRef.current = L;
        setMapReady(true);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
        leafletRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !markersLayerRef.current || !leafletRef.current) return;

    const L = leafletRef.current;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const ymdQ = encodeURIComponent(selectedYmd);

    for (const pin of activePins) {
      const icon = makeBadgeIcon(L, pin.dateCount);
      const countText =
        pin.dateCount > 0
          ? `${pin.dateCount} lunch date${pin.dateCount > 1 ? "s" : ""} · ${dayLabel}`
          : `No dates · ${dayLabel}`;
      const linkHref = `/browse?restaurantId=${encodeURIComponent(pin.id)}&date=${ymdQ}`;
      const popupHtml = `
            <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.5;">
              <strong>${pin.name}</strong><br>
              <span style="color: #64748b;">${countText}</span><br>
              <a
                href="${linkHref}"
                style="color: #0f766e; font-weight: 600; text-decoration: none; margin-top: 4px; display: inline-block;"
              >View dates →</a>
            </div>
          `;
      L.marker([pin.lat, pin.lng], { icon })
        .bindPopup(popupHtml)
        .addTo(layer);
    }
  }, [mapReady, activePins, selectedYmd, dayLabel]);

  if (error) {
    return (
      <div
        style={{
          height: "340px",
          borderRadius: "0.75rem",
          background: "#e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: "0.85rem",
        }}
      >
        Lindholmen, Gothenburg
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ borderRadius: "0.75rem", overflow: "hidden", height: "340px" }}
    />
  );
}
