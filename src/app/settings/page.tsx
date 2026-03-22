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
      setError("You can’t change your display name while you have an active lunch booking.");
      setAliasLocked(true);
      return;
    }
    const trimmed = alias.trim();
    if (trimmed.length < 1) {
      setError("Display name can’t be empty.");
      return;
    }
    if (trimmed.length > 40) {
      setError("Max 40 characters.");
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
        ← Back
      </Link>

      <h1 className="page-title">Name</h1>
      <p className="page-subtitle">
        This is how others see you when you create or join a date. It’s stored only
        in this browser — no account.
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
            You can’t change your display name while you have an active lunch booking.
          </p>
          <p className="secondary-text" style={{ marginTop: "0.4rem", marginBottom: "0.75rem" }}>
            Others see your current name on the date. Leave or cancel first if you want to change it.
          </p>
          <Link href="/my-lunch" className="secondary-button" style={{ marginTop: 0 }}>
            Go to My Bites
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <label className="field-label" htmlFor="settings-alias">
          Display name
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
            Saved.
          </p>
        )}
        <button className="primary-button" type="submit" disabled={aliasLocked}>
          {aliasLocked ? "Change name when you have no booking" : "Save display name"}
        </button>
      </form>
    </div>
  );
}
