import { NextResponse } from "next/server";
import { lunchDateLabelSv, selectableLunchDateYmds } from "@/lib/lunchDateWindow";

/** Datum som får väljas vid skapande + etiketter (sv-SE, Stockholm). */
export async function GET() {
  const ymds = selectableLunchDateYmds();
  const dates = ymds.map((ymd) => ({
    ymd,
    label: lunchDateLabelSv(ymd),
  }));
  return NextResponse.json({ dates });
}
