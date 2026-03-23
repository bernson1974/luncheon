"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getStoredAlias, setStoredAlias } from "@/lib/userAlias";

export default function WelcomePage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (getStoredAlias()) {
      router.replace("/");
    }
  }, [router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = alias.trim();
    if (trimmed.length < 1) {
      setError("Enter a display name (at least one letter).");
      return;
    }
    if (trimmed.length > 40) {
      setError("Max 40 characters.");
      return;
    }
    setStoredAlias(trimmed);
    setShowDisclaimer(true);
  }

  return (
    <div className="welcome-landing">
      <div className="welcome-landing__inner">
        <div className="welcome-landing__stack">
          <h1 className="welcome-landing__tagline">Wanna grab a bite?</h1>

          <div className="welcome-landing__logo-wrap">
            <img
              src="/welcome-logo.svg"
              alt=""
              className="welcome-landing__logo"
              width={140}
              height={140}
              decoding="async"
            />
          </div>

          <form onSubmit={handleSubmit} className="welcome-landing__form welcome-landing__form--bare">
            <label className="welcome-landing__name-label" htmlFor="welcome-alias">
              Enter your name.
            </label>
            <input
              id="welcome-alias"
              className="welcome-landing__field"
              type="text"
              autoComplete="nickname"
              placeholder="e.g. Alex or A"
              value={alias}
              onChange={(e) => {
                setAlias(e.target.value);
                setError("");
              }}
              maxLength={40}
              autoFocus
            />
            {error && <p className="welcome-landing__error">{error}</p>}
            <button type="submit" className="primary-button">
              Start
            </button>
          </form>
        </div>
      </div>

      {showDisclaimer && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="disclaimer-title"
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
          onClick={(e) => e.target === e.currentTarget && setShowDisclaimer(false)}
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
            <h3 id="disclaimer-title" style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem", color: "#064e3b", textAlign: "center" }}>
              Disclaimer
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#334155", marginBottom: "1.25rem", lineHeight: 1.4, textAlign: "center" }}>
              This app can not guarantee that all restaurants are still active nor their opening hours.
            </p>
            <button
              type="button"
              className="primary-button"
              style={{ marginTop: 0, width: "100%" }}
              onClick={() => {
                setShowDisclaimer(false);
                router.replace("/");
              }}
            >
              Join the BITE CLUB!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
