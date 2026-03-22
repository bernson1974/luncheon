import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { enUS } from "date-fns/locale";

/** App dates (lists, create) use this timezone. */
export const LUNCH_TIMEZONE = "Europe/Stockholm";

/** Calendar days from today allowed for planning (today + 5 ahead = 6 days). */
export const LUNCH_WINDOW_DAYS = 6;

/** Today's date in Stockholm as YYYY-MM-DD. */
export function stockholmTodayYmd(now: Date = new Date()): string {
  return formatInTimeZone(now, LUNCH_TIMEZONE, "yyyy-MM-dd");
}

/**
 * YYYY-MM-DD values allowed for new dates and shown in lists,
 * in order: today, tomorrow, … (+5 days).
 */
export function selectableLunchDateYmds(now: Date = new Date()): string[] {
  const out: string[] = [];
  let cursor = formatInTimeZone(now, LUNCH_TIMEZONE, "yyyy-MM-dd");
  for (let i = 0; i < LUNCH_WINDOW_DAYS; i++) {
    out.push(cursor);
    const noon = fromZonedTime(`${cursor}T12:00:00`, LUNCH_TIMEZONE);
    cursor = formatInTimeZone(addDays(noon, 1), LUNCH_TIMEZONE, "yyyy-MM-dd");
  }
  return out;
}

export function isYmdInSelectableLunchWindow(
  ymd: string,
  now: Date = new Date()
): boolean {
  return selectableLunchDateYmds(now).includes(ymd);
}

/** Long label for a YMD, e.g. "Wednesday, Mar 19". */
export function lunchDateLabel(ymd: string): string {
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(noon, LUNCH_TIMEZONE, "EEEE, MMM d", { locale: enUS });
}

/** Short tab label, e.g. "Wed 3/19". */
export function lunchDateShortTabLabel(ymd: string): string {
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(noon, LUNCH_TIMEZONE, "EEE M/d", { locale: enUS });
}
