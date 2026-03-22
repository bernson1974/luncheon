import { cookies } from "next/headers";
import { listDatesForUser } from "@/lib/store";
import MyLunchPageClient from "./MyLunchPageClient";

/** Same data source as Map – server reads cookie, avoids API hitting wrong instance */
export default async function MyLunchPage() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("luncheon_user_token");
  const userToken = tokenCookie?.value ? decodeURIComponent(tokenCookie.value) : null;

  const initialDates =
    userToken
      ? listDatesForUser(userToken)
      : [];

  return <MyLunchPageClient initialDates={initialDates} />;
}
