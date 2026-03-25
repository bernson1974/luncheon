import { Suspense } from "react";
import { listDates } from "@/lib/store";
import BrowsePageClient from "./BrowsePageClient";

/** Måste vara dynamisk annars fryses dejtlistan vid build / statisk cache (nya dejter syns inte). */
export const dynamic = "force-dynamic";

function BrowseFallback() {
  return (
    <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
      Loading…
    </p>
  );
}

/** Same data source as Map – server-rendered, avoids API route hitting wrong instance */
export default async function BrowsePage() {
  const allDates = await listDates();
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowsePageClient initialDates={allDates} />
    </Suspense>
  );
}
