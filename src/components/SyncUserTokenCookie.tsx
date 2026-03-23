"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setUserTokenCookie } from "@/lib/userTokenCookie";

/** Sync userToken to cookie so server can use it for listDatesForUser (My Bites). Re-sync on nav so cookie stays current. */
export default function SyncUserTokenCookie() {
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) setUserTokenCookie(token);
  }, [pathname]);

  return null;
}
