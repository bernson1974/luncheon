"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAlias } from "@/lib/userAlias";

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
  { href: "/settings", label: "Name", icon: "/face.svg", isActive: (p) => p === "/settings" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const alias = getStoredAlias();
    const isPublic = PUBLIC_PATHS.has(pathname ?? "");

    if (!alias && !isPublic) {
      router.replace("/welcome");
      setReady(true);
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="app-shell-loading" style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        Loading…
      </div>
    );
  }

  if (PUBLIC_PATHS.has(pathname ?? "")) {
    return <>{children}</>;
  }

  if (!getStoredAlias()) {
    return null;
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
                      className={`app-tab-bar__tab__icon${tab.icon === "/hands.svg" ? " app-tab-bar__tab__icon--hands" : ""}${tab.icon === "/face.svg" ? " app-tab-bar__tab__icon--face" : ""}`}
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
      {children}
    </>
  );
}
