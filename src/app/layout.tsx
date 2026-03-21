import "./globals.css";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Lindholmen Lunch",
  description: "Here-and-now lunch matching on Lindholmen"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <main
          className="flex min-h-screen w-full flex-col px-4 py-6"
          style={{ maxWidth: "1280px", marginInline: "auto" }}
        >
          <AppShell>{children}</AppShell>
        </main>
      </body>
    </html>
  );
}

