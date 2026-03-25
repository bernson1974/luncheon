"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup as LeafletLayerGroup } from "leaflet";
import { lunchDateLabel } from "@/lib/lunchDateWindow";
import { getUserMapCenterOrFallback, MAP_FALLBACK_CENTER } from "@/lib/mapGeolocation";
import MapSearchInput from "./MapSearchInput";

type LeafletNs = typeof import("leaflet");

export interface RestaurantPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dateCount: number;
  /** True if any date at this restaurant that day has only 1 spot left */
  oneSpotLeft?: boolean;
}

interface Props {
  pins?: RestaurantPin[];
  /** Selected day for popup and Find link. */
  selectedYmd: string;
  /** Grey out pins (e.g. when user already has a date that day). */
  greyedOut?: boolean;
}

function makeBadgeIcon(L: LeafletNs, count: number, greyedOut?: boolean, oneSpotLeft?: boolean) {
  const color = greyedOut
    ? "#94a3b8"
    : oneSpotLeft
      ? "#c96a3a"
      : count > 0
        ? "#0f766e"
        : "#94a3b8";
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

export default function LindholmenMap({ pins = [], selectedYmd, greyedOut }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LeafletLayerGroup | null>(null);
  const leafletRef = useRef<LeafletNs | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(false);

  const activePins = pins;
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

        const center = await getUserMapCenterOrFallback(MAP_FALLBACK_CENTER);
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: false,
        }).setView([center.lat, center.lng], 16);

        L.control.zoom({ position: "bottomleft" }).addTo(map);

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
      const icon = makeBadgeIcon(L, pin.dateCount, greyedOut, pin.oneSpotLeft);
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
                style="display: block; margin-top: 0.55rem; padding: 0.55rem 0.75rem; border-radius: 0.5rem; background: #1e524e; color: #ecfdf5; font-weight: 600; font-size: 0.82rem; text-decoration: none; text-align: center; box-sizing: border-box;"
              >View dates →</a>
            </div>
          `;
      L.marker([pin.lat, pin.lng], { icon })
        .bindPopup(popupHtml)
        .addTo(layer);
    }
  }, [mapReady, activePins, selectedYmd, dayLabel, greyedOut]);

  if (error) {
    return (
      <div
        style={{
          height: "442px",
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

  const handleSearchFound = useCallback((lat: number, lng: number) => {
    mapRef.current?.setView([lat, lng], 16);
  }, []);

  return (
    <div style={{ position: "relative", borderRadius: "0.75rem", overflow: "hidden", height: "442px" }}>
      <MapSearchInput
        onFound={handleSearchFound}
        disabled={!mapReady}
        placeholder="Sök plats eller adress…"
      />
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: "442px" }}
      />
    </div>
  );
}
