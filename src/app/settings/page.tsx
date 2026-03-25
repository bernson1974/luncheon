"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { logout, deleteAccount } from "@/lib/authClient";

export default function SettingsPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [alias, setAlias] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [aliasLocked, setAliasLocked] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refreshBookingLock = useCallback(async () => {
    try {
      const res = await fetch("/api/user/dates", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { dates?: Array<{ status?: string }> };
      const hasBooking = (data.dates ?? []).some(
        (d) => d.status !== "cancelled"
      );
      setAliasLocked(hasBooking);
    } catch {
      setAliasLocked(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setAlias(user.alias);
      void refreshBookingLock();
    }
  }, [user, refreshBookingLock]);

  useEffect(() => {
    function onFocus() {
      void refreshBookingLock();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshBookingLock]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (aliasLocked) {
      setError("You can't change your display name while you have an active lunch booking.");
      setAliasLocked(true);
      return;
    }
    const trimmed = alias.trim();
    if (trimmed.length < 1) {
      setError("Display name can't be empty.");
      return;
    }
    if (trimmed.length > 40) {
      setError("Max 40 characters.");
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ alias: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Could not update.");
        return;
      }
      await refresh();
      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not update. Try again.");
    }
  }

  async function handleLogout() {
    setShowResetConfirm(false);
    await logout();
    await refresh();
    router.replace("/welcome");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.ok) {
        window.location.replace("/welcome");
      } else {
        setError(result.error);
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("Could not delete account.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="page-title" style={{ color: "#064e3b" }}>Name{user.alias ? ` (${user.alias})` : ""}</h1>
      <p className="page-subtitle" style={{ color: "#064e3b" }}>
        This is how others see you when you create or join a date.
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
            You can&apos;t change your display name while you have an active lunch booking. Leave or cancel first.
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

      <div style={{ marginTop: "2rem" }}>
        <h2 className="page-title" style={{ color: "#064e3b" }}>Account</h2>
        <p className="page-subtitle" style={{ color: "#064e3b" }}>
          Log out to sign in with a different account.
        </p>
        <div style={{ maxWidth: "17.5rem", marginLeft: "auto", marginRight: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            type="button"
            className="danger-button"
            onClick={() => setShowResetConfirm(true)}
          >
            Log out
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ color: "#64748b", fontWeight: 400 }}
            onClick={() => { setShowDeleteConfirm(true); setError(""); }}
          >
            Ta bort mitt konto
          </button>
        </div>

        <div className="settings-page-logo-wrap">
          <img
            src="/welcome-logo.svg"
            alt=""
            className="settings-page-logo"
            width={116}
            height={116}
            decoding="async"
          />
        </div>

        {showResetConfirm && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "1rem",
            }}
            onClick={(e) => e.target === e.currentTarget && setShowResetConfirm(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "var(--radius-field)",
                padding: "1.5rem",
                maxWidth: "20rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="reset-confirm-title" style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem", color: "#064e3b" }}>
                Log out?
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#334155", marginBottom: "1.25rem", lineHeight: 1.4 }}>
                You will need to log in again to access your lunches.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ flex: 1, marginTop: 0 }}
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger-button"
                  style={{ flex: 1, marginTop: 0 }}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "1rem",
            }}
            onClick={(e) => !deleting && e.target === e.currentTarget && setShowDeleteConfirm(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "var(--radius-field)",
                padding: "1.5rem",
                maxWidth: "20rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="delete-confirm-title" style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem", color: "#064e3b" }}>
                Ta bort mitt konto?
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#334155", marginBottom: "1.25rem", lineHeight: 1.4 }}>
                Din användardata, inklusive bokade lunchdejtar, raderas permanent. Det går inte att ångra.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ flex: 1, marginTop: 0 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  className="danger-button"
                  style={{ flex: 1, marginTop: 0 }}
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? "Tar bort…" : "Ta bort konto"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
