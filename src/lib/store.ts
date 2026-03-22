import type { LunchDate, Participant, LunchDatePublic, ParticipantPublic } from "./models";
import { getRestaurantById, restaurants } from "./restaurants";
import { isYmdInSelectableLunchWindow, stockholmTodayYmd } from "./lunchDateWindow";

interface StoreData {
  dates: LunchDate[];
  participants: Participant[];
}

const today = stockholmTodayYmd();

const seedDates: LunchDate[] = [
  {
    id: "seed-1",
    creatorAlias: "Maja",
    creatorToken: "seed-token-maja",
    date: today,
    area: "Lindholmen",
    timeStart: "12:00",
    timeEnd: "13:00",
    restaurantId: "krishna-das",
    topic: "Startup culture in Gothenburg",
    maxParticipants: 4,
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    creatorAlias: "Erik",
    creatorToken: "seed-token-erik",
    date: today,
    area: "Lindholmen",
    timeStart: "11:30",
    timeEnd: "12:30",
    restaurantId: "thai-orchid",
    topic: "AI and the future of work",
    maxParticipants: 3,
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-3",
    creatorAlias: "Wictor",
    creatorToken: "seed-token-wictor",
    date: today,
    area: "Lindholmen",
    timeStart: "12:30",
    restaurantId: "smaka",
    topic: "Premier League – matchweek 32",
    maxParticipants: 5,
    status: "open",
    createdAt: new Date().toISOString(),
  },
];

const seedParticipants: Participant[] = [
  {
    id: "seed-p-1",
    lunchDateId: "seed-2",
    alias: "Anna",
    userToken: "seed-token-anna",
    joinedAt: new Date().toISOString(),
  },
];

// globalThis persists across hot-reloads in Next.js dev mode
const g = globalThis as typeof globalThis & { __luncheonStore?: StoreData };

if (!g.__luncheonStore) {
  g.__luncheonStore = {
    dates: [...seedDates],
    participants: [...seedParticipants],
  };
}

export const store = g.__luncheonStore;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function spotsLeft(date: LunchDate, participants: Participant[]): number {
  const joined = participants.filter((p) => p.lunchDateId === date.id).length;
  return Math.max(0, date.maxParticipants - 1 - joined); // -1 for creator
}

function toPublicDate(date: LunchDate, allParticipants: Participant[]): LunchDatePublic {
  const { creatorToken: _ct, ...rest } = date;
  void _ct;

  const restaurant =
    getRestaurantById(date.restaurantId) ??
    restaurants[0];

  const participants: ParticipantPublic[] = allParticipants
    .filter((p) => p.lunchDateId === date.id)
    .map(({ id, alias, joinedAt }) => ({ id, alias, joinedAt }));

  return {
    ...rest,
    restaurant,
    participants,
    spotsLeft: spotsLeft(date, allParticipants),
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** True if user is already host or participant on any non-cancelled date that day. */
export function userHasCommitmentOnDate(userToken: string, ymd: string): boolean {
  for (const d of store.dates) {
    if (d.status === "cancelled" || d.date !== ymd) continue;
    if (d.creatorToken === userToken) return true;
    const joined = store.participants.some(
      (p) => p.lunchDateId === d.id && p.userToken === userToken
    );
    if (joined) return true;
  }
  return false;
}

/** Unique calendar days (YYYY-MM-DD) where the user has an active role. */
export function getCommittedDateYmdsForUser(userToken: string): string[] {
  const set = new Set<string>();
  for (const d of store.dates) {
    if (d.status === "cancelled") continue;
    if (d.creatorToken === userToken) set.add(d.date);
  }
  for (const p of store.participants) {
    if (p.userToken !== userToken) continue;
    const lunch = store.dates.find((ld) => ld.id === p.lunchDateId);
    if (lunch && lunch.status !== "cancelled") set.add(lunch.date);
  }
  return [...set].sort();
}

export function listDates(filters?: {
  time?: string;
  restaurantId?: string;
  topic?: string;
  date?: string;
}): LunchDatePublic[] {
  let dates = store.dates.filter(
    (d) => isYmdInSelectableLunchWindow(d.date) && d.status !== "cancelled"
  );

  if (filters?.date) {
    dates = dates.filter((d) => d.date === filters.date);
  }

  if (filters?.restaurantId) {
    dates = dates.filter((d) => d.restaurantId === filters.restaurantId);
  }
  if (filters?.topic) {
    const q = filters.topic.toLowerCase();
    dates = dates.filter((d) => d.topic.toLowerCase().includes(q));
  }
  if (filters?.time) {
    dates = dates.filter((d) => d.timeStart >= filters.time!);
  }

  return dates
    .sort((a, b) => {
      const c = a.date.localeCompare(b.date);
      return c !== 0 ? c : a.timeStart.localeCompare(b.timeStart);
    })
    .map((d) => toPublicDate(d, store.participants));
}

export function getDate(id: string): LunchDatePublic | null {
  const date = store.dates.find((d) => d.id === id);
  if (!date) return null;
  return toPublicDate(date, store.participants);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function createDate(input: {
  creatorAlias: string;
  creatorToken: string;
  date: string;
  timeStart: string;
  timeEnd?: string;
  restaurantId: string;
  topic: string;
  maxParticipants: number;
  meetingPoint?: { latitude: number; longitude: number; description?: string };
}): LunchDatePublic {
  const date: LunchDate = {
    id: crypto.randomUUID(),
    area: "Lindholmen",
    status: "open",
    createdAt: new Date().toISOString(),
    ...input,
  };
  store.dates.push(date);
  return toPublicDate(date, store.participants);
}

export function cancelDate(id: string, creatorToken: string): boolean {
  const date = store.dates.find((d) => d.id === id);
  if (!date || date.creatorToken !== creatorToken) return false;
  date.status = "cancelled";
  return true;
}

export function joinDate(
  id: string,
  alias: string,
  userToken: string
): { ok: true; participant: ParticipantPublic } | { ok: false; error: string } {
  const date = store.dates.find((d) => d.id === id);
  if (!date) return { ok: false, error: "not_found" };
  if (date.status !== "open") return { ok: false, error: "not_open" };

  const alreadyJoined = store.participants.some(
    (p) => p.lunchDateId === id && p.userToken === userToken
  );
  if (alreadyJoined) return { ok: false, error: "already_joined" };

  if (userHasCommitmentOnDate(userToken, date.date)) {
    return { ok: false, error: "busy_that_day" };
  }

  if (spotsLeft(date, store.participants) === 0) {
    return { ok: false, error: "full" };
  }

  const participant: Participant = {
    id: crypto.randomUUID(),
    lunchDateId: id,
    alias,
    userToken,
    joinedAt: new Date().toISOString(),
  };
  store.participants.push(participant);

  // Update status to full if no spots remain
  if (spotsLeft(date, store.participants) === 0) {
    date.status = "full";
  }

  return { ok: true, participant: { id: participant.id, alias, joinedAt: participant.joinedAt } };
}

export function leaveDate(
  id: string,
  userToken: string
): boolean {
  const idx = store.participants.findIndex(
    (p) => p.lunchDateId === id && p.userToken === userToken
  );
  if (idx === -1) return false;

  store.participants.splice(idx, 1);

  // Re-open if it was full
  const date = store.dates.find((d) => d.id === id);
  if (date && date.status === "full") {
    date.status = "open";
  }

  return true;
}
