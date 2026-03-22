import "./globals.css";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import AppShell from "@/components/AppShell";
import SyncUserTokenCookie from "@/components/SyncUserTokenCookie";

export const metadata = {
  title: "Luncheon · Lindholmen",
  description: "Find lunch company on Lindholmen, Gothenburg"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">
        <SyncUserTokenCookie />
        <main
          className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden px-4 py-6"
          style={{ maxWidth: "1280px", marginInline: "auto" }}
        >
          <AppShell>{children}</AppShell>
        </main>
      </body>
    </html>
  );
}

