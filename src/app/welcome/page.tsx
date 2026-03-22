"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getStoredAlias, setStoredAlias } from "@/lib/userAlias";

const WELCOME_BG = "#6eb8aa";
const DEFAULT_BG = "#f8fafc";

export default function WelcomePage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");

  /* Grönt hela vägen till kanten på iPhone (notch, home indicator) */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.background;
    const prevBody = body.style.background;
    html.style.background = WELCOME_BG;
    body.style.background = WELCOME_BG;
    return () => {
      html.style.background = prevHtml || "";
      body.style.background = prevBody || DEFAULT_BG;
    };
  }, []);

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
    router.replace("/");
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
              Join the BITE CLUB!
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
