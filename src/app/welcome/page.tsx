"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredAlias, setStoredAlias } from "@/lib/userAlias";

export default function WelcomePage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (getStoredAlias()) {
      router.replace("/");
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
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
    <div style={{ maxWidth: "420px", margin: "0 auto", paddingTop: "2rem" }}>
      <h1 className="page-title" style={{ textAlign: "center" }}>
        Welcome to Luncheon
      </h1>
      <p className="page-subtitle" style={{ textAlign: "center" }}>
        No login — just a name others see when you create or join a lunch date.
        You can change it later in settings.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <label className="field-label" htmlFor="welcome-alias">
          Your display name
        </label>
        <input
          id="welcome-alias"
          className="field-input"
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
        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" }}>{error}</p>
        )}
        <button className="primary-button" type="submit">
          Continue
        </button>
      </form>
    </div>
  );
}
