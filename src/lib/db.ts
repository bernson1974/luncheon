import { neon } from "@neondatabase/serverless";
import type { LunchDatePublic, ParticipantPublic } from "./models";
import { selectableLunchDateYmds } from "./lunchDateWindow";

const sql = process.env.POSTGRES_URL
  ? neon(process.env.POSTGRES_URL)
  : null;

export type UserDateRole = "creator" | "participant";

function rowToDate(row: {
  id: string;
  creator_alias: string;
  date: string;
  area: string;
  time_start: string;
  time_end: string | null;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_lat: number;
  restaurant_lng: number;
  restaurant_cuisine: string;
  topic: string;
  max_participants: number;
  status: string;
  created_at: string;
  meeting_lat: number | null;
  meeting_lng: number | null;
  meeting_description: string | null;
}) {
  return {
    id: row.id,
    creatorAlias: row.creator_alias,
    date: row.date,
    area: row.area as "Lindholmen",
    timeStart: row.time_start,
    timeEnd: row.time_end ?? undefined,
    restaurantId: row.restaurant_id,
    restaurant: {
      id: row.restaurant_id,
      name: row.restaurant_name,
      latitude: row.restaurant_lat,
      longitude: row.restaurant_lng,
      cuisine: row.restaurant_cuisine,
    },
    topic: row.topic,
    maxParticipants: row.max_participants,
    status: row.status as "open" | "full" | "cancelled",
    createdAt: row.created_at,
    meetingPoint:
      row.meeting_lat != null && row.meeting_lng != null
        ? {
            latitude: row.meeting_lat,
            longitude: row.meeting_lng,
            description: row.meeting_description ?? undefined,
          }
        : undefined,
  };
}

export async function userHasCommitmentOnDate(
  userToken: string,
  ymd: string
): Promise<boolean> {
  if (!sql) return false;
  const rows = await sql`
    SELECT 1 FROM dates d
    WHERE d.date = ${ymd} AND d.status != 'cancelled' AND d.creator_token = ${userToken}
    UNION
    SELECT 1 FROM participants p
    JOIN dates d ON d.id = p.lunch_date_id
    WHERE d.date = ${ymd} AND d.status != 'cancelled' AND p.user_token = ${userToken}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function getCommittedDateYmdsForUser(
  userToken: string
): Promise<string[]> {
  if (!sql) return [];
  const rows = await sql`
    SELECT DISTINCT d.date FROM dates d
    WHERE d.status != 'cancelled' AND d.creator_token = ${userToken}
    UNION
    SELECT DISTINCT d.date FROM participants p
    JOIN dates d ON d.id = p.lunch_date_id
    WHERE d.status != 'cancelled' AND p.user_token = ${userToken}
    ORDER BY 1
  `;
  return (rows as Array<{ date: string }>).map((r) => r.date);
}

export async function listDatesForUser(
  userToken: string
): Promise<(LunchDatePublic & { role: UserDateRole })[]> {
  if (!sql) return [];
  const ymds = selectableLunchDateYmds();
  const allRows = await sql`
    SELECT d.*, p.id as p_id, p.alias as p_alias, p.joined_at as p_joined_at, p.user_token as p_user_token
    FROM dates d
    LEFT JOIN participants p ON p.lunch_date_id = d.id
    WHERE d.status != 'cancelled'
      AND d.date IN (${ymds[0]}, ${ymds[1]}, ${ymds[2]}, ${ymds[3]}, ${ymds[4]}, ${ymds[5] ?? ymds[0]})
      AND (
        d.creator_token = ${userToken}
        OR EXISTS (SELECT 1 FROM participants p2 WHERE p2.lunch_date_id = d.id AND p2.user_token = ${userToken})
      )
  `;
  const byId = new Map<string, (LunchDatePublic & { role: UserDateRole })>();
  for (const row of allRows as unknown[]) {
    const r = row as Record<string, unknown>;
    const dateId = r.id as string;
    if (!byId.has(dateId)) {
      const creatorToken = r.creator_token as string;
      const participantRows = (allRows as unknown[]).filter(
        (x: unknown) => (x as Record<string, unknown>).id === dateId && (x as Record<string, unknown>).p_alias != null
      );
      const participants: ParticipantPublic[] = participantRows.map((x: unknown) => {
        const px = x as Record<string, unknown>;
        return { id: String(px.p_id), alias: String(px.p_alias), joinedAt: String(px.p_joined_at) };
      });
      const joinedExcludingCreator = participantRows.filter(
        (x: unknown) => (x as Record<string, unknown>).p_user_token !== creatorToken
      ).length;
      const dr = r as { creator_token: string; max_participants: number };
      const role: UserDateRole = dr.creator_token === userToken ? "creator" : "participant";
      const spotsLeft = Math.max(0, dr.max_participants - 1 - joinedExcludingCreator);
      byId.set(dateId, {
        ...rowToDate(r as Parameters<typeof rowToDate>[0]),
        participants,
        spotsLeft,
        role,
      } as LunchDatePublic & { role: UserDateRole });
    }
  }
  return [...byId.values()].sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    return c !== 0 ? c : a.timeStart.localeCompare(b.timeStart);
  });
}

export async function listDates(filters?: {
  time?: string;
  restaurantId?: string;
  topic?: string;
  date?: string;
  cuisine?: string;
}): Promise<LunchDatePublic[]> {
  try {
    if (!sql) return [];
    const ymds = selectableLunchDateYmds();
    let dateRows = await sql`
    SELECT d.*, p.id as p_id, p.alias as p_alias, p.joined_at as p_joined_at, p.user_token as p_user_token
    FROM dates d
    LEFT JOIN participants p ON p.lunch_date_id = d.id
    WHERE d.status != 'cancelled'
      AND d.date IN (${ymds[0]}, ${ymds[1]}, ${ymds[2]}, ${ymds[3]}, ${ymds[4]}, ${ymds[5] ?? ymds[0]})
  `;
  type DateRow = Record<string, unknown> & { id: string; date: string; creator_token: string; restaurant_id: string; restaurant_cuisine: string; topic: string; time_start: string; max_participants: number; p_id?: string; p_alias?: string; p_joined_at?: string; p_user_token?: string };
  let rows = dateRows as DateRow[];
  if (filters?.date) {
    rows = rows.filter((r) => r.date === filters!.date);
  }
  if (filters?.restaurantId) {
    rows = rows.filter((r) => r.restaurant_id === filters!.restaurantId);
  }
  if (filters?.cuisine) {
    rows = rows.filter((r) => r.restaurant_cuisine === filters!.cuisine);
  }
  if (filters?.topic) {
    const q = filters.topic.toLowerCase();
    rows = rows.filter((r) => r.topic.toLowerCase().includes(q));
  }
  if (filters?.time) {
    rows = rows.filter((r) => r.time_start >= filters!.time!);
  }
  const byId = new Map<string, LunchDatePublic>();
  for (const row of rows) {
    const dateId = row.id;
    if (!byId.has(dateId)) {
      const participantRows = (rows as Array<Record<string, unknown>>)
        .filter((r) => r.id === dateId)
        .filter((r) => r.p_alias != null);
      const participants: ParticipantPublic[] = participantRows.map((r) => ({
        id: String(r.p_id),
        alias: String(r.p_alias),
        joinedAt: String(r.p_joined_at),
      }));
      const joinedExcludingCreator = participantRows.filter(
        (r) => r.p_user_token !== row.creator_token
      ).length;
      const spotsLeft = Math.max(0, row.max_participants - 1 - joinedExcludingCreator);
      byId.set(dateId, {
        ...rowToDate(row as unknown as Parameters<typeof rowToDate>[0]),
        participants,
        spotsLeft,
      });
    }
  }
    return [...byId.values()].sort((a, b) => {
      const c = a.date.localeCompare(b.date);
      return c !== 0 ? c : a.timeStart.localeCompare(b.timeStart);
    });
  } catch (e) {
    console.error("listDates error:", e);
    return [];
  }
}

export async function getDateRole(
  dateId: string,
  userToken: string
): Promise<"creator" | "participant" | null> {
  if (!sql) return null;
  const creatorRow = await sql`
    SELECT 1 FROM dates WHERE id = ${dateId} AND creator_token = ${userToken} LIMIT 1
  `;
  if (creatorRow.length > 0) return "creator";
  const participantRow = await sql`
    SELECT 1 FROM participants WHERE lunch_date_id = ${dateId} AND user_token = ${userToken} LIMIT 1
  `;
  if (participantRow.length > 0) return "participant";
  return null;
}

export async function getDate(id: string): Promise<LunchDatePublic | null> {
  if (!sql) return null;
  const rows = await sql`
    SELECT d.*, p.id as p_id, p.alias as p_alias, p.joined_at as p_joined_at, p.user_token as p_user_token
    FROM dates d
    LEFT JOIN participants p ON p.lunch_date_id = d.id
    WHERE d.id = ${id}
  `;
  if (rows.length === 0) return null;
  const row = rows[0] as Record<string, unknown> & { creator_token: string; max_participants: number };
  const participantRows = (rows as Array<Record<string, unknown>>).filter((r) => r.p_alias != null);
  const participants: ParticipantPublic[] = participantRows.map((r) => ({
    id: String(r.p_id),
    alias: String(r.p_alias),
    joinedAt: String(r.p_joined_at),
  }));
  const joinedExcludingCreator = participantRows.filter(
    (r) => r.p_user_token !== row.creator_token
  ).length;
  const spotsLeft = Math.max(0, row.max_participants - 1 - joinedExcludingCreator);
  return {
    ...rowToDate(row as unknown as Parameters<typeof rowToDate>[0]),
    participants,
    spotsLeft,
  };
}

export async function createDate(input: {
  creatorAlias: string;
  creatorToken: string;
  date: string;
  timeStart: string;
  timeEnd?: string;
  restaurantId: string;
  restaurant: { id: string; name: string; latitude: number; longitude: number; cuisine: string };
  topic: string;
  maxParticipants: number;
  meetingPoint?: { latitude: number; longitude: number; description?: string };
}): Promise<LunchDatePublic> {
  if (!sql) throw new Error("Database not configured");
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO dates (
      id, creator_alias, creator_token, date, area, time_start, time_end,
      restaurant_id, restaurant_name, restaurant_lat, restaurant_lng, restaurant_cuisine,
      topic, max_participants, status, created_at,
      meeting_lat, meeting_lng, meeting_description
    ) VALUES (
      ${id}, ${input.creatorAlias}, ${input.creatorToken}, ${input.date}, 'Lindholmen',
      ${input.timeStart}, ${input.timeEnd ?? null}, ${input.restaurantId},
      ${input.restaurant.name}, ${input.restaurant.latitude}, ${input.restaurant.longitude},
      ${input.restaurant.cuisine ?? "restaurant"}, ${input.topic}, ${input.maxParticipants},
      'open', ${new Date().toISOString()},
      ${input.meetingPoint?.latitude ?? null}, ${input.meetingPoint?.longitude ?? null},
      ${input.meetingPoint?.description ?? null}
    )
  `;
  const created = await getDate(id);
  if (!created) throw new Error("Failed to fetch created date");
  return created;
}

export async function cancelDate(
  id: string,
  creatorToken: string
): Promise<boolean> {
  if (!sql) return false;
  const result = await sql`
    UPDATE dates SET status = 'cancelled'
    WHERE id = ${id} AND creator_token = ${creatorToken}
    RETURNING id
  `;
  return Array.isArray(result) && result.length > 0;
}

export async function joinDate(
  id: string,
  alias: string,
  userToken: string
): Promise<{ ok: true; participant: ParticipantPublic } | { ok: false; error: string }> {
  if (!sql) return { ok: false, error: "not_found" };
  const creatorCheck = await sql`
    SELECT creator_token FROM dates WHERE id = ${id} LIMIT 1
  `;
  if (creatorCheck.length > 0 && (creatorCheck[0] as { creator_token: string }).creator_token === userToken) {
    return { ok: false, error: "creator_cannot_join" };
  }
  const date = await getDate(id);
  if (!date) return { ok: false, error: "not_found" };
  if (date.status === "cancelled") return { ok: false, error: "not_open" };
  const existing = await sql`
    SELECT 1 FROM participants WHERE lunch_date_id = ${id} AND user_token = ${userToken} LIMIT 1
  `;
  if (existing.length > 0) return { ok: false, error: "already_joined" };
  const busy = await userHasCommitmentOnDate(userToken, date.date);
  if (busy) return { ok: false, error: "busy_that_day" };
  if (date.spotsLeft === 0) return { ok: false, error: "full" };

  const participantId = crypto.randomUUID();
  const joinedAt = new Date().toISOString();
  await sql`
    INSERT INTO participants (id, lunch_date_id, alias, user_token, joined_at)
    VALUES (${participantId}, ${id}, ${alias}, ${userToken}, ${joinedAt})
  `;
  const newSpotsLeft = date.spotsLeft - 1;
  if (newSpotsLeft === 0) {
    await sql`UPDATE dates SET status = 'full' WHERE id = ${id}`;
  }
  return {
    ok: true,
    participant: { id: participantId, alias, joinedAt },
  };
}

export async function leaveDate(id: string, userToken: string): Promise<boolean> {
  if (!sql) return false;
  const result = await sql`
    DELETE FROM participants
    WHERE lunch_date_id = ${id} AND user_token = ${userToken}
    RETURNING id
  `;
  if (!Array.isArray(result) || result.length === 0) return false;
  await sql`
    UPDATE dates SET status = 'open'
    WHERE id = ${id} AND status = 'full'
  `;
  return true;
}
