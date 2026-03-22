import { Suspense } from "react";
import { listDates } from "@/lib/store";
import BrowsePageClient from "./BrowsePageClient";

function BrowseFallback() {
  return (
    <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
      Loading…
    </p>
  );
}

/** Same data source as Map – server-rendered, avoids API route hitting wrong instance */
export default function BrowsePage() {
  const allDates = listDates();
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowsePageClient initialDates={allDates} />
    </Suspense>
  );
}
