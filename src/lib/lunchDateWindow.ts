import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { sv } from "date-fns/locale";

/** Alla datum i appen (lista, skapa) utgår från denna tidszon. */
export const LUNCH_TIMEZONE = "Europe/Stockholm";

/** Antal kalenderdagar från och med idag som man får planera lunch (idag + 5 framåt = 6 dagar). */
export const LUNCH_WINDOW_DAYS = 6;

/** Dagens datum i Stockholm som YYYY-MM-DD. */
export function stockholmTodayYmd(now: Date = new Date()): string {
  return formatInTimeZone(now, LUNCH_TIMEZONE, "yyyy-MM-dd");
}

/**
 * De datum (YYYY-MM-DD) som får användas för nya dejter och som visas i listor,
 * i ordning: idag, imorgon, … (+5 dagar).
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

export function lunchDateLabelSv(ymd: string): string {
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(noon, LUNCH_TIMEZONE, "EEEE d MMM", { locale: sv });
}

/** Kompakt etikett för tabbar, t.ex. "ons 19/3". */
export function lunchDateShortTabLabelSv(ymd: string): string {
  const noon = fromZonedTime(`${ymd}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(noon, LUNCH_TIMEZONE, "EEE d/M", { locale: sv });
}
