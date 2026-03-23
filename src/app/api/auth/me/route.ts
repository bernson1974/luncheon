import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie, verifySession, updateUserAlias } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = getSessionCookie(request);
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const user = await verifySession(token);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const token = getSessionCookie(request);
  if (!token) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }
  const user = await verifySession(token);
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }
  const body = await request.json();
  const { alias } = body;
  if (!alias || typeof alias !== "string") {
    return NextResponse.json({ error: "alias_required" }, { status: 400 });
  }
  const ok = await updateUserAlias(user.id, alias);
  if (!ok) {
    return NextResponse.json({ error: "invalid_alias" }, { status: 400 });
  }
  return NextResponse.json({ user: { ...user, alias: alias.trim() } });
}
