"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Notice = { id: string; body: string; lunchDateId: string | null; createdAt: string };

export default function InAppNotificationBanner() {
  const pathname = usePathname();
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

  const dismiss = (ids: string[]) => {
    if (ids.length === 0) return;
    fetch("/api/user/notifications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then(() => load())
      .catch(() => {});
  };

  if (notices.length === 0) return null;

  return (
    <div className="in-app-notification-stack" role="region" aria-label="Notifications">
      {notices.map((n) => (
        <div key={n.id} className="in-app-notification">
          <p className="in-app-notification__body">{n.body}</p>
          <div className="in-app-notification__actions">
            {n.lunchDateId ? (
              <a href={`/date/${encodeURIComponent(n.lunchDateId)}`} className="secondary-button in-app-notification__link">
                View details
              </a>
            ) : null}
            <button
              type="button"
              className="primary-button in-app-notification__dismiss"
              onClick={() => dismiss([n.id])}
            >
              OK
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
