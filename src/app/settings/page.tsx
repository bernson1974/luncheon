"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAlias, setStoredAlias } from "@/lib/userAlias";
import { hasBookedLunchDate, syncLocalBookingStateWithServer } from "@/lib/bookingState";
import { clearAppData } from "@/lib/clearAppData";

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

  function handleSubmit(e: FormEvent) {
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
      <h1 className="page-title" style={{ color: "#064e3b" }}>Name</h1>
      <p className="page-subtitle" style={{ color: "#064e3b" }}>
        This is how others see you when you create or join a date. It’s stored only
        in this browser — no account.
      </p>

      {aliasLocked && (
        <div style={{ maxWidth: "17.5rem", marginLeft: "auto", marginRight: "auto", marginTop: "1rem" }}>
          <p
            style={{
              color: "#b91c1c",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
              textAlign: "center"
            }}
          >
            You can’t change your display name while you have an active lunch booking. Leave or cancel first if you want to change it.
          </p>
          <Link href="/my-lunch" className="secondary-button btn-dark-green">
            Go to My Bites
          </Link>
        </div>
      )}

      {!aliasLocked && (
        <form onSubmit={handleSubmit} className="settings-form-bare">
          <label className="welcome-landing__name-label" htmlFor="settings-alias" style={{ textAlign: "left" }}>
            Display name
          </label>
          <input
            id="settings-alias"
            className="welcome-landing__field"
            type="text"
            autoComplete="nickname"
            value={alias}
            onChange={(e) => {
              setAlias(e.target.value);
              setError("");
              setSaved(false);
            }}
            maxLength={40}
          />
          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" }}>{error}</p>
          )}
          {saved && (
            <p style={{ color: "#0f766e", fontSize: "0.875rem", marginTop: "0.5rem", fontWeight: 500 }}>
              Saved.
            </p>
          )}
          <button className="primary-button" type="submit">
            Save display name
          </button>
        </form>
      )}

      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e2e8f0" }}>
        <p className="secondary-text" style={{ marginBottom: "0.5rem" }}>
          Having trouble with cached data? Reset clears name, token and bookings from this browser.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            if (confirm("Clear all data and start over? You'll need to enter your name again.")) {
              clearAppData();
              router.replace("/welcome");
            }
          }}
        >
          Reset app data
        </button>
      </div>
    </div>
  );
}
