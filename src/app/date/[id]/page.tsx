import { Suspense } from "react";
import DateDetailClient from "./DateDetailClient";

function DateDetailFallback() {
  return (
    <div>
      <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
        Loading…
      </p>
    </div>
  );
}

export default function DateDetailPage() {
  return (
    <Suspense fallback={<DateDetailFallback />}>
      <DateDetailClient />
    </Suspense>
  );
}
