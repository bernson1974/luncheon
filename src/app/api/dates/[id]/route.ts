import { NextRequest, NextResponse } from "next/server";
import { getDate, getDateRole, cancelDate } from "@/lib/store";
import { getSessionUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const date = await getDate(id);
  if (!date) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const user = await getSessionUserFromRequest(request);
  let myRole: "creator" | "participant" | null = null;
  if (user) {
    myRole = await getDateRole(id, user.id);
  }
  return NextResponse.json({ ...date, myRole });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await cancelDate(id, user.id);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json({ success: true });
}
