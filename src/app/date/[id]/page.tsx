"use client";

import { useState, useEffect, useCallback } from "react";
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

function deriveRole(dateId: string, userToken: string, date: LunchDatePublic): Role {
  if (isCreatorOfDateInStorage(dateId, userToken)) return "creator";

  const joinedTokenKey = `joined:${dateId}`;
  if (localStorage.getItem(joinedTokenKey) === userToken) return "participant";

  const found = date.participants.some(() => false);
  void found;

  return "visitor";
}

export default function DateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [date, setDate] = useState<LunchDatePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [role, setRole] = useState<Role>("visitor");
  const [userToken, setUserToken] = useState("");

  const [joinAlias, setJoinAlias] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [alreadyHasLunch, setAlreadyHasLunch] = useState(false);

  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/dates/${id}`);
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data: LunchDatePublic = await res.json();
    setDate(data);

    const token = getUserToken();
    setUserToken(token);
    setRole(deriveRole(id, token, data));

    let busySameDay = false;
    try {
      const cRes = await fetch(
        `/api/user/commitments?userToken=${encodeURIComponent(token)}`
      );
      if (cRes.ok) {
        const { committedYmds } = (await cRes.json()) as { committedYmds: string[] };
        busySameDay =
          committedYmds.includes(data.date) &&
          deriveRole(id, token, data) === "visitor";
      }
    } catch {
      busySameDay = false;
    }
    setAlreadyHasLunch(busySameDay);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const stored = getStoredAlias();
    if (stored) setJoinAlias(stored);
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinAlias.trim() || joining) return;

    setJoining(true);
    setJoinError("");

    try {
      const res = await fetch(`/api/dates/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: joinAlias.trim(), userToken }),
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

      localStorage.setItem(`joined:${id}`, userToken);
      setRole("participant");
      await load();
    } catch {
      setJoinError("Something went wrong. Try again.");
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (acting) return;
    setActing(true);

    await fetch(`/api/dates/${id}/join`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userToken }),
    });

    localStorage.removeItem(`joined:${id}`);
    router.push("/browse");
  }

  async function handleCancel() {
    if (acting) return;
    if (!confirm("Cancel this date? It will be removed from the list.")) return;
    setActing(true);

    await fetch(`/api/dates/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorToken: userToken }),
    });

    forgetCreatedDate(id);
    router.push("/browse");
  }

  if (loading) {
    return (
      <div>
        <Link href="/browse" className="back-link">← Back</Link>
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>Loading…</p>
      </div>
    );
  }

  if (notFound || !date) {
    return (
      <div>
        <Link href="/browse" className="back-link">← Back</Link>
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
      <Link href="/browse" className="back-link">← All lunch dates</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0, flex: 1, marginRight: "1rem" }}>
          {date.topic}
        </h1>
        <span className={`badge badge-${date.status}`} style={{ flexShrink: 0, marginTop: "0.2rem" }}>
          {date.status === "open" ? "Open" : date.status === "full" ? "Full" : "Cancelled"}
        </span>
      </div>

      <div className="card">
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
        <div className="detail-row">
          <span className="detail-label">Host</span>
          <span>{date.creatorAlias}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Topic</span>
          <span className="topic-tag">{date.topic}</span>
        </div>
        {!isCancelled && (
          <div className="detail-row">
            <span className="detail-label">Spots</span>
            <span>
              {isFull
                ? "Fully booked"
                : `${date.spotsLeft} spot${date.spotsLeft !== 1 ? "s" : ""} left`}
            </span>
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

      <div className="card">
        <p className="field-label" style={{ marginBottom: "0.25rem" }}>
          Participants ({date.participants.length + 1} / {date.maxParticipants})
        </p>
        <ul className="participant-list my-lunch-participant-list">
          <li className="participant-list-row participant-list-row--creator">
            <strong>{date.creatorAlias}</strong>
            <span className="participant-role-pill">Host</span>
          </li>
          {date.participants.map((p) => (
            <li key={p.id} className="participant-list-row">
              {p.alias}
            </li>
          ))}
        </ul>
      </div>

      {!isCancelled && (
        <>
          {role === "creator" && (
            <div>
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
            <div>
              <div className="card" style={{ background: "#f0fdfa", border: "1px solid #ccfbf1" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#0f766e", fontWeight: 500 }}>
                  You’re on this date.
                </p>
              </div>
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

          {role === "visitor" && !isFull && !alreadyHasLunch && (
            <div>
              <p className="field-label" style={{ marginBottom: "0.75rem" }}>
                Join this date
              </p>
              <form onSubmit={handleJoin}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="field-label" htmlFor="join-alias">
                    Your name / display name
                  </label>
                  <input
                    id="join-alias"
                    className="field-input"
                    type="text"
                    readOnly
                    aria-readonly="true"
                    value={joinAlias}
                    style={{ background: "#f1f5f9", cursor: "default" }}
                  />
                  <p className="secondary-text" style={{ marginTop: "0.35rem" }}>
                    Change in{" "}
                    <Link href="/settings" style={{ color: "#0f766e", fontWeight: 500 }}>
                      settings
                    </Link>
                    .
                  </p>
                </div>

                {joinError && (
                  <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                    {joinError}
                  </p>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={!joinAlias.trim() || joining}
                >
                  {joining ? "Joining…" : "Join lunch date"}
                </button>
              </form>
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
