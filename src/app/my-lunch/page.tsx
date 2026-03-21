"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { LunchDatePublic } from "@/lib/models";
import { syncLocalBookingStateWithServer } from "@/lib/bookingState";
import { forgetCreatedDate, isCreatorOfDateInStorage, listCreatorDateIdsFromStorage } from "@/lib/creatorStorage";
import {
  lunchDateLabelSv,
  lunchDateShortTabLabelSv,
  selectableLunchDateYmds,
  stockholmTodayYmd,
} from "@/lib/lunchDateWindow";

const MeetingPointPicker = dynamic(
  () => import("@/components/MeetingPointPicker"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "200px", borderRadius: "0.75rem", background: "#e2e8f0" }} />
    ),
  }
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

type WindowDate = { ymd: string; label: string };

function getUserToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("userToken");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("userToken", token);
  }
  return token;
}

function MyLunchDayPanel({
  date,
  ariaLabelledBy,
  onBookingChanged,
}: {
  date: LunchDatePublic;
  ariaLabelledBy?: string;
  onBookingChanged?: () => void;
}) {
  const [userToken, setUserToken] = useState("");
  const [acting, setActing] = useState(false);
  const [actionErr, setActionErr] = useState("");

  useEffect(() => {
    setUserToken(getUserToken());
  }, []);

  useEffect(() => {
    setActionErr("");
  }, [date.id]);

  const hasMeetingPoint =
    date.meetingPoint?.latitude != null && date.meetingPoint?.longitude != null;

  const bookedCount = date.participants.length + 1;
  const maxP = date.maxParticipants;

  function statusDetail(): string {
    if (date.status === "cancelled") return "Avbokad";
    if (bookedCount === 1) {
      return `${bookedCount}/${maxP} plats är bokad.`;
    }
    return `${bookedCount}/${maxP} platser är bokade.`;
  }

  const isCancelled = date.status === "cancelled";
  const isCreator = Boolean(
    userToken && isCreatorOfDateInStorage(date.id, userToken)
  );
  const isParticipant = Boolean(
    userToken &&
      typeof window !== "undefined" &&
      localStorage.getItem(`joined:${date.id}`) === userToken
  );
  const showBookingAction = !isCancelled && (isCreator || isParticipant);

  async function handleCancelDejt() {
    if (acting || !userToken) return;
    if (!confirm("Vill du avboka dejten? Den försvinner från listan.")) return;
    setActing(true);
    setActionErr("");
    try {
      const res = await fetch(`/api/dates/${date.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorToken: userToken }),
      });
      if (!res.ok) throw new Error();
      forgetCreatedDate(date.id);
      onBookingChanged?.();
    } catch {
      setActionErr("Kunde inte avboka. Försök igen.");
    } finally {
      setActing(false);
    }
  }

  async function handleLeaveDejt() {
    if (acting || !userToken) return;
    if (!confirm("Vill du avboka lunchen?")) return;
    setActing(true);
    setActionErr("");
    try {
      const res = await fetch(`/api/dates/${date.id}/join`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken }),
      });
      if (!res.ok) throw new Error();
      localStorage.removeItem(`joined:${date.id}`);
      onBookingChanged?.();
    } catch {
      setActionErr("Kunde inte avboka lunchen. Försök igen.");
    } finally {
      setActing(false);
    }
  }

  const meetingHeaderRow = (
    <div className="my-lunch-meeting-header">
      <p className="field-label">Mötesplats</p>
      {showBookingAction && (
        <button
          type="button"
          className="danger-button"
          disabled={acting}
          onClick={isCreator ? handleCancelDejt : handleLeaveDejt}
        >
          {acting
            ? "Vänta…"
            : isCreator
              ? "Avboka dejten"
              : "Avboka lunchen"}
        </button>
      )}
    </div>
  );

  return (
    <div
      role="tabpanel"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : `Dejt ${lunchDateLabelSv(date.date)}`}
    >
      <div className="card my-lunch-main-card">
        <div className="my-lunch-details-section">
          <div className="detail-row">
            <span className="detail-label">Ställe</span>
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
            <span className="detail-label">Ämne</span>
            <span className="topic-tag">{date.topic}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span>{statusDetail()}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Skapare</span>
            <span>{date.creatorAlias}</span>
          </div>
        </div>
      </div>

      {hasMeetingPoint && (
        <div className="card">
          {meetingHeaderRow}
          {actionErr && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.5rem" }}>{actionErr}</p>
          )}
          <MeetingPointPicker
            center={{
              lat: date.meetingPoint!.latitude,
              lng: date.meetingPoint!.longitude,
            }}
            value={{
              lat: date.meetingPoint!.latitude,
              lng: date.meetingPoint!.longitude,
            }}
            onChange={() => {}}
            readonly
            description={date.meetingPoint?.description}
          />
        </div>
      )}

      {!hasMeetingPoint && (
        <div className="card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          {meetingHeaderRow}
          {actionErr && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.5rem" }}>{actionErr}</p>
          )}
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#92400e" }}>
            Ingen mötesplats är angiven för den här dejten.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MyLunchPage() {
  const [windowDates, setWindowDates] = useState<WindowDate[]>([]);
  const [dates, setDates] = useState<LunchDatePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);

  const todayYmd = stockholmTodayYmd();

  const load = useCallback(async () => {
    setLoading(true);

    const windowRes = await fetch("/api/lunch-window");
    let windowList: WindowDate[] = [];
    if (windowRes.ok) {
      const data = (await windowRes.json()) as { dates: WindowDate[] };
      windowList = data.dates ?? [];
    }
    if (windowList.length === 0) {
      windowList = selectableLunchDateYmds().map((ymd) => ({
        ymd,
        label: lunchDateLabelSv(ymd),
      }));
    }
    setWindowDates(windowList);

    await syncLocalBookingStateWithServer();

    const ids: string[] = [];
    for (const id of listCreatorDateIdsFromStorage()) {
      if (!ids.includes(id)) ids.push(id);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("joined:")) {
        const id = key.replace("joined:", "");
        if (!ids.includes(id)) ids.push(id);
      }
    }

    if (ids.length === 0) {
      setDates([]);
      setSelectedYmd(null);
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

    const valid = results.filter(Boolean).filter((d: LunchDatePublic) => d.status !== "cancelled");
    setDates(valid);

    const byYmd: Record<string, LunchDatePublic> = {};
    for (const d of valid) {
      if (!byYmd[d.date]) byYmd[d.date] = d;
    }
    const firstBooked = windowList.find((w) => byYmd[w.ymd]);
    setSelectedYmd(firstBooked ? firstBooked.ymd : null);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const bookedByYmd = useMemo(() => {
    const m: Record<string, LunchDatePublic> = {};
    for (const d of dates) {
      if (!m[d.date]) m[d.date] = d;
    }
    return m;
  }, [dates]);

  useEffect(() => {
    if (loading) return;
    setSelectedYmd((prev) => {
      if (prev && bookedByYmd[prev]) return prev;
      const first = windowDates.find((w) => bookedByYmd[w.ymd]);
      return first?.ymd ?? null;
    });
  }, [loading, windowDates, bookedByYmd]);

  const activeDate = selectedYmd ? bookedByYmd[selectedYmd] : null;
  const hasAnyBooking = dates.length > 0;

  if (loading) {
    return (
      <div>
        <Link href="/" className="back-link">
          ← Tillbaka
        </Link>
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
          Laddar…
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="back-link">
        ← Tillbaka
      </Link>

      <div
        className="my-lunch-tablist"
        role="tablist"
        aria-label="Lunch per dag"
      >
        {windowDates.map((w) => {
          const hasBooking = Boolean(bookedByYmd[w.ymd]);
          const isActive = hasBooking && selectedYmd === w.ymd;
          return (
            <button
              key={w.ymd}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={!hasBooking}
              id={`my-lunch-tab-${w.ymd}`}
              className={`my-lunch-tab${isActive ? " my-lunch-tab--active" : ""}`}
              onClick={() => {
                if (hasBooking) setSelectedYmd(w.ymd);
              }}
            >
              <span style={{ display: "block" }}>{lunchDateShortTabLabelSv(w.ymd)}</span>
              {w.ymd === todayYmd && (
                <span className="my-lunch-tab-today">Idag</span>
              )}
            </button>
          );
        })}
      </div>

      {!hasAnyBooking && (
        <div className="empty-state" style={{ paddingTop: "0.5rem" }}>
          <p>Du har ingen planerad lunchdejt i fönstret (idag + fem dagar).</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            <Link
              href="/create"
              className="primary-button"
              style={{ maxWidth: "260px", marginInline: "auto" }}
            >
              Lägg upp en dejt
            </Link>
            <Link
              href="/browse"
              className="secondary-button"
              style={{ maxWidth: "260px", marginInline: "auto" }}
            >
              Hitta en dejt att joina
            </Link>
          </div>
        </div>
      )}

      {hasAnyBooking && activeDate && (
        <MyLunchDayPanel
          date={activeDate}
          ariaLabelledBy={`my-lunch-tab-${selectedYmd}`}
          onBookingChanged={load}
        />
      )}

      {hasAnyBooking && !activeDate && (
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "1rem" }}>
          Välj en dag med dejt i tabbarna ovan.
        </p>
      )}
    </div>
  );
}
