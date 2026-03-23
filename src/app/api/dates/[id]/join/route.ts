import { NextRequest, NextResponse } from "next/server";
import { joinDate, leaveDate } from "@/lib/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { alias, userToken } = body;

  if (!alias || !userToken) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await joinDate(id, alias, userToken);
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
  const { id } = await params;
  const body = await request.json();
  const { userToken } = body;

  if (!userToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const ok = await leaveDate(id, userToken);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
