"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { LunchDatePublic } from "@/lib/models";
import { useAuth } from "@/components/AuthProvider";
import { forgetCreatedDate } from "@/lib/creatorStorage";
import { lunchDateLabel } from "@/lib/lunchDateWindow";
import { cuisineLabel } from "@/lib/cuisineLabels";

const MeetingPointPicker = dynamic(
  () => import("@/components/MeetingPointPicker"),
  { ssr: false, loading: () => <div style={{ height: "200px", borderRadius: "0.75rem", background: "#e2e8f0" }} /> }
);

type Role = "creator" | "participant" | "visitor";

export default function DateDetailClient() {
  const params = useParams();
  const dateId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string" && raw.length > 0) return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);
  const router = useRouter();

  const [date, setDate] = useState<LunchDatePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [role, setRole] = useState<Role>("visitor");

  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [alreadyHasLunch, setAlreadyHasLunch] = useState(false);

  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!dateId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/dates/${dateId}`);
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json() as LunchDatePublic & { myRole?: "creator" | "participant" | null };
    setDate(data);
    setRole(data.myRole === "creator" ? "creator" : data.myRole === "participant" ? "participant" : "visitor");

    let busySameDay = false;
    try {
      const cRes = await fetch("/api/user/commitments", { credentials: "include" });
      if (cRes.ok) {
        const { committedYmds } = (await cRes.json()) as { committedYmds: string[] };
        busySameDay =
          committedYmds.includes(data.date) &&
          data.myRole !== "creator" &&
          data.myRole !== "participant";
      }
    } catch {
      busySameDay = false;
    }
    setAlreadyHasLunch(busySameDay);
    setLoading(false);
  }, [dateId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin() {
    if (joining) return;

    setJoining(true);
    setJoinError("");

    try {
      const res = await fetch(`/api/dates/${dateId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (res.status === 409) {
        const err = await res.json();
        if (err.error === "already_joined") setJoinError("You’ve already joined this date.");
        else if (err.error === "busy_that_day")
          setJoinError("You already have a lunch date that day.");
        else if (err.error === "full") setJoinError("This date is fully booked.");
        else if (err.error === "not_open") setJoinError("This date is no longer open.");
        else setJoinError("Couldn’t join. Try again.");
        setJoining(false);
        return;
      }

      if (!res.ok) throw new Error();

      setRole("participant");
      await load();
      setJoining(false);
    } catch {
      setJoinError("Something went wrong. Try again.");
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (acting) return;
    setActing(true);

    await fetch(`/api/dates/${dateId}/join`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    router.push("/browse");
  }

  async function handleCancel() {
    if (acting) return;
    if (!confirm("Cancel this date? It will be removed from the list.")) return;
    setActing(true);

    await fetch(`/api/dates/${dateId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });

    forgetCreatedDate(dateId);
    router.push("/browse");
  }

  if (loading) {
    return (
      <div>
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>Loading…</p>
      </div>
    );
  }

  if (notFound || !date) {
    return (
      <div>
        <p className="page-subtitle">This date wasn’t found — it may have been cancelled.</p>
        <Link href="/browse" className="primary-button">
          See all lunch dates
        </Link>
      </div>
    );
  }

  const isCancelled = date.status === "cancelled";
  const isFull = date.status === "full";

  return (
    <div className="date-detail-wrap date-detail-page">
      <h1 className="page-title" style={{ marginBottom: "1.25rem", color: "#064e3b" }}>
        {date.topic}
      </h1>

      <div className="date-detail-card-area">
        <div className={`browse-date-bg-card browse-date-bg-card--${date.status}`}>
          <div className="date-detail-main-card__inner">
          <div className="detail-row detail-row--with-status">
            <span className="detail-label">Day</span>
            <span>{lunchDateLabel(date.date)}</span>
            {!isCancelled && (
              <span
                className={`badge ${date.spotsLeft > 0 ? "badge-open" : "badge-full"}`}
                style={{ marginLeft: "auto" }}
              >
                {date.spotsLeft > 0 ? "Open" : "Full"}
              </span>
            )}
          </div>
          <div className="detail-row">
            <span className="detail-label">Time</span>
            <span>
              {date.timeStart}
              {date.timeEnd ? `–${date.timeEnd}` : ""}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Restaurant</span>
            <span>
              {date.restaurant.name}
              <span className="secondary-text" style={{ marginLeft: "0.4rem" }}>
                ({cuisineLabel(date.restaurant.cuisine)})
              </span>
            </span>
          </div>
          <div className="detail-row detail-row--participants">
            <span className="detail-label">Participants</span>
            <span className="detail-row__participants-body">
              <span className="detail-row__participant-names">
                <strong>{date.creatorAlias}</strong>
                <span className="secondary-text"> (host)</span>
                {date.participants.length > 0 && (
                  <>
                    {", "}
                    {date.participants.map((p) => p.alias).join(", ")}
                  </>
                )}
              </span>
            </span>
          </div>

          {(role === "creator" || role === "participant") &&
            date.meetingPoint?.latitude != null &&
            date.meetingPoint?.longitude != null && (
            <div className="date-detail-meeting-block">
              <p className="field-label" style={{ marginBottom: "0.5rem" }}>Meeting point</p>
              <MeetingPointPicker
                center={{ lat: date.meetingPoint.latitude, lng: date.meetingPoint.longitude }}
                value={{ lat: date.meetingPoint.latitude, lng: date.meetingPoint.longitude }}
                onChange={() => {}}
                readonly
                description={date.meetingPoint.description}
              />
            </div>
          )}
        </div>
        </div>
      </div>

      {!isCancelled && role === "visitor" && !isFull && !alreadyHasLunch && (
        <div className="date-detail-actions">
          {joinError && (
            <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              {joinError}
            </p>
          )}
          <div className="date-detail-actions__split">
            <button
              type="button"
              className="primary-button date-detail-actions__back"
              onClick={() => router.back()}
            >
              Go back
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleJoin()}
              disabled={!user?.alias?.trim() || joining}
            >
              {joining ? "Joining…" : "Join lunch date"}
            </button>
          </div>
        </div>
      )}

      {!isCancelled && (
        <>
          {role === "creator" && (
            <div className="date-detail-actions">
              <p className="secondary-text" style={{ marginBottom: "0.5rem" }}>
                This is your date. You can cancel it below.
              </p>
              <div className="date-detail-actions__split">
                <button
                  type="button"
                  className="primary-button date-detail-actions__back"
                  onClick={() => router.back()}
                >
                  Go back
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={handleCancel}
                  disabled={acting}
                >
                  {acting ? "Cancelling…" : "Cancel date"}
                </button>
              </div>
            </div>
          )}

          {role === "participant" && (
            <div className="date-detail-actions">
              <div className="date-detail-actions__split">
                <button
                  type="button"
                  className="primary-button date-detail-actions__back"
                  onClick={() => router.back()}
                >
                  Go back
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={handleLeave}
                  disabled={acting}
                >
                  {acting ? "Cancelling…" : "Cancel lunch"}
                </button>
              </div>
            </div>
          )}

          {role === "visitor" && !isFull && alreadyHasLunch && (
            <div className="date-detail-actions">
              <p style={{ color: "#b45309", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                You already have a bite this day.
              </p>
              <button
                type="button"
                className="primary-button"
                style={{ width: "100%" }}
                onClick={() => router.back()}
              >
                Go back
              </button>
            </div>
          )}

          {role === "visitor" && isFull && (
            <div className="date-detail-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => router.back()}
              >
                Go back
              </button>
            </div>
          )}
        </>
      )}

      {isCancelled && (
        <div className="date-detail-actions">
          <div className="empty-state" style={{ padding: "1.5rem 0" }}>
            <p>This date has been cancelled.</p>
          </div>
          <div className="date-detail-actions__split">
            <button
              type="button"
              className="primary-button date-detail-actions__back"
              onClick={() => router.back()}
            >
              Go back
            </button>
            <Link href="/browse" className="secondary-button">
              Browse other dates
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
