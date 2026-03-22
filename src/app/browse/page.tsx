"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { LunchDatePublic } from "@/lib/models";
import { restaurants } from "@/lib/restaurants";
import TimeQuarterSelect from "@/components/TimeQuarterSelect";
import { cuisineLabel } from "@/lib/cuisineLabels";
import { lunchDateLabel } from "@/lib/lunchDateWindow";

function badgeClass(status: string): string {
  if (status === "open") return "badge badge-open";
  if (status === "full") return "badge badge-full";
  return "badge badge-cancelled";
}

function badgeLabel(status: string): string {
  if (status === "open") return "Open";
  if (status === "full") return "Full";
  return "Cancelled";
}

type WindowDate = { ymd: string; label: string };

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [dates, setDates] = useState<LunchDatePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowDates, setWindowDates] = useState<WindowDate[]>([]);

  const [filterTime, setFilterTime] = useState("");
  const [filterDate, setFilterDate] = useState(searchParams.get("date") ?? "");
  const [filterRestaurant, setFilterRestaurant] = useState(
    searchParams.get("restaurantId") ?? ""
  );
  const [filterTopic, setFilterTopic] = useState("");

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
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterTime) params.set("time", filterTime);
        if (filterDate) params.set("date", filterDate);
        if (filterRestaurant) params.set("restaurantId", filterRestaurant);
        if (filterTopic) params.set("topic", filterTopic);

        const res = await fetch(`/api/dates?${params}`);
        const data = await res.json();
        setDates(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filterTime, filterDate, filterRestaurant, filterTopic]);

  /** Prefill Create with current filters (restaurant + day). */
  const createPrefillHref = useMemo(() => {
    const p = new URLSearchParams();
    if (filterRestaurant) p.set("restaurantId", filterRestaurant);
    if (filterDate) p.set("date", filterDate);
    const q = p.toString();
    return q ? `/create?${q}` : "/create";
  }, [filterRestaurant, filterDate]);

  return (
    <div>
      <Link href="/" className="back-link">
        ← Back
      </Link>

      <h1 className="page-title">Lunch dates</h1>
      <p className="page-subtitle">
        Lindholmen · today and five days ahead (Stockholm time)
      </p>

      <div className="filter-row">
        <select
          className="filter-select"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          aria-label="Filter by day"
        >
          <option value="">All days</option>
          {windowDates.map((d) => (
            <option key={d.ymd} value={d.ymd}>
              {d.label}
            </option>
          ))}
        </select>
        <TimeQuarterSelect
          className="time-quarter-selects--filter"
          value={filterTime}
          onChange={setFilterTime}
          allowEmpty
          emptyLabel="All times"
          selectClassName="filter-select"
          groupAriaLabel="Filter dates from time"
        />
        <select
          className="filter-select"
          value={filterRestaurant}
          onChange={(e) => setFilterRestaurant(e.target.value)}
        >
          <option value="">All restaurants</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          className="filter-input"
          type="text"
          placeholder="Search topic…"
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
          Loading…
        </p>
      ) : dates.length === 0 ? (
        <div className="empty-state">
          <p>No open lunch dates match your filters.</p>
          <Link
            href={createPrefillHref}
            className="primary-button"
            style={{ maxWidth: "260px", marginInline: "auto", marginTop: "1rem" }}
          >
            Create the first one
          </Link>
        </div>
      ) : (
        <div>
          {dates.map((date) => (
            <Link key={date.id} href={`/date/${date.id}`} className="date-card">
              <div className="date-card-header">
                <div>
                  <div className="date-card-title">{date.topic}</div>
                  <div className="date-card-restaurant">
                    {date.restaurant.name} · {cuisineLabel(date.restaurant.cuisine)}
                  </div>
                </div>
                <span className={badgeClass(date.status)}>{badgeLabel(date.status)}</span>
              </div>
              <div className="date-card-footer">
                <span>{lunchDateLabel(date.date)}</span>
                <span>
                  {date.timeStart}
                  {date.timeEnd ? `–${date.timeEnd}` : ""}
                </span>
                <span>
                  Host: <strong>{date.creatorAlias}</strong>
                </span>
                <span>
                  {date.status === "open"
                    ? `${date.spotsLeft} spot${date.spotsLeft !== 1 ? "s" : ""} left`
                    : date.status === "full"
                    ? "Fully booked"
                    : "Cancelled"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
