"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { LunchDatePublic } from "@/lib/models";
import { getStoredAlias } from "@/lib/userAlias";
import { forgetCreatedDate, isCreatorOfDateInStorage } from "@/lib/creatorStorage";
import { lunchDateLabelSv } from "@/lib/lunchDateWindow";

const MeetingPointPicker = dynamic(
  () => import("@/components/MeetingPointPicker"),
  { ssr: false, loading: () => <div style={{ height: "200px", borderRadius: "0.75rem", background: "#e2e8f0" }} /> }
);

const CUISINE_LABELS: Record<string, string> = {
  indian: "Indiskt",
  thai: "Thaimat",
  swedish: "Svensk husmanskost",
  japanese: "Japanskt / Sushi",
  pizza: "Pizza",
  burgers: "Burgare",
  asian: "Asiatiskt",
};

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

  // Fallback: check if userToken matches any participant (shouldn't happen normally,
  // but handles page refresh after join without localStorage being set)
  const found = date.participants.some((p) => {
    // participants don't expose userToken, so we rely on localStorage
    return false;
  });
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

  // Join form state
  const [joinAlias, setJoinAlias] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [alreadyHasLunch, setAlreadyHasLunch] = useState(false);

  // Action state
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
        if (err.error === "already_joined") setJoinError("Du har redan joinat denna dejt.");
        else if (err.error === "busy_that_day")
          setJoinError("Du har redan en lunchdejt den här dagen.");
        else if (err.error === "full") setJoinError("Dejten är tyvärr fullbokad.");
        else if (err.error === "not_open") setJoinError("Dejten är inte längre öppen.");
        else setJoinError("Kunde inte joina. Försök igen.");
        setJoining(false);
        return;
      }

      if (!res.ok) throw new Error();

      // Remember we joined this date
      localStorage.setItem(`joined:${id}`, userToken);
      setRole("participant");
      await load();
    } catch {
      setJoinError("Något gick fel. Försök igen.");
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
    if (!confirm("Vill du avboka dejten? Den försvinner från listan.")) return;
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
        <Link href="/browse" className="back-link">← Tillbaka</Link>
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>Laddar…</p>
      </div>
    );
  }

  if (notFound || !date) {
    return (
      <div>
        <Link href="/browse" className="back-link">← Tillbaka</Link>
        <p className="page-subtitle">Dejten hittades inte – den kan ha avbokats.</p>
        <Link href="/browse" className="primary-button">
          Se alla lunchdejtar
        </Link>
      </div>
    );
  }

  const isCancelled = date.status === "cancelled";
  const isFull = date.status === "full";

  return (
    <div>
      <Link href="/browse" className="back-link">← Alla lunchdejtar</Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0, flex: 1, marginRight: "1rem" }}>
          {date.topic}
        </h1>
        <span className={`badge badge-${date.status}`} style={{ flexShrink: 0, marginTop: "0.2rem" }}>
          {date.status === "open" ? "Öppen" : date.status === "full" ? "Full" : "Avbokad"}
        </span>
      </div>

      {/* Details card */}
      <div className="card">
        <div className="detail-row">
          <span className="detail-label">Dag</span>
          <span>{lunchDateLabelSv(date.date)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Tid</span>
          <span>
            {date.timeStart}
            {date.timeEnd ? `–${date.timeEnd}` : ""}
          </span>
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
          <span className="detail-label">Skapare</span>
          <span>{date.creatorAlias}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Ämne</span>
          <span className="topic-tag">{date.topic}</span>
        </div>
        {!isCancelled && (
          <div className="detail-row">
            <span className="detail-label">Platser</span>
            <span>
              {isFull
                ? "Fullbokad"
                : `${date.spotsLeft} plats${date.spotsLeft !== 1 ? "er" : ""} kvar`}
            </span>
          </div>
        )}
      </div>

      {/* Meeting point card – only shown to creator and participants */}
      {(role === "creator" || role === "participant") &&
        date.meetingPoint?.latitude != null &&
        date.meetingPoint?.longitude != null && (
        <div className="card">
          <p className="field-label" style={{ marginBottom: "0.5rem" }}>Mötesplats</p>
          <MeetingPointPicker
            center={{ lat: date.meetingPoint.latitude, lng: date.meetingPoint.longitude }}
            value={{ lat: date.meetingPoint.latitude, lng: date.meetingPoint.longitude }}
            onChange={() => {}}
            readonly
            description={date.meetingPoint.description}
          />
        </div>
      )}

      {/* Participants card */}
      <div className="card">
        <p className="field-label" style={{ marginBottom: "0.25rem" }}>
          Deltagare ({date.participants.length + 1} / {date.maxParticipants})
        </p>
        <ul className="participant-list my-lunch-participant-list">
          <li className="participant-list-row participant-list-row--creator">
            <strong>{date.creatorAlias}</strong>
            <span className="participant-role-pill">Skapare</span>
          </li>
          {date.participants.map((p) => (
            <li key={p.id} className="participant-list-row">
              {p.alias}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      {!isCancelled && (
        <>
          {role === "creator" && (
            <div>
              <p className="secondary-text" style={{ marginBottom: "0.5rem" }}>
                Det här är din dejt. Du kan avboka den nedan.
              </p>
              <button
                className="danger-button"
                type="button"
                onClick={handleCancel}
                disabled={acting}
              >
                {acting ? "Avbokar…" : "Avboka dejten"}
              </button>
            </div>
          )}

          {role === "participant" && (
            <div>
              <div className="card" style={{ background: "#f0fdfa", border: "1px solid #ccfbf1" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#0f766e", fontWeight: 500 }}>
                  Du är med i den här dejten.
                </p>
              </div>
              <button
                className="danger-button"
                type="button"
                onClick={handleLeave}
                disabled={acting}
              >
                {acting ? "Avbokar…" : "Avboka lunchen"}
              </button>
            </div>
          )}

          {role === "visitor" && !isFull && alreadyHasLunch && (
            <div className="card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400e", fontWeight: 500 }}>
                Du har redan en lunchdejt bokad den här dagen.
              </p>
              <p className="secondary-text" style={{ marginTop: "0.4rem", marginBottom: "0.75rem" }}>
                Du kan bara ha en lunch per dag. Lämna eller avboka den andra dejten om du vill gå med i denna.
              </p>
              <Link href="/my-lunch" className="secondary-button">
                Se min befintliga dejt
              </Link>
            </div>
          )}

          {role === "visitor" && !isFull && !alreadyHasLunch && (
            <div>
              <p className="field-label" style={{ marginBottom: "0.75rem" }}>
                Joina den här dejten
              </p>
              <form onSubmit={handleJoin}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="field-label" htmlFor="join-alias">
                    Ditt namn / alias
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
                    Byt under{" "}
                    <Link href="/settings" style={{ color: "#0f766e", fontWeight: 500 }}>
                      inställningar
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
                  {joining ? "Joinar…" : "Joina lunchdejten"}
                </button>
              </form>
            </div>
          )}

          {role === "visitor" && isFull && (
            <div className="empty-state" style={{ padding: "1.5rem 0" }}>
              <p>Den här dejten är tyvärr fullbokad.</p>
              <Link
                href="/browse"
                className="secondary-button"
                style={{ maxWidth: "240px", marginInline: "auto" }}
              >
                Se andra lunchdejtar
              </Link>
            </div>
          )}
        </>
      )}

      {isCancelled && (
        <div className="empty-state" style={{ padding: "1.5rem 0" }}>
          <p>Den här dejten har avbokats.</p>
          <Link
            href="/browse"
            className="secondary-button"
            style={{ maxWidth: "240px", marginInline: "auto" }}
          >
            Se andra lunchdejtar
          </Link>
        </div>
      )}
    </div>
  );
}
