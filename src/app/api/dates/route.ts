import { NextRequest, NextResponse } from "next/server";
import { listDates, createDate, userHasCommitmentOnDate } from "@/lib/store";
import { isYmdInSelectableLunchWindow } from "@/lib/lunchDateWindow";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = {
    time: searchParams.get("time") ?? undefined,
    restaurantId: searchParams.get("restaurantId") ?? undefined,
    topic: searchParams.get("topic") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    cuisine: searchParams.get("cuisine") ?? undefined,
  };

  const dates = await listDates(filters);
  return NextResponse.json(dates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    creatorAlias,
    creatorToken,
    date: dateYmd,
    timeStart,
    timeEnd,
    restaurantId,
    restaurant,
    topic,
    maxParticipants,
    meetingPoint,
  } = body;

  const rest = restaurant ?? (restaurantId ? { id: restaurantId, name: "", latitude: 0, longitude: 0, cuisine: "" } : null);

  if (
    !creatorAlias ||
    !creatorToken ||
    !dateYmd ||
    typeof dateYmd !== "string" ||
    !timeStart ||
    !rest?.id ||
    !rest?.name ||
    !topic ||
    !maxParticipants
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!isYmdInSelectableLunchWindow(dateYmd)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  if (await userHasCommitmentOnDate(creatorToken, dateYmd)) {
    return NextResponse.json({ error: "busy_that_day" }, { status: 409 });
  }

  const date = await createDate({
    creatorAlias,
    creatorToken,
    date: dateYmd,
    timeStart,
    timeEnd,
    restaurantId: rest.id,
    restaurant: { id: rest.id, name: rest.name, latitude: rest.latitude ?? 0, longitude: rest.longitude ?? 0, cuisine: rest.cuisine ?? "restaurant" },
    topic,
    maxParticipants,
    meetingPoint,
  });
  return NextResponse.json(date, { status: 201 });
}
