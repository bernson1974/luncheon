import { NextResponse } from "next/server";
import { runMockSeedCron } from "@/lib/seedCron";

/**
 * Vercel Cron (daily) — seeds 50 mock dates every other calendar day (Stockholm).
 * Auth: Authorization: Bearer {CRON_SECRET}
 *
 * Manual: curl -H "Authorization: Bearer $CRON_SECRET" \
 *   "http://localhost:3000/api/cron/seed-mock-dates?force=1"
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  try {
    const result = await runMockSeedCron({ force });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
