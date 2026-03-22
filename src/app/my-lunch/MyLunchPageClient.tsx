"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { LunchDatePublic } from "@/lib/models";
import { syncLocalBookingStateWithServer } from "@/lib/bookingState";
import { forgetCreatedDate, isCreatorOfDateInStorage, listCreatorDateIdsFromStorage, rememberCreatedDate } from "@/lib/creatorStorage";
import { lunchDateLabel, selectableLunchDateYmds } from "@/lib/lunchDateWindow";
import { getStoredAlias } from "@/lib/userAlias";
import { cuisineLabel } from "@/lib/cuisineLabels";
import DayPickerSubtabs from "@/components/DayPickerSubtabs";

const MeetingPointPicker = dynamic(
  () => import("@/components/MeetingPointPicker"),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "200px", borderRadius: "0.75rem", background: "#e2e8f0" }} />
    ),
  }
);

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
    if (date.status === "cancelled") return "Cancelled";
    if (bookedCount === 1) {
      return `${bookedCount}/${maxP} spot booked.`;
    }
    return `${bookedCount}/${maxP} spots booked.`;
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
    if (!confirm("Cancel this date? It will be removed from the list.")) return;
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
      setActionErr("Couldn't cancel. Try again.");
    } finally {
      setActing(false);
    }
  }

  async function handleLeaveDejt() {
    if (acting || !userToken) return;
    if (!confirm("Leave this lunch?")) return;
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
      setActionErr("Couldn't leave. Try again.");
    } finally {
      setActing(false);
    }
  }

  const cancelButton = showBookingAction && (
    <div className="date-detail-actions">
      <button
        type="button"
        className="danger-button"
        disabled={acting}
        onClick={isCreator ? handleCancelDejt : handleLeaveDejt}
      >
      {acting
        ? "Please wait…"
        : isCreator
          ? "Cancel date"
          : "Cancel lunch"}
      </button>
    </div>
  );

  return (
    <div
      role="tabpanel"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : `Date ${lunchDateLabel(date.date)}`}
    >
      <div className="card my-lunch-main-card">
        <div className="my-lunch-details-section">
          <div className="detail-row">
            <span className="detail-label">Place</span>
            <span>
              {date.restaurant.name}
              <span className="secondary-text" style={{ marginLeft: "0.4rem" }}>
                ({cuisineLabel(date.restaurant.cuisine)})
              </span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Time</span>
            <span>
              {date.timeStart}
              {date.timeEnd ? `–${date.timeEnd}` : ""}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Topic</span>
            <span className="topic-tag">{date.topic}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span>{statusDetail()}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Host</span>
            <span>{date.creatorAlias}</span>
          </div>
        </div>
      </div>

      {hasMeetingPoint && (
        <div className="card">
          <div className="my-lunch-meeting-header">
            <p className="field-label">Meeting point</p>
          </div>
          {actionErr && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.5rem" }}>{actionErr}</p>
          )}
          <MeetingPointPicker
            key={date.id}
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
          {cancelButton}
        </div>
      )}

      {!hasMeetingPoint && (
        <div className="card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div className="my-lunch-meeting-header">
            <p className="field-label">Meeting point</p>
          </div>
          {actionErr && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.5rem" }}>{actionErr}</p>
          )}
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#92400e" }}>
            No meeting point has been set for this date.
          </p>
          {cancelButton}
        </div>
      )}
    </div>
  );
}

type ServerDate = LunchDatePublic & { role?: string };

export default function MyLunchPageClient({
  initialDates,
}: {
  initialDates: ServerDate[];
}) {
  const [windowDates, setWindowDates] = useState<WindowDate[]>([]);
  const [dates, setDates] = useState<LunchDatePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);

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
        label: lunchDateLabel(ymd),
      }));
    }
    setWindowDates(windowList);

    await syncLocalBookingStateWithServer();

    const userToken = getUserToken();

    /* Primary: API knows creator/participant by userToken (works even if localStorage cleared) */
    let valid: LunchDatePublic[] = [];
    try {
      const userRes = await fetch(`/api/user/dates?userToken=${encodeURIComponent(userToken)}`);
      if (userRes.ok) {
        const data = (await userRes.json()) as { dates: (LunchDatePublic & { role: string })[] };
        const fromApi = data.dates ?? [];
        valid = fromApi.filter((d) => d.status !== "cancelled");
        /* Backfill localStorage so cancel/leave actions work */
        for (const d of fromApi) {
          if (d.role === "creator") {
            rememberCreatedDate(d.id, userToken);
          } else if (d.role === "participant") {
            localStorage.setItem(`joined:${d.id}`, userToken);
          }
        }
      }
    } catch {
      /* Fall through to localStorage fallback */
    }

    /* Fallback 1: localStorage ids */
    if (valid.length === 0) {
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
      if (ids.length > 0) {
        const results = await Promise.all(
          ids.map((id) =>
            fetch(`/api/dates/${id}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );
        valid = results.filter(Boolean).filter((d: LunchDatePublic) => d.status !== "cancelled");
      }
    }

    /* Fallback 2: alias match (all dates from server – same instance as Map/Browse) */
    if (valid.length === 0) {
      const alias = (getStoredAlias() ?? "").trim().toLowerCase();
      if (alias) {
        try {
          const allRes = await fetch("/api/dates");
          if (allRes.ok) {
            const all = (await allRes.json()) as LunchDatePublic[];
            const mine = all.filter(
              (d) =>
                d.status !== "cancelled" &&
                (d.creatorAlias.toLowerCase() === alias ||
                  d.participants.some((p) => p.alias.toLowerCase() === alias))
            );
            if (mine.length > 0) {
              valid = mine;
              for (const d of mine) {
                if (d.creatorAlias.toLowerCase() === alias) {
                  rememberCreatedDate(d.id, userToken);
                } else {
                  localStorage.setItem(`joined:${d.id}`, userToken);
                }
              }
            }
          }
        } catch {
          /* ignore */
        }
      }
    }

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
    async function init() {
      if (initialDates.length > 0) {
        const windowRes = await fetch("/api/lunch-window");
        let windowList: WindowDate[] = [];
        if (windowRes.ok) {
          const data = (await windowRes.json()) as { dates: WindowDate[] };
          windowList = data.dates ?? [];
        }
        if (windowList.length === 0) {
          windowList = selectableLunchDateYmds().map((ymd) => ({ ymd, label: lunchDateLabel(ymd) }));
        }
        setWindowDates(windowList);
        const userToken = getUserToken();
        const valid = initialDates.filter((d) => d.status !== "cancelled");
        setDates(valid);
        for (const d of initialDates) {
          if (d.status === "cancelled") continue;
          if (d.role === "creator") rememberCreatedDate(d.id, userToken);
          else if (d.role === "participant") localStorage.setItem(`joined:${d.id}`, userToken);
        }
        const byYmd: Record<string, LunchDatePublic> = {};
        for (const d of valid) {
          if (!byYmd[d.date]) byYmd[d.date] = d;
        }
        setSelectedYmd((prev) => (prev && byYmd[prev] ? prev : Object.keys(byYmd)[0] ?? null));
        setLoading(false);
      } else {
        void load();
      }
    }
    void init();
  }, [initialDates, load]);

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
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div>
      <DayPickerSubtabs
        days={windowDates.map((w) => ({ ymd: w.ymd }))}
        selectedYmd={selectedYmd ?? ""}
        onSelect={(ymd) => setSelectedYmd(ymd)}
        ariaLabel="Lunch by day"
        idPrefix="my-lunch"
        isDisabled={(ymd) => !bookedByYmd[ymd]}
        isActive={(ymd) => Boolean(bookedByYmd[ymd]) && selectedYmd === ymd}
      />

      {!hasAnyBooking && (
        <div className="empty-state" style={{ paddingTop: "0.5rem" }}>
          <p>You don't have a planned lunch date in this window (today + five days).</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            <Link
              href="/create"
              className="primary-button"
              style={{ maxWidth: "260px", marginInline: "auto" }}
            >
              Create a date
            </Link>
            <Link
              href="/browse"
              className="secondary-button"
              style={{ maxWidth: "260px", marginInline: "auto" }}
            >
              Find a date to join
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
          Pick a day with a booking in the tabs above.
        </p>
      )}
    </div>
  );
}
