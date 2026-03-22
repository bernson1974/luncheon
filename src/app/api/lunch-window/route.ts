import { NextResponse } from "next/server";
import { lunchDateLabel, selectableLunchDateYmds } from "@/lib/lunchDateWindow";

/** Selectable create dates + labels (Europe/Stockholm, English locale). */
export async function GET() {
  const ymds = selectableLunchDateYmds();
  const dates = ymds.map((ymd) => ({
    ymd,
    label: lunchDateLabel(ymd),
  }));
  return NextResponse.json({ dates });
}
