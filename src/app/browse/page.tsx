"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { LunchDatePublic } from "@/lib/models";
import { restaurants } from "@/lib/restaurants";
import TimeQuarterSelect from "@/components/TimeQuarterSelect";

const CUISINE_LABELS: Record<string, string> = {
  indian: "Indiskt",
  thai: "Thaimat",
  swedish: "Svensk husmanskost",
  japanese: "Japanskt / Sushi",
  pizza: "Pizza",
  burgers: "Burgare",
  asian: "Asiatiskt",
};

function cuisineLabel(cuisine: string): string {
  return CUISINE_LABELS[cuisine] ?? cuisine;
}

function badgeClass(status: string): string {
  if (status === "open") return "badge badge-open";
  if (status === "full") return "badge badge-full";
  return "badge badge-cancelled";
}

function badgeLabel(status: string): string {
  if (status === "open") return "Öppen";
  if (status === "full") return "Full";
  return "Avbokad";
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [dates, setDates] = useState<LunchDatePublic[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterTime, setFilterTime] = useState("");
  const [filterRestaurant, setFilterRestaurant] = useState(
    searchParams.get("restaurantId") ?? ""
  );
  const [filterTopic, setFilterTopic] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterTime) params.set("time", filterTime);
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
  }, [filterTime, filterRestaurant, filterTopic]);

  return (
    <div>
      <Link href="/" className="back-link">
        ← Tillbaka
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Lunchdejtar idag
        </h1>
        <Link href="/create">
          <button className="primary-button" type="button" style={{ width: "auto", padding: "0.5rem 1rem", marginTop: 0, fontSize: "0.85rem" }}>
            + Lägg upp
          </button>
        </Link>
      </div>
      <p className="page-subtitle">Lindholmen · {new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}</p>

      <div className="filter-row">
        <TimeQuarterSelect
          className="time-quarter-selects--filter"
          value={filterTime}
          onChange={setFilterTime}
          allowEmpty
          emptyLabel="Alla tider"
          selectClassName="filter-select"
          groupAriaLabel="Visa dejtar från tid"
        />
        <select
          className="filter-select"
          value={filterRestaurant}
          onChange={(e) => setFilterRestaurant(e.target.value)}
        >
          <option value="">Alla restauranger</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          className="filter-input"
          type="text"
          placeholder="Sök ämne…"
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
          Laddar…
        </p>
      ) : dates.length === 0 ? (
        <div className="empty-state">
          <p>Inga öppna lunchdejtar matchar din sökning.</p>
          <Link href="/create">
            <button className="primary-button" type="button" style={{ maxWidth: "260px", marginInline: "auto", marginTop: "1rem" }}>
              Lägg upp den första
            </button>
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
                <span>
                  {date.timeStart}
                  {date.timeEnd ? `–${date.timeEnd}` : ""}
                </span>
                <span>
                  Skapare: <strong>{date.creatorAlias}</strong>
                </span>
                <span>
                  {date.status === "open"
                    ? `${date.spotsLeft} plats${date.spotsLeft !== 1 ? "er" : ""} kvar`
                    : date.status === "full"
                    ? "Fullbokad"
                    : "Avbokad"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
