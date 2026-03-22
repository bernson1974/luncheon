export type Cuisine =
  | "indian"
  | "thai"
  | "swedish"
  | "japanese"
  | "pizza"
  | "burgers"
  | "asian"
  | string;

export interface RestaurantOpeningInterval {
  start: string; // "11:00"
  end: string;   // "14:30"
}

export interface RestaurantOpeningHours {
  [weekday: string]: RestaurantOpeningInterval[];
}

export interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  cuisine: Cuisine;
  openingHours: RestaurantOpeningHours;
}

export type LunchDateStatus = "open" | "full" | "cancelled";

export interface MeetingPoint {
  latitude: number;
  longitude: number;
  description?: string; // e.g. "Red bench outside the entrance"
}

export interface LunchDate {
  id: string;
  creatorAlias: string;
  creatorToken: string; // stored server-side only, never sent to clients
  date: string;         // "YYYY-MM-DD"
  area: "Lindholmen";
  timeStart: string;    // "HH:MM"
  timeEnd?: string;     // "HH:MM", optional
  restaurantId: string;
  topic: string;
  maxParticipants: number; // total, including creator
  status: LunchDateStatus;
  createdAt: string;    // ISO timestamp
  meetingPoint?: MeetingPoint;
}

// Safe version sent to clients (no creatorToken)
export interface LunchDatePublic extends Omit<LunchDate, "creatorToken"> {
  restaurant: Restaurant;
  participants: ParticipantPublic[];
  spotsLeft: number;
}

export interface Participant {
  id: string;
  lunchDateId: string;
  alias: string;
  userToken: string; // stored server-side only, never sent to clients
  joinedAt: string;
}

export interface ParticipantPublic {
  id: string;
  alias: string;
  joinedAt: string;
}
