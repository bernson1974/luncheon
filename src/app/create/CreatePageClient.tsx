"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import dynamic from "next/dynamic";
import TimeQuarterSelect from "@/components/TimeQuarterSelect";
import type { LatLng } from "@/components/MeetingPointPicker";
import { rememberCreatedDate } from "@/lib/creatorStorage";
import type { FoursquarePlace } from "@/components/CreateMapPicker";
import { cuisineLabel } from "@/lib/cuisineLabels";

const CreateMapPicker = dynamic(() => import("@/components/CreateMapPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "442px", borderRadius: "0.75rem", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading map…
    </div>
  ),
});

const MeetingPointPicker = dynamic(() => import("@/components/MeetingPointPicker"), {
  ssr: false,
  loading: () => <div style={{ height: "220px", borderRadius: "0.75rem", background: "#e2e8f0" }} />,
});


type WindowDate = { ymd: string; label: string };

const PARTICIPANT_MIN = 2;
const PARTICIPANT_MAX = 8;
const PARTICIPANT_CHOICES = Array.from(
  { length: PARTICIPANT_MAX - PARTICIPANT_MIN + 1 },
  (_, i) => PARTICIPANT_MIN + i
);

export default function CreatePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qpDate = searchParams.get("date");

  const [windowDates, setWindowDates] = useState<WindowDate[]>([]);
  const [committedYmds, setCommittedYmds] = useState<string[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<FoursquarePlace | null>(null);
  const [mapPlaces, setMapPlaces] = useState<FoursquarePlace[]>([]);
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [lunchDateYmd, setLunchDateYmd] = useState("");
  const [timeStart, setTimeStart] = useState("12:00");
  const [timeEnd, setTimeEnd] = useState("");
  const [topic, setTopic] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [meetingPoint, setMeetingPoint] = useState<LatLng | null>(null);
  const [meetingDescription, setMeetingDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWindow() {
      try {
        const res = await fetch("/api/lunch-window");
        if (!res.ok) return;
        const data = (await res.json()) as { dates: WindowDate[] };
        setWindowDates(data.dates ?? []);
      } catch {
        /* ignore */
      }
    }
    void loadWindow();
  }, []);

  useEffect(() => {
    async function loadCommitments() {
      try {
        const res = await fetch("/api/user/commitments", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { committedYmds: string[] };
        setCommittedYmds(data.committedYmds ?? []);
      } catch {
        /* ignore */
      }
    }
    void loadCommitments();
  }, []);

  useEffect(() => {
    if (windowDates.length === 0) return;
    if (
      qpDate &&
      windowDates.some((d) => d.ymd === qpDate) &&
      !committedYmds.includes(qpDate)
    ) {
      setLunchDateYmd(qpDate);
      return;
    }
    setLunchDateYmd((prev) => {
      if (prev && windowDates.some((d) => d.ymd === prev)) return prev;
      const firstFree = windowDates.find((d) => !committedYmds.includes(d.ymd));
      return (firstFree ?? windowDates[0]).ymd;
    });
  }, [windowDates, committedYmds, qpDate]);

  const mapCenter: LatLng | undefined = selectedRestaurant
    ? { lat: selectedRestaurant.latitude, lng: selectedRestaurant.longitude }
    : undefined;

  const isDateBlocked = lunchDateYmd.length > 0 && committedYmds.includes(lunchDateYmd);
  const { user } = useAuth();
  const storedAlias = user?.alias ?? "";
  const isValid =
    selectedRestaurant != null &&
    storedAlias.length > 0 &&
    topic.trim().length > 0 &&
    timeStart.length > 0 &&
    lunchDateYmd.length > 0 &&
    !isDateBlocked;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedRestaurant || !isValid || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: lunchDateYmd,
          timeStart,
          timeEnd: timeEnd || undefined,
          restaurantId: selectedRestaurant.fsq_id,
          restaurant: {
            id: selectedRestaurant.fsq_id,
            name: selectedRestaurant.name,
            latitude: selectedRestaurant.latitude,
            longitude: selectedRestaurant.longitude,
            cuisine: selectedRestaurant.cuisine,
          },
          topic: topic.trim(),
          maxParticipants,
          meetingPoint: meetingPoint
            ? {
                latitude: meetingPoint.lat,
                longitude: meetingPoint.lng,
                description: meetingDescription.trim() || undefined,
              }
            : undefined,
        }),
      });

      if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "busy_that_day") {
          setError("You already have a lunch date that day. Pick another day or leave/cancel the other one first.");
        } else {
          setError("Couldn't create the lunch date right now.");
        }
        setSubmitting(false);
        return;
      }

      if (!res.ok) throw new Error("Could not create lunch date");

      const date = await res.json();
      rememberCreatedDate(date.id, user?.id ?? "");

      router.push(`/date/${date.id}`);
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      {!selectedRestaurant && (
        <>
          <h1 className="page-title" style={{ color: "#064e3b" }}>Select restaurant</h1>
          <div className="create-page">
            <div className="card" style={{ marginBottom: "0.75rem" }}>
              <div style={{ marginBottom: 0 }}>
                <label className="field-label" htmlFor="create-cuisine-filter">Cuisine</label>
                <select
                  id="create-cuisine-filter"
                  className="field-select"
                  value={cuisineFilter}
                  onChange={(e) => setCuisineFilter(e.target.value)}
                >
                  <option value="">All cuisines</option>
                  {(() => {
                    const cuisines = [...new Set(mapPlaces.map((p) => p.cuisine || "restaurant").filter(Boolean))];
                    cuisines.sort((a, b) => cuisineLabel(a).localeCompare(cuisineLabel(b), "sv"));
                    return cuisines.map((c) => (
                      <option key={c} value={c}>
                        {cuisineLabel(c)}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <CreateMapPicker
                selectedRestaurant={selectedRestaurant}
                onSelect={setSelectedRestaurant}
                onPlacesChange={setMapPlaces}
                cuisineFilter={cuisineFilter || undefined}
              />
            </div>
          </div>
        </>
      )}

      {selectedRestaurant && (
        <div className="create-page">
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div style={{ marginBottom: "1rem" }}>
              <label className="field-label" htmlFor="lunch-day">Day</label>
              <select
                id="lunch-day"
                className="field-select"
                value={lunchDateYmd}
                onChange={(e) => setLunchDateYmd(e.target.value)}
                disabled={windowDates.length === 0}
              >
                {windowDates.length === 0 && <option value="">Loading dates…</option>}
                {windowDates.map((d) => (
                  <option
                    key={d.ymd}
                    value={d.ymd}
                    disabled={committedYmds.includes(d.ymd)}
                  >
                    {d.label}
                    {committedYmds.includes(d.ymd) ? " (already booked)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="field-label field-label--above-helper">Time</label>
              <div className="field-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="field-helper">Starts</label>
                  <TimeQuarterSelect
                    value={timeStart}
                    onChange={setTimeStart}
                    required
                    selectClassName="field-select"
                    groupAriaLabel="Start time"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="field-helper">Ends (optional)</label>
                  <TimeQuarterSelect
                    value={timeEnd}
                    onChange={setTimeEnd}
                    allowEmpty
                    emptyLabel="None"
                    selectClassName="field-select"
                    groupAriaLabel="End time"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="field-label" htmlFor="topic">Conversation topic</label>
              <input
                id="topic"
                className="field-input"
                type="text"
                placeholder="e.g. AI and the future of work, Premier League…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="participant-size-block">
              <p id="max-participants-label" className="field-label field-label--above-helper">
                How many in total?
              </p>
              <p className="field-helper participant-size-lead">You're included in this number.</p>
              <div
                className="participant-segments"
                role="radiogroup"
                aria-labelledby="max-participants-label"
              >
                {PARTICIPANT_CHOICES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={maxParticipants === n}
                    className={`participant-segment${maxParticipants === n ? " participant-segment--active" : ""}`}
                    onClick={() => setMaxParticipants(n)}
                  >
                    {n}
                </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "0" }}>
              <label className="field-label field-label--above-helper">Meeting point</label>
              <p className="field-helper">Click the map or drag the pin to where you'll meet.</p>
              <div className="create-page__map-wrap">
                <MeetingPointPicker
                  center={mapCenter ?? { lat: LINDHOLMEN_LAT, lng: LINDHOLMEN_LNG }}
                  value={meetingPoint}
                  onChange={setMeetingPoint}
                />
              </div>
              <input
                className="field-input"
                type="text"
                placeholder='e.g. "Red bench outside the entrance"'
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                maxLength={120}
                style={{ marginTop: "0.5rem" }}
              />
            </div>
          </div>

          <div className="narrow-cta-wrap">
            {isDateBlocked && (
              <p style={{ color: "#b45309", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                You already have a bite this day.
              </p>
            )}
            {error && (
              <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                {error}
              </p>
            )}
            <button
              className="primary-button narrow-cta-wrap__submit"
              type="submit"
              disabled={!isValid || submitting}
            >
              {submitting ? "Publishing…" : "Join me for a Bite!"}
            </button>
          </div>
        </form>
        </div>
      )}
    </div>
  );
}

const LINDHOLMEN_LAT = 57.7065;
const LINDHOLMEN_LNG = 11.9384;
