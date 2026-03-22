import { Suspense } from "react";
import BrowsePageClient from "./BrowsePageClient";

function BrowseFallback() {
  return (
    <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
      Loading…
    </p>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowsePageClient />
    </Suspense>
  );
}
