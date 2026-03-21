import { NextRequest, NextResponse } from "next/server";
import { listDates, createDate } from "@/lib/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = {
    time: searchParams.get("time") ?? undefined,
    restaurantId: searchParams.get("restaurantId") ?? undefined,
    topic: searchParams.get("topic") ?? undefined,
  };

  const dates = listDates(filters);
  return NextResponse.json(dates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { creatorAlias, creatorToken, timeStart, timeEnd, restaurantId, topic, maxParticipants, meetingPoint } = body;

  if (!creatorAlias || !creatorToken || !timeStart || !restaurantId || !topic || !maxParticipants) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const date = createDate({ creatorAlias, creatorToken, timeStart, timeEnd, restaurantId, topic, maxParticipants, meetingPoint });
  return NextResponse.json(date, { status: 201 });
}
