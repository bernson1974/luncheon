import { NextRequest, NextResponse } from "next/server";
import { getCommittedDateYmdsForUser } from "@/lib/store";

/** Calendar days (YYYY-MM-DD) where the user is already host or participant. */
export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get("luncheon_user_token")?.value;
  const userToken =
    (cookieToken ? decodeURIComponent(cookieToken) : null) ??
    request.nextUrl.searchParams.get("userToken");
  if (!userToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const committedYmds = getCommittedDateYmdsForUser(userToken);
  return NextResponse.json({ committedYmds });
}
