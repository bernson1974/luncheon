import { cookies } from "next/headers";
import { listDatesForUser } from "@/lib/store";
import { getSessionUser } from "@/lib/auth";
import MyLunchPageClient from "./MyLunchPageClient";

/** Same data source as Map – server reads session, avoids API hitting wrong instance */
export default async function MyLunchPage() {
  const cookieStore = await cookies();
  const sessionUser = await getSessionUser(cookieStore);
  const userToken = sessionUser?.id ?? null;

  const initialDates =
    userToken
      ? await listDatesForUser(userToken)
      : [];

  return <MyLunchPageClient initialDates={initialDates} />;
}
