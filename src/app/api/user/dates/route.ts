import { NextRequest, NextResponse } from "next/server";
import { listDatesForUser } from "@/lib/store";
import { getSessionUserFromRequest } from "@/lib/auth";

/** All dates where the user is host or participant. For My Bites across devices. */
export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const dates = await listDatesForUser(user.id);
  return NextResponse.json({ dates });
}
