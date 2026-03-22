"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getStoredAlias } from "@/lib/userAlias";
import dynamic from "next/dynamic";
import TimeQuarterSelect from "@/components/TimeQuarterSelect";
import { restaurants } from "@/lib/restaurants";
import type { LatLng } from "@/components/MeetingPointPicker";
import { rememberCreatedDate } from "@/lib/creatorStorage";

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

type WindowDate = { ymd: string; label: string };

const PARTICIPANT_MIN = 2;
const PARTICIPANT_MAX = 8;
const PARTICIPANT_CHOICES = Array.from(
  { length: PARTICIPANT_MAX - PARTICIPANT_MIN + 1 },
  (_, i) => PARTICIPANT_MIN + i
);

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qpRestaurantId = searchParams.get("restaurantId");
  const qpDate = searchParams.get("date");

  const [alias, setAlias] = useState("");
  const [windowDates, setWindowDates] = useState<WindowDate[]>([]);
  const [committedYmds, setCommittedYmds] = useState<string[]>([]);
  const [lunchDateYmd, setLunchDateYmd] = useState("");
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
      const userToken = getUserToken();
      try {
        const res = await fetch(
          `/api/user/commitments?userToken=${encodeURIComponent(userToken)}`
        );
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
    if (qpRestaurantId && restaurants.some((r) => r.id === qpRestaurantId)) {
      setRestaurantId(qpRestaurantId);
    }
  }, [qpRestaurantId]);

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

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId) ?? restaurants[0];
  const mapCenter: LatLng = { lat: selectedRestaurant.latitude, lng: selectedRestaurant.longitude };

  const isDateBlocked = lunchDateYmd.length > 0 && committedYmds.includes(lunchDateYmd);
  const isValid =
    alias.trim().length > 0 &&
    topic.trim().length > 0 &&
    timeStart.length > 0 &&
    lunchDateYmd.length > 0 &&
    !isDateBlocked;

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
          date: lunchDateYmd,
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

      if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "busy_that_day") {
          setError(
            "You already have a lunch date that day. Pick another day or leave/cancel the other one first."
          );
        } else {
          setError("Couldn’t create the lunch date right now.");
        }
        setSubmitting(false);
        return;
      }

      if (!res.ok) throw new Error("Could not create lunch date");

      const date = await res.json();

      rememberCreatedDate(date.id, userToken);

      router.push(`/date/${date.id}`);
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/" className="back-link">
        ← Back
      </Link>

      <h1 className="page-title">Create new lunch invitation</h1>
      <p className="page-subtitle">
        Pick a day (today and up to five days ahead). Your date is visible to everyone
        on Lindholmen right away.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label" htmlFor="alias">
              Your name / display name
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
              Change it in{" "}
              <Link href="/settings" style={{ color: "#0f766e", fontWeight: 500 }}>
                settings
              </Link>
              .
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label" htmlFor="lunch-day">
              Day
            </label>
            <select
              id="lunch-day"
              className="field-select"
              value={lunchDateYmd}
              onChange={(e) => setLunchDateYmd(e.target.value)}
              disabled={windowDates.length === 0}
            >
              {windowDates.length === 0 && (
                <option value="">Loading dates…</option>
              )}
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
            {isDateBlocked && (
              <p className="secondary-text" style={{ marginTop: "0.35rem", color: "#b45309" }}>
                You already have a date that day. Pick another day or go to{" "}
                <Link href="/my-lunch" style={{ color: "#0f766e", fontWeight: 500 }}>
                  My Bites
                </Link>
                .
              </p>
            )}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label">Time (quarters: :00, :15, :30, :45)</label>
            <div className="field-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Starts
                </label>
                <TimeQuarterSelect
                  value={timeStart}
                  onChange={setTimeStart}
                  required
                  selectClassName="field-select"
                  groupAriaLabel="Start time"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Ends (optional)
                </label>
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
            <label className="field-label" htmlFor="restaurant">
              Restaurant
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
              Meeting point
            </label>
            <p className="secondary-text" style={{ marginBottom: "0.5rem" }}>
              Click the map or drag the pin to where you’ll meet.
            </p>
            <MeetingPointPicker
              center={mapCenter}
              value={meetingPoint}
              onChange={setMeetingPoint}
            />
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

          <div style={{ marginBottom: "1rem" }}>
            <label className="field-label" htmlFor="topic">
              Conversation topic
            </label>
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
            <p id="max-participants-label" className="field-label" style={{ marginBottom: 0 }}>
              How many in total?
            </p>
            <p className="secondary-text participant-size-lead">You’re included in this number.</p>
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
            <p className="secondary-text participant-size-foot">
              {maxParticipants === 2
                ? "1 other person can join."
                : `${maxParticipants - 1} others can join.`}
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
          {submitting ? "Publishing…" : "Publish lunch date"}
        </button>
      </form>
    </div>
  );
}
