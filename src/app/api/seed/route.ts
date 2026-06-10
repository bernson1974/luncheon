import { NextResponse } from "next/server";
import { seedMockDates } from "@/lib/seedMockDates";

/** Dev/manual seed: POST /api/seed — 50 mock dates on alternating lunch-window days. */
export async function POST() {
  try {
    const result = await seedMockDates();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Seed failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
