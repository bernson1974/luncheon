import { NextRequest, NextResponse } from "next/server";
import { getDate, cancelDate } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const date = await getDate(id);
  if (!date) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(date);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { creatorToken } = body;

  if (!creatorToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const ok = await cancelDate(id, creatorToken);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json({ success: true });
}
