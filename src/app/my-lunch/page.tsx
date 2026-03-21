"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { LunchDatePublic } from "@/lib/models";
import { syncLocalBookingStateWithServer } from "@/lib/bookingState";

const MeetingPointPicker = dynamic(
  () => import("@/components/MeetingPointPicker"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "200px", borderRadius: "0.75rem", background: "#e2e8f0" }} />
    )
  }
);

const CUISINE_LABELS: Record<string, string> = {
  indian: "Indiskt",
  thai: "Thaimat",
  swedish: "Svensk husmanskost",
  japanese: "Japanskt / Sushi",
  pizza: "Pizza",
  burgers: "Burgare",
  asian: "Asiatiskt"
};

export default function MyLunchPage() {
  const [dates, setDates] = useState<LunchDatePublic[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await syncLocalBookingStateWithServer();

    const ids: string[] = [];

    const createdId = localStorage.getItem("myCreatedDateId");
    if (createdId) ids.push(createdId);

    // Find all joined dates from localStorage keys like "joined:<id>"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("joined:")) {
        const id = key.replace("joined:", "");
        if (!ids.includes(id)) ids.push(id);
      }
    }

    if (ids.length === 0) {
      setDates([]);
      setLoading(false);
      return;
    }

    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/dates/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    setDates(results.filter(Boolean).filter((d: LunchDatePublic) => d.status !== "cancelled"));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <Link href="/" className="back-link">← Tillbaka</Link>
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>Laddar…</p>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div>
        <Link href="/" className="back-link">← Tillbaka</Link>
        <h1 className="page-title">Min lunch</h1>
        <div className="empty-state">
          <p>Du har ingen planerad lunchdejt idag.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            <Link href="/create">
              <button className="primary-button" type="button" style={{ maxWidth: "260px", marginInline: "auto" }}>
                Lägg upp en dejt
              </button>
            </Link>
            <Link href="/browse">
              <button className="secondary-button" type="button" style={{ maxWidth: "260px", marginInline: "auto" }}>
                Hitta en dejt att joina
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="back-link">← Tillbaka</Link>
      <h1 className="page-title">Min lunch</h1>
      <p className="page-subtitle">
        {new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      {dates.map((date) => {
        const createdId = localStorage.getItem("myCreatedDateId");
        const isCreator = createdId === date.id;
        const hasMeetingPoint =
          date.meetingPoint?.latitude != null && date.meetingPoint?.longitude != null;

        return (
          <div key={date.id}>
            {/* Status banner */}
            <div
              className="card"
              style={{
                background: "#f0fdfa",
                border: "1px solid #ccfbf1",
                marginBottom: "0.75rem"
              }}
            >
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#0f766e", fontWeight: 600 }}>
                {isCreator ? "Du skapade den här dejten." : "Du är med i den här dejten."}
              </p>
            </div>

            {/* Core info */}
            <div className="card">
              <div className="detail-row">
                <span className="detail-label">Ämne</span>
                <span className="topic-tag">{date.topic}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Restaurang</span>
                <span>
                  {date.restaurant.name}
                  <span className="secondary-text" style={{ marginLeft: "0.4rem" }}>
                    ({CUISINE_LABELS[date.restaurant.cuisine] ?? date.restaurant.cuisine})
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tid</span>
                <span>
                  {date.timeStart}
                  {date.timeEnd ? `–${date.timeEnd}` : ""}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span>
                  {date.status === "open"
                    ? `Öppen · ${date.spotsLeft} plats${date.spotsLeft !== 1 ? "er" : ""} kvar`
                    : date.status === "full"
                    ? "Fullbokad"
                    : "Avbokad"}
                </span>
              </div>
            </div>

            {/* Participants */}
            <div className="card">
              <p className="field-label" style={{ marginBottom: "0.5rem" }}>
                Deltagare ({date.participants.length + 1} / {date.maxParticipants})
              </p>
              <ul className="participant-list">
                <li>
                  <strong>{date.creatorAlias}</strong>
                  <span className="secondary-text" style={{ marginLeft: "0.4rem", fontSize: "0.78rem" }}>
                    skapare
                  </span>
                </li>
                {date.participants.map((p) => (
                  <li key={p.id}>{p.alias}</li>
                ))}
              </ul>
            </div>

            {/* Meeting point */}
            {hasMeetingPoint && (
              <div className="card">
                <p className="field-label" style={{ marginBottom: "0.5rem" }}>Mötesplats</p>
                <MeetingPointPicker
                  center={{
                    lat: date.meetingPoint!.latitude,
                    lng: date.meetingPoint!.longitude
                  }}
                  value={{
                    lat: date.meetingPoint!.latitude,
                    lng: date.meetingPoint!.longitude
                  }}
                  onChange={() => {}}
                  readonly
                />
                {date.meetingPoint?.description && (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#0f172a" }}>
                    {date.meetingPoint.description}
                  </p>
                )}
              </div>
            )}

            {!hasMeetingPoint && (
              <div className="card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#92400e" }}>
                  Ingen mötesplats är angiven för den här dejten.
                </p>
              </div>
            )}

            <Link href={`/date/${date.id}`}>
              <button className="secondary-button" type="button" style={{ marginTop: "0.5rem" }}>
                Se alla detaljer / hantera dejten
              </button>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
