"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { LunchDatePublic } from "@/lib/models";
import { getStoredAlias } from "@/lib/userAlias";
import { forgetCreatedDate, isCreatorOfDateInStorage } from "@/lib/creatorStorage";
import { lunchDateLabel } from "@/lib/lunchDateWindow";
import { cuisineLabel } from "@/lib/cuisineLabels";

const MeetingPointPicker = dynamic(
  () => import("@/components/MeetingPointPicker"),
  { ssr: false, loading: () => <div style={{ height: "200px", borderRadius: "0.75rem", background: "#e2e8f0" }} /> }
);

function getUserToken(): string {
  let token = localStorage.getItem("userToken");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("userToken", token);
  }
  return token;
}

type Role = "creator" | "participant" | "visitor";

function deriveRole(dateId: string, userToken: string): Role {
  if (isCreatorOfDateInStorage(dateId, userToken)) return "creator";

  const joinedTokenKey = `joined:${dateId}`;
  if (localStorage.getItem(joinedTokenKey) === userToken) return "participant";

  return "visitor";
}

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
  const [userToken, setUserToken] = useState("");

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
    const data: LunchDatePublic = await res.json();
    setDate(data);

    const token = getUserToken();
    setUserToken(token);
    setRole(deriveRole(dateId, token));

    let busySameDay = false;
    try {
      const cRes = await fetch(
        `/api/user/commitments?userToken=${encodeURIComponent(token)}`
      );
      if (cRes.ok) {
        const { committedYmds } = (await cRes.json()) as { committedYmds: string[] };
        busySameDay =
          committedYmds.includes(data.date) &&
          deriveRole(dateId, token) === "visitor";
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
    const alias = getStoredAlias()?.trim() ?? "";
    if (!alias || joining) return;

    setJoining(true);
    setJoinError("");

    try {
      const res = await fetch(`/api/dates/${dateId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, userToken }),
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

      localStorage.setItem(`joined:${dateId}`, userToken);
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
      body: JSON.stringify({ userToken }),
    });

    localStorage.removeItem(`joined:${dateId}`);
    router.push("/browse");
  }

  async function handleCancel() {
    if (acting) return;
    if (!confirm("Cancel this date? It will be removed from the list.")) return;
    setActing(true);

    await fetch(`/api/dates/${dateId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorToken: userToken }),
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
    <div>
      <h1 className="page-title" style={{ marginBottom: "1.25rem" }}>
        {date.topic}
      </h1>

      <div
        className={`card date-detail-main-card date-detail-main-card--${date.status}`}
      >
        <div className="detail-row">
          <span className="detail-label">Day</span>
          <span>{lunchDateLabel(date.date)}</span>
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
            <span className="secondary-text detail-row__participant-spots">
              {isCancelled
                ? "—"
                : date.spotsLeft > 0
                  ? `${date.spotsLeft} empty spot${date.spotsLeft !== 1 ? "s" : ""} left`
                  : "No spots left."}
            </span>
          </span>
        </div>

        {!isCancelled && role === "visitor" && !isFull && !alreadyHasLunch && (
          <div className="date-detail-main-card__join-block">
            {joinError && (
              <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                {joinError}
              </p>
            )}
            <button
              type="button"
              className="primary-button"
              style={{ width: "100%", maxWidth: "100%" }}
              onClick={() => void handleJoin()}
              disabled={!getStoredAlias()?.trim() || joining}
            >
              {joining ? "Joining…" : "Join lunch date"}
            </button>
          </div>
        )}
      </div>

      {(role === "creator" || role === "participant") &&
        date.meetingPoint?.latitude != null &&
        date.meetingPoint?.longitude != null && (
        <div className="card">
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

      {!isCancelled && (
        <>
          {role === "creator" && (
            <div className="date-detail-actions">
              <p className="secondary-text" style={{ marginBottom: "0.5rem" }}>
                This is your date. You can cancel it below.
              </p>
              <button
                className="danger-button"
                type="button"
                onClick={handleCancel}
                disabled={acting}
              >
                {acting ? "Cancelling…" : "Cancel date"}
              </button>
            </div>
          )}

          {role === "participant" && (
            <div className="date-detail-actions">
              <button
                className="danger-button"
                type="button"
                onClick={handleLeave}
                disabled={acting}
              >
                {acting ? "Cancelling…" : "Cancel lunch"}
              </button>
            </div>
          )}

          {role === "visitor" && !isFull && alreadyHasLunch && (
            <div className="card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400e", fontWeight: 500 }}>
                You already have a lunch date booked that day.
              </p>
              <p className="secondary-text" style={{ marginTop: "0.4rem", marginBottom: "0.75rem" }}>
                You can only have one lunch per day. Leave or cancel your other date to join this one.
              </p>
              <Link href="/my-lunch" className="secondary-button">
                See my existing date
              </Link>
            </div>
          )}

          {role === "visitor" && isFull && (
            <div className="empty-state" style={{ padding: "1.5rem 0" }}>
              <p>This date is fully booked.</p>
              <Link
                href="/browse"
                className="secondary-button"
                style={{ maxWidth: "240px", marginInline: "auto" }}
              >
                Browse other dates
              </Link>
            </div>
          )}
        </>
      )}

      {isCancelled && (
        <div className="empty-state" style={{ padding: "1.5rem 0" }}>
          <p>This date has been cancelled.</p>
          <Link
            href="/browse"
            className="secondary-button"
            style={{ maxWidth: "240px", marginInline: "auto" }}
          >
            Browse other dates
          </Link>
        </div>
      )}
    </div>
  );
}
