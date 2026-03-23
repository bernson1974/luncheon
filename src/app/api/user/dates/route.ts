import { NextRequest, NextResponse } from "next/server";
import { listDatesForUser } from "@/lib/store";

/** All dates where the user is host or participant. For My Bites across devices. */
export async function GET(request: NextRequest) {
  const userToken = request.nextUrl.searchParams.get("userToken");
  if (!userToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const dates = await listDatesForUser(userToken);
  return NextResponse.json({ dates });
}
