"use client";

import { useEffect, useRef, useState } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  center: LatLng;
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
  readonly?: boolean;
  /** Shown in popup above marker (readonly). */
  description?: string;
}

function meetingDescriptionPopupEl(text: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "meeting-point-popup-desc";
  el.style.cssText =
    "max-width:280px;font-size:0.88rem;line-height:1.4;color:#0f172a;margin:0;padding:2px 0;";
  el.textContent = text;
  return el;
}

export default function MeetingPointPicker({
  center,
  value,
  onChange,
  readonly,
  description,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const [leafletReadyTick, setLeafletReadyTick] = useState(0);
  // Keep a stable ref to onChange so Leaflet callbacks always use the latest version
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current || mapRef.current) return;

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
        marker.bindPopup("Drag me to where you’ll meet.").openPopup();

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChangeRef.current({ lat: pos.lat, lng: pos.lng });
        });

        map.on("click", (e: L.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      } else {
        /* Popup set in useEffect when readonly + description ready */
      }

      if (cancelled) return;
      mapRef.current = map;
      markerRef.current = marker;
      setLeafletReadyTick((t) => t + 1);
    }

    void init();

    return () => {
      cancelled = true;
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

  useEffect(() => {
    if (!readonly || leafletReadyTick === 0) return;
    const marker = markerRef.current as import("leaflet").Marker | null;
    if (!marker) return;

    const text = (description ?? "").trim() || "Meeting point";
    const el = meetingDescriptionPopupEl(text);
    marker.unbindPopup();
    marker.bindPopup(el, {
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
      className: "meeting-point-desc-leaflet-popup",
    });
    marker.openPopup();
  }, [readonly, description, leafletReadyTick]);

  return (
    <div
      ref={containerRef}
      style={{ height: "220px", borderRadius: "0.75rem", overflow: "hidden" }}
    />
  );
}
