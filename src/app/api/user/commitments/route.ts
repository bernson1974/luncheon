import { NextRequest, NextResponse } from "next/server";
import { getCommittedDateYmdsForUser } from "@/lib/store";
import { getSessionUserFromRequest } from "@/lib/auth";

/** Calendar days (YYYY-MM-DD) where the user is already host or participant. */
export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const committedYmds = await getCommittedDateYmdsForUser(user.id);
  return NextResponse.json({ committedYmds });
}
