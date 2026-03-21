"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAlias, setStoredAlias } from "@/lib/userAlias";
import { hasBookedLunchDate, syncLocalBookingStateWithServer } from "@/lib/bookingState";

export default function SettingsPage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [aliasLocked, setAliasLocked] = useState(false);

  const refreshBookingLock = useCallback(() => {
    setAliasLocked(hasBookedLunchDate());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await syncLocalBookingStateWithServer();
      if (cancelled) return;
      const current = getStoredAlias();
      if (!current) {
        router.replace("/welcome");
        return;
      }
      setAlias(current);
      refreshBookingLock();
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [router, refreshBookingLock]);

  useEffect(() => {
    function onFocus() {
      void syncLocalBookingStateWithServer().then(() => refreshBookingLock());
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshBookingLock]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasBookedLunchDate()) {
      setError("Du kan inte byta alias medan du har en bokad dejt.");
      setAliasLocked(true);
      return;
    }
    const trimmed = alias.trim();
    if (trimmed.length < 1) {
      setError("Alias kan inte vara tomt.");
      return;
    }
    if (trimmed.length > 40) {
      setError("Max 40 tecken.");
      return;
    }
    setStoredAlias(trimmed);
    setSaved(true);
    setError("");
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <Link href="/" className="back-link">
        ← Tillbaka
      </Link>

      <h1 className="page-title">Inställningar</h1>
      <p className="page-subtitle">
        Så här visas du för andra när du skapar eller joinar en dejt. Det sparas
        bara i den här webbläsaren – ingen inloggning.
      </p>

      {aliasLocked && (
        <div
          className="card"
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            marginBottom: "1rem"
          }}
        >
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400e", fontWeight: 500 }}>
            Alias kan inte ändras medan du har en bokad lunchdejt.
          </p>
          <p className="secondary-text" style={{ marginTop: "0.4rem", marginBottom: "0.75rem" }}>
            Andra ser ditt nuvarande alias i dejten. Lämna eller avboka först om du vill byta namn.
          </p>
          <Link href="/my-lunch">
            <button className="secondary-button" type="button" style={{ marginTop: 0 }}>
              Till min lunch
            </button>
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <label className="field-label" htmlFor="settings-alias">
          Alias
        </label>
        <input
          id="settings-alias"
          className="field-input"
          type="text"
          autoComplete="nickname"
          readOnly={aliasLocked}
          aria-readonly={aliasLocked}
          value={alias}
          onChange={(e) => {
            if (aliasLocked) return;
            setAlias(e.target.value);
            setError("");
            setSaved(false);
          }}
          maxLength={40}
          style={aliasLocked ? { background: "#f1f5f9", cursor: "default" } : undefined}
        />
        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" }}>{error}</p>
        )}
        {saved && !aliasLocked && (
          <p style={{ color: "#0f766e", fontSize: "0.875rem", marginTop: "0.5rem", fontWeight: 500 }}>
            Sparat.
          </p>
        )}
        <button className="primary-button" type="submit" disabled={aliasLocked}>
          {aliasLocked ? "Byt alias när du inte har bokad dejt" : "Spara alias"}
        </button>
      </form>
    </div>
  );
}
