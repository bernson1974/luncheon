import { NextRequest, NextResponse } from "next/server";
import { listUnreadNotificationsForUser, markUserNotificationsRead } from "@/lib/store";
import { getSessionUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }
  const notifications = await listUnreadNotificationsForUser(user.id);
  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      body: n.body,
      lunchDateId: n.lunch_date_id,
      createdAt: n.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }
  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const ids = body.ids;
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "invalid_ids" }, { status: 400 });
  }
  await markUserNotificationsRead(user.id, ids);
  return NextResponse.json({ ok: true });
}
