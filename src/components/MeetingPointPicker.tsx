"use client";

import { useEffect, useRef } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  center: LatLng;
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
  readonly?: boolean;
}

export default function MeetingPointPicker({ center, value, onChange, readonly }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  // Keep a stable ref to onChange so Leaflet callbacks always use the latest version
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!containerRef.current || mapRef.current) return;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      if (mapRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [center.lat, center.lng],
        17
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const initialPos = value ?? center;
      const marker = L.marker([initialPos.lat, initialPos.lng], {
        icon,
        draggable: !readonly
      }).addTo(map);

      if (!readonly) {
        marker.bindPopup("Dra mig dit ni ska mötas.").openPopup();

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChangeRef.current({ lat: pos.lat, lng: pos.lng });
        });

        map.on("click", (e: L.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      } else {
        marker.bindPopup("Mötesplats").openPopup();
      }

      mapRef.current = map;
      markerRef.current = marker;
    }

    init();

    return () => {
      if (mapRef.current) {
        (mapRef.current as import("leaflet").Map).remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync if center changes (restaurant changed)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const map = mapRef.current as import("leaflet").Map;
    const marker = markerRef.current as import("leaflet").Marker;
    map.setView([center.lat, center.lng], 17);
    if (!value) {
      marker.setLatLng([center.lat, center.lng]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  return (
    <div
      ref={containerRef}
      style={{ height: "220px", borderRadius: "0.75rem", overflow: "hidden" }}
    />
  );
}
