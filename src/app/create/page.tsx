"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAlias } from "@/lib/userAlias";
import dynamic from "next/dynamic";
import TimeQuarterSelect from "@/components/TimeQuarterSelect";
import { restaurants } from "@/lib/restaurants";
import type { LatLng } from "@/components/MeetingPointPicker";

const MeetingPointPicker = dynamic(
  () => import("@/components/MeetingPointPicker"),
  { ssr: false, loading: () => <div style={{ height: "220px", borderRadius: "0.75rem", background: "#e2e8f0" }} /> }
);

function getUserToken(): string {
  let token = localStorage.getItem("userToken");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("userToken", token);
  }
  return token;
}

export default function CreatePage() {
  const router = useRouter();

  const [alias, setAlias] = useState("");
  const [timeStart, setTimeStart] = useState("12:00");
  const [timeEnd, setTimeEnd] = useState("");
  const [restaurantId, setRestaurantId] = useState(restaurants[0].id);
  const [topic, setTopic] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [meetingPoint, setMeetingPoint] = useState<LatLng | null>(null);
  const [meetingDescription, setMeetingDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = getStoredAlias();
    if (stored) setAlias(stored);
  }, []);

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId) ?? restaurants[0];
  const mapCenter: LatLng = { lat: selectedRestaurant.latitude, lng: selectedRestaurant.longitude };

  const isValid = alias.trim().length > 0 && topic.trim().length > 0 && timeStart.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const userToken = getUserToken();
      const res = await fetch("/api/dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAlias: alias.trim(),
          creatorToken: userToken,
          timeStart,
          timeEnd: timeEnd || undefined,
          restaurantId,
          topic: topic.trim(),
          maxParticipants,
          meetingPoint: meetingPoint
            ? {
                latitude: meetingPoint.lat,
                longitude: meetingPoint.lng,
                description: meetingDescription.trim() || undefined
              }
            : undefined,
        }),
      });

      if (!res.ok) throw new Error("Kunde inte skapa lunchdejten");

      const date = await res.json();

      // Remember which date we created so the detail page can show creator UI
      localStorage.setItem("myCreatedDateId", date.id);

      router.push(`/date/${date.id}`);
    } catch {
      setError("Något gick fel. Försök igen.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/" className="back-link">
        ← Tillbaka
      </Link>

      <h1 className="page-title">Ny lunchdejt</h1>
      <p className="page-subtitle">
        Fyll i detaljerna nedan. Din dejt blir synlig för alla på Lindholmen
        direkt.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label" htmlFor="alias">
              Ditt namn / alias
            </label>
            <input
              id="alias"
              className="field-input"
              type="text"
              readOnly
              aria-readonly="true"
              value={alias}
              style={{ background: "#f1f5f9", cursor: "default" }}
            />
            <p className="secondary-text" style={{ marginTop: "0.35rem" }}>
              Byt alias under{" "}
              <Link href="/settings" style={{ color: "#0f766e", fontWeight: 500 }}>
                inställningar
              </Link>
              .
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label">Tid (kvartal: :00, :15, :30, :45)</label>
            <div className="field-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Startar
                </label>
                <TimeQuarterSelect
                  value={timeStart}
                  onChange={setTimeStart}
                  required
                  selectClassName="field-select"
                  groupAriaLabel="Starttid"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Slutar (valfritt)
                </label>
                <TimeQuarterSelect
                  value={timeEnd}
                  onChange={setTimeEnd}
                  allowEmpty
                  emptyLabel="Ingen"
                  selectClassName="field-select"
                  groupAriaLabel="Sluttid"
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label" htmlFor="restaurant">
              Restaurang
            </label>
            <select
              id="restaurant"
              className="field-select"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label">
              Mötesplats
            </label>
            <p className="secondary-text" style={{ marginBottom: "0.5rem" }}>
              Klicka på kartan eller dra nålen dit ni ska mötas.
            </p>
            <MeetingPointPicker
              center={mapCenter}
              value={meetingPoint}
              onChange={setMeetingPoint}
            />
            <input
              className="field-input"
              type="text"
              placeholder='T.ex. "Vid den röda bänken utanför ingången"'
              value={meetingDescription}
              onChange={(e) => setMeetingDescription(e.target.value)}
              maxLength={120}
              style={{ marginTop: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label" htmlFor="topic">
              Samtalsämne
            </label>
            <input
              id="topic"
              className="field-input"
              type="text"
              placeholder="T.ex. AI och framtidens jobb, Premier League..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label className="field-label" htmlFor="max">
              Max antal deltagare (inkl. dig)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.4rem" }}>
              <input
                id="max"
                type="range"
                min={2}
                max={8}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontWeight: 600, fontSize: "1.1rem", minWidth: "1.5rem", textAlign: "center" }}>
                {maxParticipants}
              </span>
            </div>
            <p className="secondary-text" style={{ marginTop: "0.25rem" }}>
              {maxParticipants - 1} person{maxParticipants - 1 !== 1 ? "er" : ""} kan joina utöver dig.
            </p>
          </div>
        </div>

        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
            {error}
          </p>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={!isValid || submitting}
        >
          {submitting ? "Publicerar…" : "Publicera lunchdejt"}
        </button>
      </form>
    </div>
  );
}
