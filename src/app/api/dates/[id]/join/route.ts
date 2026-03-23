import { NextRequest, NextResponse } from "next/server";
import { joinDate, leaveDate } from "@/lib/store";
import { getSessionUserFromRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const { id } = await params;
  const result = await joinDate(id, user.alias, user.id);
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.participant, { status: 201 });
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
  const ok = await leaveDate(id, user.id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
