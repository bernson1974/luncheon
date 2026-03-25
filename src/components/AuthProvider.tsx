"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchMe, type AuthUser } from "@/lib/authClient";

const AuthContext = createContext<{
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const u = await fetchMe();
    setUser(u);
  };

  useEffect(() => {
    fetchMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  /** Synka med session-cookie om användaren byter konto i annan flik eller efter utloggning. */
  useEffect(() => {
    function onFocus() {
      void fetchMe().then((u) => setUser(u));
    }
    function onVisibility() {
      if (document.visibilityState === "visible") void fetchMe().then((u) => setUser(u));
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
