"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Notice = { id: string; body: string; lunchDateId: string | null; createdAt: string };

export default function InAppNotificationBanner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);

  const load = useCallback(() => {
    fetch("/api/user/notifications", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { notifications?: Notice[] } | null) => {
        setNotices(data?.notifications ?? []);
      })
      .catch(() => setNotices([]));
  }, []);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  const markRead = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      fetch("/api/user/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
        .then(() => load())
        .catch(() => {});
    },
    [load]
  );

  const current = notices[0];
  if (!current) return null;

  const onDetailsPath =
    current.lunchDateId != null &&
    pathname === `/date/${current.lunchDateId}` &&
    searchParams.get("notice") === current.id;

  if (onDetailsPath) return null;

  function handleSeeDetails() {
    if (!current.lunchDateId) return;
    router.push(`/date/${encodeURIComponent(current.lunchDateId)}?notice=${encodeURIComponent(current.id)}`);
  }

  return (
    <div className="in-app-notification-modal-backdrop">
      <div
        className="in-app-notification-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="in-app-notification-modal-title"
      >
        <p id="in-app-notification-modal-title" className="in-app-notification-modal__body">
          {current.body}
        </p>
        <div className="in-app-notification-modal__actions">
          <button
            type="button"
            className="in-app-notification-modal__btn in-app-notification-modal__btn--primary"
            onClick={() => markRead([current.id])}
          >
            OK
          </button>
          {current.lunchDateId ? (
            <button
              type="button"
              className="in-app-notification-modal__btn in-app-notification-modal__btn--secondary"
              onClick={handleSeeDetails}
            >
              See details
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
