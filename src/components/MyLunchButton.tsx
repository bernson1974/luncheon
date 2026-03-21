"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { syncLocalBookingStateWithServer } from "@/lib/bookingState";

export default function MyLunchButton() {
  const [hasLunch, setHasLunch] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const active = await syncLocalBookingStateWithServer();
      if (!cancelled) setHasLunch(active);
    }

    void run();

    function onFocus() {
      void run();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!hasLunch) return null;

  return (
    <Link href="/my-lunch" className="home-cta-card" style={{ borderColor: "#0f766e", background: "#f0fdfa" }}>
      <div className="home-cta-title" style={{ color: "#0f766e" }}>Min lunch idag</div>
      <div className="home-cta-desc">
        Se din planerade lunchdejt, mötesplats och vilka som är med.
      </div>
    </Link>
  );
}
