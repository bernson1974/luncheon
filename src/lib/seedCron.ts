import { differenceInCalendarDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { neon } from "@neondatabase/serverless";
import { LUNCH_TIMEZONE, selectableLunchDateYmds } from "@/lib/lunchDateWindow";
import { DEFAULT_MOCK_SEED_COUNT, seedMockDates } from "@/lib/seedMockDates";

const SEED_META_KEY = "mock_dates_last_run_ymd";
const SEED_INTERVAL_DAYS = 2;

const sql = process.env.POSTGRES_URL ? neon(process.env.POSTGRES_URL) : null;

async function ensureSeedMetaTable(): Promise<void> {
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS seed_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function getMockSeedLastRunYmd(): Promise<string | null> {
  if (!sql) return null;
  try {
    await ensureSeedMetaTable();
    const rows = await sql`SELECT value FROM seed_meta WHERE key = ${SEED_META_KEY} LIMIT 1`;
    return (rows[0] as { value: string } | undefined)?.value ?? null;
  } catch {
    return null;
  }
}

export async function setMockSeedLastRunYmd(ymd: string): Promise<void> {
  if (!sql) return;
  await ensureSeedMetaTable();
  await sql`
    INSERT INTO seed_meta (key, value, updated_at)
    VALUES (${SEED_META_KEY}, ${ymd}, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

export function stockholmYmd(now: Date = new Date()): string {
  return formatInTimeZone(now, LUNCH_TIMEZONE, "yyyy-MM-dd");
}

/** Remove mock seed dates outside the current lunch window so the DB does not grow forever. */
export async function pruneMockDatesOutsideWindow(): Promise<number> {
  if (!sql) return 0;
  const valid = selectableLunchDateYmds();
  if (valid.length === 0) return 0;

  const stale = await sql`
    SELECT id FROM dates
    WHERE creator_token LIKE 'seed-creator-%'
      AND NOT (date = ANY(${valid}))
  `;
  const ids = (stale as { id: string }[]).map((r) => r.id);
  if (ids.length === 0) return 0;

  for (const id of ids) {
    await sql`DELETE FROM participants WHERE lunch_date_id = ${id}`;
    await sql`DELETE FROM dates WHERE id = ${id}`;
  }
  return ids.length;
}

export type RunMockSeedCronResult =
  | { ran: false; reason: string; today: string; lastRun: string | null }
  | ({ ran: true; pruned: number } & Awaited<ReturnType<typeof seedMockDates>>);

export async function runMockSeedCron(options?: {
  force?: boolean;
  count?: number;
}): Promise<RunMockSeedCronResult> {
  const today = stockholmYmd();
  const lastRun = await getMockSeedLastRunYmd();

  if (!options?.force && lastRun) {
    const lastNoon = fromZonedTime(`${lastRun}T12:00:00`, LUNCH_TIMEZONE);
    const todayNoon = fromZonedTime(`${today}T12:00:00`, LUNCH_TIMEZONE);
    if (differenceInCalendarDays(todayNoon, lastNoon) < SEED_INTERVAL_DAYS) {
      return {
        ran: false,
        reason: `Last mock seed was ${lastRun}; next run in ${SEED_INTERVAL_DAYS} calendar days`,
        today,
        lastRun,
      };
    }
  }

  const pruned = await pruneMockDatesOutsideWindow();
  const result = await seedMockDates({ count: options?.count ?? DEFAULT_MOCK_SEED_COUNT });
  await setMockSeedLastRunYmd(today);

  return { ran: true, pruned, ...result };
}
