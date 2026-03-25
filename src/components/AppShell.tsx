"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import InAppNotificationBanner from "@/components/InAppNotificationBanner";

const PUBLIC_PATHS = new Set(["/welcome"]);

const MAIN_TABS: {
  href: string;
  label: string;
  icon?: string;
  isActive: (path: string) => boolean;
}[] = [
  { href: "/", label: "Find", icon: "/map.svg", isActive: (p) => p === "/" },
  { href: "/my-lunch", label: "My Bites", icon: "/burger.svg", isActive: (p) => p === "/my-lunch" },
  { href: "/create", label: "Invite", icon: "/invite.svg", isActive: (p) => p === "/create" },
  {
    href: "/browse",
    label: "Join",
    icon: "/hands.svg",
    isActive: (p) => p.startsWith("/browse") || p.startsWith("/date/"),
  },
  { href: "/settings", label: "Settings", icon: "/face.svg", isActive: (p) => p === "/settings" },
];

/** Per-ikon CSS-modifierare (samma viewBox men olika visuell tyngd i SVG:erna) */
const TAB_ICON_CLASS: Record<string, string> = {
  "/map.svg": "app-tab-bar__tab__icon--find",
  "/burger.svg": "app-tab-bar__tab__icon--bites",
  "/invite.svg": "app-tab-bar__tab__icon--invite",
  "/hands.svg": "app-tab-bar__tab__icon--hands",
  "/face.svg": "app-tab-bar__tab__icon--face",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.has(pathname ?? "");
    if (loading) return;
    if (!user && !isPublic) router.replace("/welcome");
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="app-shell-loading" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        Loading…
      </div>
    );
  }

  if (PUBLIC_PATHS.has(pathname ?? "")) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="app-shell-loading" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        Redirecting…
      </div>
    );
  }

  const path = pathname ?? "";
  /** Map, My Bites, Join: undertabbar (dagar / filter) direkt under huvudtabbar */
  const flushSubtabsUnderMain =
    path === "/" || path === "/my-lunch" || path === "/browse";

  const activeTabIndex = MAIN_TABS.findIndex((t) => t.isActive(path));
  const safeIndex = activeTabIndex >= 0 ? activeTabIndex : 0;

  return (
    <>
      <header
        className={`app-shell-header${flushSubtabsUnderMain ? " app-shell-header--flush-subtabs" : ""}`}
        data-active-tab-index={safeIndex}
      >
        <nav className="app-tab-bar" aria-label="Main navigation">
          {MAIN_TABS.map((tab) => {
            const active = tab.isActive(path);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`app-tab-bar__tab${active ? " app-tab-bar__tab--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="app-tab-bar__tab__icon-slot" aria-hidden>
                  {tab.icon && (
                    <span
                      className={[
                        "app-tab-bar__tab__icon",
                        tab.icon ? TAB_ICON_CLASS[tab.icon] : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        WebkitMaskImage: `url(${tab.icon})`,
                        maskImage: `url(${tab.icon})`,
                      }}
                    />
                  )}
                </span>
                <span className="app-tab-bar__tab__label">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <Suspense fallback={null}>
        <InAppNotificationBanner />
      </Suspense>
      {children}
    </>
  );
}
