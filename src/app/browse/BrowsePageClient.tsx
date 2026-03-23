"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useId,
  type TransitionEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { LunchDatePublic } from "@/lib/models";
import TimeQuarterSelect from "@/components/TimeQuarterSelect";
import { cuisineLabel } from "@/lib/cuisineLabels";
import { lunchDateLabel } from "@/lib/lunchDateWindow";

function dateCardStatusClass(status: string): string {
  if (status === "open") return "date-card--open";
  if (status === "full") return "date-card--full";
  return "date-card--cancelled";
}

type WindowDate = { ymd: string; label: string };

type BrowseFilterTabId = "topic" | "day" | "restaurant";

const FILTER_TABS: { id: BrowseFilterTabId; label: string }[] = [
  { id: "topic", label: "Topic" },
  { id: "day", label: "Date" },
  { id: "restaurant", label: "Place" },
];

function getCuisineKeysFromDates(dates: LunchDatePublic[]): string[] {
  const set = new Set<string>();
  for (const d of dates) {
    if (d.restaurant?.cuisine) set.add(d.restaurant.cuisine);
  }
  return [...set].sort((a, b) => cuisineLabel(a).localeCompare(cuisineLabel(b), "en"));
}

function getRestaurantsFromDates(dates: LunchDatePublic[]): Array<{ id: string; name: string }> {
  const map = new Map<string, string>();
  for (const d of dates) {
    if (d.restaurant && !map.has(d.restaurant.id)) {
      map.set(d.restaurant.id, d.restaurant.name);
    }
  }
  return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

function filterDates(
  dates: LunchDatePublic[],
  filters: { date?: string; time?: string; restaurantId?: string; cuisine?: string; topic?: string }
): LunchDatePublic[] {
  let out = [...dates];
  if (filters.date) out = out.filter((d) => d.date === filters.date);
  if (filters.restaurantId) out = out.filter((d) => d.restaurantId === filters.restaurantId);
  if (filters.cuisine) out = out.filter((d) => d.restaurant.cuisine === filters.cuisine);
  if (filters.topic?.trim()) {
    const q = filters.topic.toLowerCase();
    out = out.filter((d) => d.topic.toLowerCase().includes(q));
  }
  if (filters.time) out = out.filter((d) => d.timeStart >= filters.time!);
  return out.sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    return c !== 0 ? c : a.timeStart.localeCompare(b.timeStart);
  });
}

export default function BrowsePageClient({ initialDates }: { initialDates: LunchDatePublic[] }) {
  const searchParams = useSearchParams();
  const baseId = useId();
  const [windowDates, setWindowDates] = useState<WindowDate[]>([]);
  const [activeFilterTab, setActiveFilterTab] = useState<BrowseFilterTabId>("topic");

  const [filterTime, setFilterTime] = useState("");
  const [filterDate, setFilterDate] = useState(searchParams.get("date") ?? "");
  const [filterRestaurant, setFilterRestaurant] = useState(
    searchParams.get("restaurantId") ?? ""
  );
  const [filterCuisine, setFilterCuisine] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [hideFullyBooked, setHideFullyBooked] = useState(false);

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

  const dates = useMemo(
    () =>
      filterDates(initialDates, {
        date: filterDate || undefined,
        time: filterTime || undefined,
        restaurantId: filterRestaurant || undefined,
        cuisine: filterCuisine || undefined,
        topic: filterTopic || undefined,
      }),
    [initialDates, filterDate, filterTime, filterRestaurant, filterCuisine, filterTopic]
  );

  /** Prefill Create with current filters (restaurant + day). */
  const createPrefillHref = useMemo(() => {
    const p = new URLSearchParams();
    if (filterRestaurant) p.set("restaurantId", filterRestaurant);
    if (filterDate) p.set("date", filterDate);
    const q = p.toString();
    return q ? `/create?${q}` : "/create";
  }, [filterRestaurant, filterDate]);

  const visibleDates = useMemo(() => {
    if (!hideFullyBooked) return dates;
    return dates.filter((d) => d.status !== "full");
  }, [dates, hideFullyBooked]);

  const panelId = (tab: BrowseFilterTabId) => `${baseId}-panel-${tab}`;

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filterTopic.trim() ||
          filterTime ||
          filterDate ||
          filterRestaurant ||
          filterCuisine
      ),
    [filterTopic, filterTime, filterDate, filterRestaurant, filterCuisine]
  );

  /** off | open | closing — styr Clear-panel + så knappen kan finnas kvar under kollaps */
  const [clearUi, setClearUi] = useState<"off" | "open" | "closing">("off");

  useLayoutEffect(() => {
    if (hasActiveFilters) {
      setClearUi((u) => (u !== "open" ? "open" : u));
    } else {
      setClearUi((u) => (u === "open" ? "closing" : u));
    }
  }, [hasActiveFilters]);

  /* Om max-width-transition inte triggar (t.ex. vissa webbläsare), stäng ändå */
  useEffect(() => {
    if (clearUi !== "closing") return;
    const id = window.setTimeout(() => {
      setClearUi((u) => (u === "closing" ? "off" : u));
    }, 500);
    return () => window.clearTimeout(id);
  }, [clearUi]);

  function clearAllFilters() {
    setFilterTopic("");
    setFilterTime("");
    setFilterDate("");
    setFilterRestaurant("");
    setFilterCuisine("");
  }

  function onClearWrapTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "max-width") return;
    setClearUi((u) => (u === "closing" ? "off" : u));
  }

  return (
    <div>
      <section className="browse-filter-section" aria-label="Filter lunch dates">
        <div
          className={`browse-subtab-row browse-subtab-row--join-filters${clearUi === "open" ? " browse-subtab-row--clear-open" : ""}`}
        >
          <div className="browse-subtab-bar" role="tablist" aria-label="Filter fields">
            {FILTER_TABS.map((t) => {
              const selected = activeFilterTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={panelId(t.id)}
                  tabIndex={selected ? 0 : -1}
                  className={`browse-subtab${selected ? " browse-subtab--active" : ""}`}
                  onClick={() => setActiveFilterTab(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div
            className={`browse-subtab-clear-wrap${clearUi === "closing" ? " browse-subtab-clear-wrap--closing" : ""}`}
            aria-hidden={clearUi === "off"}
            onTransitionEnd={onClearWrapTransitionEnd}
          >
            {clearUi === "open" || clearUi === "closing" ? (
              <button
                type="button"
                className="browse-subtab browse-subtab--clear-filter browse-subtab--clear-filter--active"
                aria-label="Clear all filters (you have active filters)"
                onClick={() => {
                  if (clearUi === "closing") return;
                  clearAllFilters();
                }}
              >
                Clear filter
              </button>
            ) : null}
          </div>
        </div>

        <div className="browse-hide-full-row">
          <input
            id={`${baseId}-hide-full`}
            type="checkbox"
            className="browse-hide-full-checkbox"
            checked={hideFullyBooked}
            onChange={(e) => setHideFullyBooked(e.target.checked)}
          />
          <label htmlFor={`${baseId}-hide-full`} className="browse-hide-full-label">
            Hide fully booked
          </label>
        </div>

        <div className="browse-subtab-panels">
          {FILTER_TABS.map((t) => (
            <div
              key={t.id}
              id={panelId(t.id)}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${t.id}`}
              hidden={activeFilterTab !== t.id}
              className="browse-subtab-panel"
            >
              {t.id === "topic" && (
                <>
                  <label className="field-label" htmlFor="browse-filter-topic">
                    Topic
                  </label>
                  <input
                    id="browse-filter-topic"
                    className="filter-input browse-subtab-panel__control"
                    type="text"
                    placeholder="Search topic…"
                    value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value)}
                    autoComplete="off"
                  />
                </>
              )}
              {t.id === "day" && (
                <div className="browse-subtab-panel__stack">
                  <div>
                    <label className="field-label" htmlFor="browse-filter-day">
                      Day
                    </label>
                    <select
                      id="browse-filter-day"
                      className="filter-select browse-subtab-panel__control"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    >
                      <option value="">All days</option>
                      {windowDates.map((d) => (
                        <option key={d.ymd} value={d.ymd}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="browse-subtab-panel__stack-gap">
                    <label className="field-label" style={{ display: "block" }}>
                      Start time
                    </label>
                    <TimeQuarterSelect
                      className="time-quarter-selects--filter browse-subtab-panel__time"
                      value={filterTime}
                      onChange={setFilterTime}
                      allowEmpty
                      emptyLabel="All times"
                      selectClassName="filter-select"
                      groupAriaLabel="Start time (hour and minute)"
                    />
                  </div>
                </div>
              )}
              {t.id === "restaurant" && (
                <div className="browse-subtab-panel__stack">
                  <div>
                    <label className="field-label" htmlFor="browse-filter-restaurant">
                      Restaurant
                    </label>
                    <select
                      id="browse-filter-restaurant"
                      className="filter-select browse-subtab-panel__control"
                      value={filterRestaurant}
                      onChange={(e) => setFilterRestaurant(e.target.value)}
                    >
                      <option value="">All restaurants</option>
                      {getRestaurantsFromDates(initialDates).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="browse-subtab-panel__stack-gap">
                    <label className="field-label" htmlFor="browse-filter-cuisine">
                      Cuisine
                    </label>
                    <select
                      id="browse-filter-cuisine"
                      className="filter-select browse-subtab-panel__control"
                      value={filterCuisine}
                      onChange={(e) => setFilterCuisine(e.target.value)}
                    >
                      <option value="">All cuisines</option>
                      {getCuisineKeysFromDates(initialDates).map((key) => (
                        <option key={key} value={key}>
                          {cuisineLabel(key)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="browse-dates-list" aria-label="Lunch dates">
        {dates.length === 0 ? (
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
        ) : visibleDates.length === 0 ? (
          <div className="empty-state">
            <p>All matching dates are fully booked.</p>
            <p className="secondary-text" style={{ marginTop: "0.35rem" }}>
              Turn off &quot;Hide fully booked&quot; to see them, or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="browse-dates-list__cards">
            {visibleDates.map((date) => (
              <div
                key={date.id}
                className={`browse-date-bg-card ${dateCardStatusClass(date.status)}`}
              >
                <Link href={`/date/${date.id}`} className="date-card date-card--in-bg">
                  <div className="date-card-header">
                    <div>
                      <div className="date-card-title">{date.topic}</div>
                      <div className="date-card-restaurant">
                        {date.restaurant.name} · {cuisineLabel(date.restaurant.cuisine)}
                      </div>
                    </div>
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
                    <span
                      className={`badge ${
                        date.status === "open"
                          ? "badge-open"
                          : date.status === "full"
                            ? "badge-full"
                            : "badge-cancelled"
                      }`}
                    >
                      {date.status === "open"
                        ? "Open"
                        : date.status === "full"
                          ? "Full"
                          : "Cancelled"}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
