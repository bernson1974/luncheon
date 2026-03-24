"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { LunchDatePublic } from "@/lib/models";
import { syncLocalBookingStateWithServer } from "@/lib/bookingState";
import { forgetCreatedDate } from "@/lib/creatorStorage";
import { lunchDateLabel, selectableLunchDateYmds } from "@/lib/lunchDateWindow";
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

function MyLunchDayPanel({
  date,
  ariaLabelledBy,
  onBookingChanged,
}: {
  date: LunchDatePublic & { role?: string };
  ariaLabelledBy?: string;
  onBookingChanged?: () => void;
}) {
  const [acting, setActing] = useState(false);
  const [actionErr, setActionErr] = useState("");

  useEffect(() => {
    setActionErr("");
  }, [date.id]);

  const hasMeetingPoint =
    date.meetingPoint?.latitude != null && date.meetingPoint?.longitude != null;

  const isCancelled = date.status === "cancelled";
  const isCreator = date.role === "creator";
  const isParticipant = date.role === "participant";
  const showBookingAction = !isCancelled && (isCreator || isParticipant);

  async function handleCancelDejt() {
    if (acting) return;
    if (!confirm("Cancel this date? It will be removed from the list.")) return;
    setActing(true);
    setActionErr("");
    try {
      const res = await fetch(`/api/dates/${date.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
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
    if (acting) return;
    if (!confirm("Leave this lunch?")) return;
    setActing(true);
    setActionErr("");
    try {
      const res = await fetch(`/api/dates/${date.id}/join`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
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

  const statusClass = isCancelled ? "cancelled" : date.spotsLeft > 0 ? "open" : "full";

  return (
    <div
      role="tabpanel"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : `Date ${lunchDateLabel(date.date)}`}
      className="my-lunch-content-wrap"
    >
      <div className={`browse-date-bg-card browse-date-bg-card--${statusClass}`}>
        <div className="my-lunch-main-card__inner">
          <div className="my-lunch-details-section">
            <div className="detail-row detail-row--with-status">
              <span className="detail-label">Time</span>
              <span>
                {date.timeStart}
                {date.timeEnd ? `–${date.timeEnd}` : ""}
              </span>
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
              <span className="detail-label">Restaurant</span>
              <span>
                {date.restaurant.name}
                <span className="secondary-text" style={{ marginLeft: "0.4rem" }}>
                  ({cuisineLabel(date.restaurant.cuisine)})
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Topic</span>
              <span className="topic-tag">{date.topic}</span>
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
          </div>
        </div>
      </div>

      {hasMeetingPoint && (
        <div className="my-lunch-meeting-block">
          <div className="my-lunch-meeting-header">
            <p className="field-label" style={{ color: "#064e3b" }}>Meeting point</p>
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
        </div>
      )}

      {!hasMeetingPoint && (
        <div className="my-lunch-meeting-block" style={{ maxWidth: "17.5rem", marginInline: "auto", textAlign: "center" }}>
          <p className="field-label" style={{ color: "#7f1d1d" }}>Meeting point</p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#7f1d1d" }}>
            No meeting point has been set for this date.
          </p>
          {actionErr && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.5rem" }}>{actionErr}</p>
          )}
        </div>
      )}

      {cancelButton}
    </div>
  );
}

type ServerDate = LunchDatePublic & { role?: string };

export default function MyLunchPageClient({
  initialDates,
}: {
  initialDates: ServerDate[];
}) {
  const searchParams = useSearchParams();
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

    let valid: LunchDatePublic[] = [];
    try {
      const userRes = await fetch("/api/user/dates", { credentials: "include" });
      if (userRes.ok) {
        const data = (await userRes.json()) as { dates: (LunchDatePublic & { role: string })[] };
        const fromApi = data.dates ?? [];
        valid = fromApi.filter((d) => d.status !== "cancelled");
      }
    } catch {
      /* fall through */
    }

    setDates(valid);

    const byYmd: Record<string, LunchDatePublic> = {};
    for (const d of valid) {
      if (!byYmd[d.date]) byYmd[d.date] = d;
    }
    const firstBooked = windowList.find((w) => byYmd[w.ymd]);
    setSelectedYmd(firstBooked?.ymd ?? windowList[0]?.ymd ?? null);

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
        const valid = initialDates.filter((d) => d.status !== "cancelled");
        setDates(valid);
        const byYmd: Record<string, LunchDatePublic> = {};
        for (const d of valid) {
          if (!byYmd[d.date]) byYmd[d.date] = d;
        }
        setSelectedYmd((prev) => {
          const ymdSet = new Set(windowList.map((w) => w.ymd));
          if (prev && ymdSet.has(prev)) return prev;
          const firstBooked = windowList.find((w) => byYmd[w.ymd]);
          return firstBooked?.ymd ?? windowList[0]?.ymd ?? null;
        });
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

  const bookedYmdKeys = useMemo(() => Object.keys(bookedByYmd), [bookedByYmd]);

  /* Prefer ?date=ymd from URL (e.g. from Find "already have a bite" link) */
  const dateFromUrl = searchParams.get("date");

  useEffect(() => {
    if (loading) return;
    setSelectedYmd((prev) => {
      const ymdSet = new Set(windowDates.map((w) => w.ymd));
      if (dateFromUrl && ymdSet.has(dateFromUrl)) return dateFromUrl;
      if (prev && ymdSet.has(prev)) return prev;
      const firstBooked = windowDates.find((w) => bookedByYmd[w.ymd]);
      return firstBooked?.ymd ?? windowDates[0]?.ymd ?? null;
    });
  }, [loading, windowDates, bookedByYmd, dateFromUrl]);

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
        isActive={(ymd) => selectedYmd === ymd}
        myBitesBookedYmds={bookedYmdKeys}
      />

      {hasAnyBooking && activeDate && (
        <MyLunchDayPanel
          date={activeDate}
          ariaLabelledBy={`my-lunch-tab-${selectedYmd}`}
          onBookingChanged={load}
        />
      )}

      {selectedYmd && !activeDate && (
        <div
          className="my-lunch-free-day"
          role="tabpanel"
          aria-labelledby={`my-lunch-tab-${selectedYmd}`}
        >
          <p className="my-lunch-free-day__text">You&apos;re free to grab a bite!</p>
          <div className="my-lunch-free-day__logo-wrap">
            <img
              src="/welcome-logo.svg"
              alt=""
              className="my-lunch-free-day__logo"
              width={192}
              height={192}
              decoding="async"
            />
          </div>
          {!hasAnyBooking && (
            <div className="my-lunch-free-day__cta">
              <Link href="/create" className="primary-button" style={{ marginTop: 0 }}>
                Create an invite
              </Link>
              <Link href="/browse" className="secondary-button">
                Join a Bite
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
