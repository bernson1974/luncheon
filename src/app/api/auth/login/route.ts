import { NextRequest, NextResponse } from "next/server";
import { loginUser, createSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const result = await loginUser(String(email), String(password));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  const token = await createSession(result.user);
  const res = NextResponse.json({ ok: true, user: result.user });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
