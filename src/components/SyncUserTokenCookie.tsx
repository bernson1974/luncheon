"use client";

import { useEffect } from "react";
import { setUserTokenCookie } from "@/lib/userTokenCookie";

/** Sync userToken to cookie so server can use it for listDatesForUser (My Bites). */
export default function SyncUserTokenCookie() {
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) setUserTokenCookie(token);
  }, []);
  return null;
}
