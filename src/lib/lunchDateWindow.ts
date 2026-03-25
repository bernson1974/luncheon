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

/** Long label for a YMD, e.g. "Wednesday, Mar 19". Today shows as "Today". */
export function lunchDateLabel(ymd: string): string {
  if (ymd === stockholmTodayYmd()) return "Today";
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(noon, LUNCH_TIMEZONE, "EEEE, MMM d", { locale: enUS });
}

/**
 * In sentences, e.g. "today" or "on Thursday, Mar 27" (Stockholm calendar day).
 */
export function lunchDateNotificationPhrase(ymd: string, now: Date = new Date()): string {
  if (ymd === stockholmTodayYmd(now)) return "today";
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  const formatted = formatInTimeZone(noon, LUNCH_TIMEZONE, "EEEE, MMM d", { locale: enUS });
  return `on ${formatted}`;
}

/** Short tab label, e.g. "Wed 3/19". */
export function lunchDateShortTabLabel(ymd: string): string {
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(noon, LUNCH_TIMEZONE, "EEE M/d", { locale: enUS });
}

/** Weekday abbreviation, e.g. "Mon" (English, 3 letters typical). */
export function lunchDateWeekday3(ymd: string): string {
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(noon, LUNCH_TIMEZONE, "EEE", { locale: enUS });
}

/** Date line under weekday, e.g. "Mar 19". */
export function lunchDateMonthDayLine(ymd: string): string {
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(noon, LUNCH_TIMEZONE, "MMM d", { locale: enUS });
}
