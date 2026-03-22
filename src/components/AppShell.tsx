"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAlias } from "@/lib/userAlias";

const PUBLIC_PATHS = new Set(["/welcome"]);

const MAIN_TABS: {
  href: string;
  label: string;
  isActive: (path: string) => boolean;
}[] = [
  { href: "/", label: "Map", isActive: (p) => p === "/" },
  { href: "/my-lunch", label: "My Bites", isActive: (p) => p === "/my-lunch" },
  { href: "/create", label: "Invite", isActive: (p) => p === "/create" },
  {
    href: "/browse",
    label: "Join",
    isActive: (p) => p.startsWith("/browse") || p.startsWith("/date/"),
  },
  { href: "/settings", label: "Name", isActive: (p) => p === "/settings" },
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

  return (
    <>
      <header className="app-shell-header">
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
                <span className="app-tab-bar__tab__icon-slot" aria-hidden />
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
