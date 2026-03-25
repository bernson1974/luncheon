import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "Bite Club",
    template: "%s · Bite Club",
  },
  description: "Find lunch company on Lindholmen, Gothenburg",
  manifest: "/manifest.webmanifest",
  /** iOS home screen: open without Safari URL bar (with apple-touch-icon). */
  appleWebApp: {
    capable: true,
    title: "Bite Club",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/bite-club-favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e524e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">
        <AuthProvider>
        <main
          className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden px-4 py-6 sm:px-5"
          style={{ maxWidth: "1280px", marginInline: "auto" }}
        >
          <AppShell>{children}</AppShell>
        </main>
        </AuthProvider>
      </body>
    </html>
  );
}

