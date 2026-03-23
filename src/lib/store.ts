import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { LunchDate, Participant, LunchDatePublic, ParticipantPublic } from "./models";
import { getRestaurantById, restaurants } from "./restaurants";
import { isYmdInSelectableLunchWindow, LUNCH_TIMEZONE, stockholmTodayYmd } from "./lunchDateWindow";

interface StoreData {
  dates: LunchDate[];
  participants: Participant[];
}

const today = stockholmTodayYmd();
function ymdAt(dayOffset: number): string {
  const noon = fromZonedTime(`${today}T12:00:00`, LUNCH_TIMEZONE);
  return formatInTimeZone(addDays(noon, dayOffset), LUNCH_TIMEZONE, "yyyy-MM-dd");
}
const d0 = today;
const d1 = ymdAt(1);
const d2 = ymdAt(2);
const d3 = ymdAt(3);
const d4 = ymdAt(4);
const d5 = ymdAt(5);

const seedDates: LunchDate[] = [
  {
    id: "seed-1",
    creatorAlias: "Maja",
    creatorToken: "seed-token-maja",
    date: d0,
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
    date: d0,
    area: "Lindholmen",
    timeStart: "11:30",
    timeEnd: "12:30",
    restaurantId: "thai-orchid",
    topic: "AI and the future of work",
    maxParticipants: 3,
    status: "full",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-3",
    creatorAlias: "Wictor",
    creatorToken: "seed-token-wictor",
    date: d0,
    area: "Lindholmen",
    timeStart: "12:30",
    restaurantId: "smaka",
    topic: "Premier League – matchweek 32",
    maxParticipants: 5,
    status: "open",
    createdAt: new Date().toISOString(),
  },
  // Dag 0 – fler
  { id: "seed-4", creatorAlias: "Linnea", creatorToken: "seed-linnea", date: d0, area: "Lindholmen", timeStart: "11:45", restaurantId: "sushirullen", topic: "UX design trends 2025", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-5", creatorAlias: "Marcus", creatorToken: "seed-marcus", date: d0, area: "Lindholmen", timeStart: "12:15", restaurantId: "wok-of-fame", topic: "Remote work best practices", maxParticipants: 3, status: "full", createdAt: new Date().toISOString() },
  { id: "seed-6", creatorAlias: "Sofia", creatorToken: "seed-sofia", date: d0, area: "Lindholmen", timeStart: "12:00", restaurantId: "leos-lunchbar", topic: "Sustainability in tech", maxParticipants: 5, status: "open", createdAt: new Date().toISOString() },
  // Dag 1 – ingen tom dag
  { id: "seed-7", creatorAlias: "Johan", creatorToken: "seed-johan", date: d1, area: "Lindholmen", timeStart: "12:00", restaurantId: "krishna-das", topic: "Product management", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-8", creatorAlias: "Emma", creatorToken: "seed-emma", date: d1, area: "Lindholmen", timeStart: "11:30", restaurantId: "thai-orchid", topic: "Career growth", maxParticipants: 3, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-9", creatorAlias: "Oscar", creatorToken: "seed-oscar", date: d1, area: "Lindholmen", timeStart: "12:30", restaurantId: "lindholmen-pizza", topic: "Frontend frameworks", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-10", creatorAlias: "Ingrid", creatorToken: "seed-ingrid", date: d1, area: "Lindholmen", timeStart: "12:00", restaurantId: "smaka", topic: "Nordic tech scene", maxParticipants: 5, status: "full", createdAt: new Date().toISOString() },
  // Dag 2 – tom (inga dejter)
  // Dag 3
  { id: "seed-11", creatorAlias: "Felix", creatorToken: "seed-felix", date: d3, area: "Lindholmen", timeStart: "12:00", restaurantId: "krishna-das", topic: "Machine learning", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-12", creatorAlias: "Klara", creatorToken: "seed-klara", date: d3, area: "Lindholmen", timeStart: "11:45", restaurantId: "sushirullen", topic: "Work-life balance", maxParticipants: 3, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-13", creatorAlias: "Viktor", creatorToken: "seed-viktor", date: d3, area: "Lindholmen", timeStart: "12:15", restaurantId: "wok-of-fame", topic: "Agile methodologies", maxParticipants: 5, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-14", creatorAlias: "Nora", creatorToken: "seed-nora", date: d3, area: "Lindholmen", timeStart: "12:30", restaurantId: "leos-lunchbar", topic: "Startup funding", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  // Dag 4 – tom (inga dejter)
  // Dag 5
  { id: "seed-15", creatorAlias: "Albin", creatorToken: "seed-albin", date: d5, area: "Lindholmen", timeStart: "12:00", restaurantId: "krishna-das", topic: "Cloud architecture", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-16", creatorAlias: "Ebba", creatorToken: "seed-ebba", date: d5, area: "Lindholmen", timeStart: "11:30", restaurantId: "thai-orchid", topic: "Digital nomads", maxParticipants: 3, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-17", creatorAlias: "Leo", creatorToken: "seed-leo", date: d5, area: "Lindholmen", timeStart: "12:00", restaurantId: "smaka", topic: "Swedish fika culture", maxParticipants: 5, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-18", creatorAlias: "Mira", creatorToken: "seed-mira", date: d5, area: "Lindholmen", timeStart: "12:15", restaurantId: "lindholmen-pizza", topic: "Innovation in gaming", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  // Fler på d0 och d1 för variation
  { id: "seed-19", creatorAlias: "Henrik", creatorToken: "seed-henrik", date: d0, area: "Lindholmen", timeStart: "12:45", restaurantId: "lindholmen-pizza", topic: "Cybersecurity", maxParticipants: 3, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-20", creatorAlias: "Sara", creatorToken: "seed-sara", date: d1, area: "Lindholmen", timeStart: "12:45", restaurantId: "sushirullen", topic: "Mindfulness at work", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-21", creatorAlias: "Daniel", creatorToken: "seed-daniel", date: d1, area: "Lindholmen", timeStart: "11:45", restaurantId: "wok-of-fame", topic: "Leadership styles", maxParticipants: 5, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-22", creatorAlias: "Alice", creatorToken: "seed-alice", date: d3, area: "Lindholmen", timeStart: "11:30", restaurantId: "thai-orchid", topic: "AI ethics", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-23", creatorAlias: "Gustav", creatorToken: "seed-gustav", date: d3, area: "Lindholmen", timeStart: "12:45", restaurantId: "lindholmen-pizza", topic: "Open source contributions", maxParticipants: 3, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-24", creatorAlias: "Tilde", creatorToken: "seed-tilde", date: d5, area: "Lindholmen", timeStart: "11:45", restaurantId: "sushirullen", topic: "Climate tech", maxParticipants: 4, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-25", creatorAlias: "Lucas", creatorToken: "seed-lucas", date: d5, area: "Lindholmen", timeStart: "12:30", restaurantId: "leos-lunchbar", topic: "Mobile development", maxParticipants: 5, status: "open", createdAt: new Date().toISOString() },
  { id: "seed-26", creatorAlias: "Elin", creatorToken: "seed-elin", date: d5, area: "Lindholmen", timeStart: "12:45", restaurantId: "wok-of-fame", topic: "Content creation", maxParticipants: 3, status: "open", createdAt: new Date().toISOString() },
];

// Restauranger utan dejter: burgery, paj-och-mer, chalmers-karen
// Dagar helt tomma: d2, d4

// ~50% av dejterna har 1 plats kvar (seed-1,3,4,6,7,8,9,11,12,13,14,15,16)
const seedParticipants: Participant[] = [
  { id: "seed-p-1", lunchDateId: "seed-2", alias: "Anna", userToken: "seed-token-anna", joinedAt: new Date().toISOString() },
  { id: "seed-p-2", lunchDateId: "seed-2", alias: "Peter", userToken: "seed-token-peter", joinedAt: new Date().toISOString() },
  { id: "seed-p-3", lunchDateId: "seed-5", alias: "Lisa", userToken: "seed-token-lisa", joinedAt: new Date().toISOString() },
  { id: "seed-p-4", lunchDateId: "seed-5", alias: "David", userToken: "seed-token-david", joinedAt: new Date().toISOString() },
  { id: "seed-p-6", lunchDateId: "seed-10", alias: "Simon", userToken: "seed-token-simon", joinedAt: new Date().toISOString() },
  { id: "seed-p-7", lunchDateId: "seed-10", alias: "Moa", userToken: "seed-token-moa", joinedAt: new Date().toISOString() },
  { id: "seed-p-8", lunchDateId: "seed-10", alias: "Axel", userToken: "seed-token-axel", joinedAt: new Date().toISOString() },
  { id: "seed-p-9", lunchDateId: "seed-10", alias: "Ida", userToken: "seed-token-ida", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-1 (max 4)
  { id: "seed-p-10", lunchDateId: "seed-1", alias: "Olof", userToken: "seed-token-olof", joinedAt: new Date().toISOString() },
  { id: "seed-p-11", lunchDateId: "seed-1", alias: "Karin", userToken: "seed-token-karin", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-3 (max 5)
  { id: "seed-p-12", lunchDateId: "seed-3", alias: "Rasmus", userToken: "seed-token-rasmus", joinedAt: new Date().toISOString() },
  { id: "seed-p-13", lunchDateId: "seed-3", alias: "Hanna", userToken: "seed-token-hanna", joinedAt: new Date().toISOString() },
  { id: "seed-p-14", lunchDateId: "seed-3", alias: "Jonas", userToken: "seed-token-jonas", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-4 (max 4)
  { id: "seed-p-15", lunchDateId: "seed-4", alias: "Amanda", userToken: "seed-token-amanda", joinedAt: new Date().toISOString() },
  { id: "seed-p-16", lunchDateId: "seed-4", alias: "Erik", userToken: "seed-token-erik2", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-6 (max 5)
  { id: "seed-p-17", lunchDateId: "seed-6", alias: "Mattias", userToken: "seed-token-mattias", joinedAt: new Date().toISOString() },
  { id: "seed-p-18", lunchDateId: "seed-6", alias: "Frida", userToken: "seed-token-frida", joinedAt: new Date().toISOString() },
  { id: "seed-p-19", lunchDateId: "seed-6", alias: "Emil", userToken: "seed-token-emil", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-7 (max 4)
  { id: "seed-p-20", lunchDateId: "seed-7", alias: "Maria", userToken: "seed-token-maria", joinedAt: new Date().toISOString() },
  { id: "seed-p-21", lunchDateId: "seed-7", alias: "Andreas", userToken: "seed-token-andreas", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-8 (max 3)
  { id: "seed-p-22", lunchDateId: "seed-8", alias: "Julia", userToken: "seed-token-julia", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-9 (max 4)
  { id: "seed-p-23", lunchDateId: "seed-9", alias: "Lukas", userToken: "seed-token-lukas", joinedAt: new Date().toISOString() },
  { id: "seed-p-24", lunchDateId: "seed-9", alias: "Selma", userToken: "seed-token-selma", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-11 (max 4)
  { id: "seed-p-25", lunchDateId: "seed-11", alias: "Oskar", userToken: "seed-token-oskar", joinedAt: new Date().toISOString() },
  { id: "seed-p-26", lunchDateId: "seed-11", alias: "Malin", userToken: "seed-token-malin", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-12 (max 3)
  { id: "seed-p-27", lunchDateId: "seed-12", alias: "Filip", userToken: "seed-token-filip", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-13 (max 5)
  { id: "seed-p-28", lunchDateId: "seed-13", alias: "Petra", userToken: "seed-token-petra", joinedAt: new Date().toISOString() },
  { id: "seed-p-29", lunchDateId: "seed-13", alias: "Fredrik", userToken: "seed-token-fredrik", joinedAt: new Date().toISOString() },
  { id: "seed-p-30", lunchDateId: "seed-13", alias: "Signe", userToken: "seed-token-signe", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-14 (max 4)
  { id: "seed-p-31", lunchDateId: "seed-14", alias: "Viktor", userToken: "seed-token-viktor2", joinedAt: new Date().toISOString() },
  { id: "seed-p-32", lunchDateId: "seed-14", alias: "Amelie", userToken: "seed-token-amelie", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-15 (max 4)
  { id: "seed-p-33", lunchDateId: "seed-15", alias: "Anton", userToken: "seed-token-anton", joinedAt: new Date().toISOString() },
  { id: "seed-p-34", lunchDateId: "seed-15", alias: "Lovisa", userToken: "seed-token-lovisa", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-16 (max 3)
  { id: "seed-p-35", lunchDateId: "seed-16", alias: "Emilia", userToken: "seed-token-emilia", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-17 (max 5) – d5/28 mars
  { id: "seed-p-36", lunchDateId: "seed-17", alias: "Adam", userToken: "seed-token-adam", joinedAt: new Date().toISOString() },
  { id: "seed-p-37", lunchDateId: "seed-17", alias: "Bella", userToken: "seed-token-bella", joinedAt: new Date().toISOString() },
  { id: "seed-p-38", lunchDateId: "seed-17", alias: "Carl", userToken: "seed-token-carl", joinedAt: new Date().toISOString() },
  // 1 plats kvar: seed-18 (max 4) – d5/28 mars
  { id: "seed-p-39", lunchDateId: "seed-18", alias: "Dina", userToken: "seed-token-dina", joinedAt: new Date().toISOString() },
  { id: "seed-p-40", lunchDateId: "seed-18", alias: "Erik", userToken: "seed-token-erik3", joinedAt: new Date().toISOString() },
];

// globalThis persists across hot-reloads in Next.js dev mode
const g = globalThis as typeof globalThis & { __luncheonStore?: StoreData };

if (!g.__luncheonStore) {
  g.__luncheonStore = {
    dates: [...seedDates],
    participants: [...seedParticipants],
  };
}

const store = g.__luncheonStore;

// Backfill new seed participants on hot reload (store persists, seed may have grown)
const storeIds = new Set(store.participants.map((p) => p.id));
for (const p of seedParticipants) {
  if (!storeIds.has(p.id)) {
    store.participants.push(p);
  }
}

export { store };

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

export type UserDateRole = "creator" | "participant";

/** Dates where the user is creator or participant. For My Bites, works across sessions. */
export function listDatesForUser(userToken: string): (LunchDatePublic & { role: UserDateRole })[] {
  const result: (LunchDatePublic & { role: UserDateRole })[] = [];
  for (const d of store.dates) {
    if (d.status === "cancelled" || !isYmdInSelectableLunchWindow(d.date)) continue;
    if (d.creatorToken === userToken) {
      const pub = getDate(d.id);
      if (pub) result.push({ ...pub, role: "creator" });
    }
  }
  for (const p of store.participants) {
    if (p.userToken !== userToken) continue;
    const lunch = store.dates.find((ld) => ld.id === p.lunchDateId);
    if (lunch && lunch.status !== "cancelled" && isYmdInSelectableLunchWindow(lunch.date)) {
      const pub = getDate(lunch.id);
      if (pub && !result.some((r) => r.id === pub.id)) {
        result.push({ ...pub, role: "participant" });
      }
    }
  }
  return result.sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    return c !== 0 ? c : a.timeStart.localeCompare(b.timeStart);
  });
}

export function listDates(filters?: {
  time?: string;
  restaurantId?: string;
  topic?: string;
  date?: string;
  cuisine?: string;
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
  if (filters?.cuisine) {
    dates = dates.filter((d) => {
      const r = getRestaurantById(d.restaurantId);
      return r?.cuisine === filters.cuisine;
    });
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
