"use client";

import {
  lunchDateMonthDayLine,
  lunchDateWeekday3,
  stockholmTodayYmd,
} from "@/lib/lunchDateWindow";

export type DayPickerDay = { ymd: string };

type Props = {
  days: DayPickerDay[];
  selectedYmd: string;
  onSelect: (ymd: string) => void;
  ariaLabel: string;
  /** Prefix for stable tab ids, e.g. `home-map` or `my-lunch`. */
  idPrefix: string;
  /** If true, tab is not selectable. */
  isDisabled?: (ymd: string) => boolean;
  /** Selected appearance; defaults to `selectedYmd === ymd` when not disabled. */
  isActive?: (ymd: string) => boolean;
};

export default function DayPickerSubtabs({
  days,
  selectedYmd,
  onSelect,
  ariaLabel,
  idPrefix,
  isDisabled,
  isActive,
}: Props) {
  const todayYmd = stockholmTodayYmd();

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="browse-subtab-row browse-subtab-row--days-only day-picker-subtabs">
      <div className="browse-subtab-bar" role="tablist" aria-label={ariaLabel}>
        {days.map((d) => {
          const disabled = isDisabled?.(d.ymd) ?? false;
          const active =
            (isActive?.(d.ymd) ?? selectedYmd === d.ymd) && !disabled;
          const isToday = d.ymd === todayYmd;

          return (
            <button
              key={d.ymd}
              type="button"
              role="tab"
              disabled={disabled}
              aria-selected={active}
              id={`${idPrefix}-tab-${d.ymd}`}
              className={`browse-subtab day-subtab${active ? " browse-subtab--active" : ""}`}
              onClick={() => {
                if (!disabled) onSelect(d.ymd);
              }}
            >
              {isToday ? (
                <span className="day-subtab__top day-subtab__top--weekday">Today</span>
              ) : (
                <>
                  <span className="day-subtab__top day-subtab__top--weekday">
                    {lunchDateWeekday3(d.ymd)}
                  </span>
                  <span className="day-subtab__date">{lunchDateMonthDayLine(d.ymd)}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
