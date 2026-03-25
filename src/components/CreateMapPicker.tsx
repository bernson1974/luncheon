"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup as LeafletLayerGroup } from "leaflet";
import { cuisineLabel } from "@/lib/cuisineLabels";
import {
  getCachedMapUserCenter,
  getUserMapCenterOrFallback,
  MAP_FALLBACK_CENTER,
} from "@/lib/mapGeolocation";
import MapSearchInput from "./MapSearchInput";

type LeafletNs = typeof import("leaflet");

export interface FoursquarePlace {
  fsq_id: string;
  name: string;
  latitude: number;
  longitude: number;
  cuisine: string;
}

interface Props {
  selectedRestaurant: FoursquarePlace | null;
  onSelect: (place: FoursquarePlace) => void;
  /** Callback when the list of places on the map changes */
  onPlacesChange?: (places: FoursquarePlace[]) => void;
  /** When set, only show markers for places with this cuisine key */
  cuisineFilter?: string;
}

function makeGreenCircleIcon(L: LeafletNs) {
  const html = `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #0f766e;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    "></div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

export default function CreateMapPicker({ selectedRestaurant, onSelect, onPlacesChange, cuisineFilter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LeafletLayerGroup | null>(null);
  const leafletRef = useRef<LeafletNs | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [places, setPlaces] = useState<FoursquarePlace[]>([]);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onPlacesChangeRef = useRef(onPlacesChange);
  onPlacesChangeRef.current = onPlacesChange;

  const fetchFoursquare = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const neStr = `${ne.lat},${ne.lng}`;
    const swStr = `${sw.lat},${sw.lng}`;

    fetchAbortRef.current?.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;

    fetch(
      `/api/places/search?ne=${encodeURIComponent(neStr)}&sw=${encodeURIComponent(swStr)}`,
      { signal: ctrl.signal }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { places?: FoursquarePlace[] } | null) => {
        if (data?.places) {
          setPlaces(data.places);
          onPlacesChangeRef.current?.(data.places);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      try {
        const raw = await import("leaflet");
        const L = (raw as { default?: LeafletNs }).default ?? (raw as unknown as LeafletNs);
        await import("leaflet/dist/leaflet.css");

        if (cancelled || !containerRef.current || mapRef.current) return;

        const initial = getCachedMapUserCenter(MAP_FALLBACK_CENTER);
        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: false,
        }).setView([initial.lat, initial.lng], 16);

        L.control.zoom({ position: "bottomleft" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);

        mapRef.current = map;
        markersLayerRef.current = markersLayer;
        leafletRef.current = L;
        setMapReady(true);

        void getUserMapCenterOrFallback(MAP_FALLBACK_CENTER).then((center) => {
          if (cancelled || mapRef.current !== map) return;
          map.setView([center.lat, center.lng], 16);
        });
      } catch {
        if (!cancelled) throw new Error("Map init failed");
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      fetchAbortRef.current?.abort();
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
    if (!mapReady || !mapRef.current) return;
    fetchFoursquare();
    mapRef.current.on("moveend", fetchFoursquare);
    return () => {
      mapRef.current?.off("moveend", fetchFoursquare);
      fetchAbortRef.current?.abort();
    };
  }, [mapReady, fetchFoursquare]);

  useEffect(() => {
    if (!mapReady || !markersLayerRef.current || !leafletRef.current) return;

    const L = leafletRef.current;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const filtered = cuisineFilter
      ? places.filter((p) => (p.cuisine || "restaurant") === cuisineFilter)
      : places;

    for (const place of filtered) {
      const icon = makeGreenCircleIcon(L);
      const cuisineText = place.cuisine ? cuisineLabel(place.cuisine) : "Restaurant";
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.5;">
          <strong>${place.name}</strong><br>
          <span style="color: #64748b;">${cuisineText}</span><br>
          <button
            data-create-invitation-btn
            type="button"
            style="display: block; width: 100%; margin-top: 0.55rem; padding: 0.55rem 0.75rem; border-radius: 0.5rem; background: #1e524e; color: #ecfdf5; font-weight: 600; font-size: 0.82rem; text-align: center; border: none; cursor: pointer; box-sizing: border-box; font-family: inherit;"
          >Create invitation</button>
        </div>
      `;
      const marker = L.marker([place.latitude, place.longitude], { icon })
        .bindPopup(popupHtml)
        .addTo(layer);

      marker.on("popupopen", () => {
        const popupEl = marker.getPopup()?.getElement();
        const btn = popupEl?.querySelector<HTMLButtonElement>("[data-create-invitation-btn]");
        if (btn) {
          btn.onclick = () => {
            onSelectRef.current(place);
            marker.closePopup();
          };
        }
      });
    }
  }, [mapReady, places, cuisineFilter]);

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
