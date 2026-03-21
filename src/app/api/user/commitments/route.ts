import { NextRequest, NextResponse } from "next/server";
import { getCommittedDateYmdsForUser } from "@/lib/store";

/** Kalenderdagar (YYYY-MM-DD) där användaren redan är skapare eller deltagare. */
export async function GET(request: NextRequest) {
  const userToken = request.nextUrl.searchParams.get("userToken");
  if (!userToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const committedYmds = getCommittedDateYmdsForUser(userToken);
  return NextResponse.json({ committedYmds });
}
