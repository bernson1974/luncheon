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
  /**
   * Find only: inactive utan din bokning = ljusgrön bakgrund + mörkgrön border/text; med bokning =
   * ljusbeige + mörkbeige. Aktiv vald dag som övriga flikar.
   */
  markPersonalBookedYmds?: string[];
  /**
   * My Bites: pass YYYY-MM-DD list for days that have a booking. Other days (when not selected)
   * keep the former disabled look but stay clickable.
   */
  myBitesBookedYmds?: string[];
};

export default function DayPickerSubtabs({
  days,
  selectedYmd,
  onSelect,
  ariaLabel,
  idPrefix,
  isDisabled,
  isActive,
  markPersonalBookedYmds,
  myBitesBookedYmds,
}: Props) {
  const todayYmd = stockholmTodayYmd();
  const findBookedStyle = markPersonalBookedYmds !== undefined;
  const myLunchStyle = myBitesBookedYmds !== undefined;

  if (days.length === 0) {
    return null;
  }

  return (
    <div
      className={`browse-subtab-row browse-subtab-row--days-only day-picker-subtabs${findBookedStyle ? " day-picker-subtabs--find" : ""}${myLunchStyle ? " day-picker-subtabs--my-lunch" : ""}`}
    >
      <div className="browse-subtab-bar" role="tablist" aria-label={ariaLabel}>
        {days.map((d) => {
          const disabled = isDisabled?.(d.ymd) ?? false;
          const active =
            (isActive?.(d.ymd) ?? selectedYmd === d.ymd) && !disabled;
          const isToday = d.ymd === todayYmd;
          const hasPersonalBooking =
            findBookedStyle &&
            (markPersonalBookedYmds ?? []).includes(d.ymd) &&
            !active;
          const findOpenForBooking =
            findBookedStyle &&
            !disabled &&
            !active &&
            !(markPersonalBookedYmds ?? []).includes(d.ymd);
          const myLunchFreeTab =
            myLunchStyle &&
            !(myBitesBookedYmds ?? []).includes(d.ymd) &&
            !active;

          return (
            <button
              key={d.ymd}
              type="button"
              role="tab"
              disabled={disabled}
              aria-selected={active}
              id={`${idPrefix}-tab-${d.ymd}`}
              className={`browse-subtab day-subtab${active ? " browse-subtab--active" : ""}${hasPersonalBooking ? " day-subtab--has-personal-booking" : ""}${findOpenForBooking ? " day-subtab--find-open-for-booking" : ""}${myLunchFreeTab ? " day-subtab--my-lunch-free-tab" : ""}`}
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
