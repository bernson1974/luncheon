import { NextRequest, NextResponse } from "next/server";
import { createUser, createSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, alias } = body;
    if (!email || !password || !alias) {
      return NextResponse.json({ error: "Email, password and name required" }, { status: 400 });
    }
    const result = await createUser(String(email), String(password), String(alias));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
