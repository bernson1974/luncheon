"use client";

import { useState, useCallback, type FormEvent } from "react";

interface Props {
  onFound: (lat: number, lng: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MapSearchInput({
  onFound,
  disabled = false,
  placeholder = "Sök plats eller adress…",
}: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q || loading || disabled) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(q)}`
        );
        const data = (await res.json()) as {
          lat?: number;
          lng?: number;
          error?: string;
        };

        if (data.error || data.lat == null || data.lng == null) {
          setError("Hittade ingen plats. Prova en annan sökning.");
          return;
        }

        onFound(data.lat, data.lng);
      } catch {
        setError("Sökningen misslyckades. Försök igen.");
      } finally {
        setLoading(false);
      }
    },
    [query, loading, disabled, onFound]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="map-search-form"
      style={{
        position: "absolute",
        top: "0.75rem",
        left: "0.75rem",
        right: "0.75rem",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.35rem" }}>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="map-search-input"
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(15, 23, 42, 0.15)",
            fontSize: "0.9rem",
            fontFamily: "inherit",
            background: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          aria-label="Sök plats"
        />
        <button
          type="submit"
          disabled={loading || disabled}
          className="map-search-btn"
          style={{
            padding: "0.5rem 0.85rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#1e524e",
            color: "#ecfdf5",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {loading ? "Söker…" : "Sök"}
        </button>
      </div>
      {error && (
        <p
          style={{
            margin: 0,
            fontSize: "0.8rem",
            color: "#dc2626",
            background: "rgba(255,255,255,0.95)",
            padding: "0.35rem 0.5rem",
            borderRadius: "0.35rem",
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
