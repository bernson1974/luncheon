import { Suspense } from "react";
import CreatePageClient from "./CreatePageClient";

function CreateFallback() {
  return (
    <p className="secondary-text" style={{ textAlign: "center", paddingTop: "2rem" }}>
      Loading…
    </p>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<CreateFallback />}>
      <CreatePageClient />
    </Suspense>
  );
}
