"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login, signup, fetchMe } from "@/lib/authClient";

type Mode = "login" | "signup";

export default function WelcomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMe().then((user) => {
      if (user) router.replace("/");
    });
  }, [router]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.ok) router.replace("/");
      else setError(result.error);
    } catch {
      setError("Could not log in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (alias.trim().length < 1) {
      setError("Enter your name.");
      return;
    }
    if (alias.trim().length > 40) {
      setError("Name max 40 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await signup(email.trim(), password, alias.trim());
      if (result.ok) router.replace("/");
      else setError(result.error);
    } catch {
      setError("Could not create account. Try again.");
    } finally {
      setLoading(false);
    }
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

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="welcome-landing__form welcome-landing__form--bare">
              <label className="welcome-landing__name-label" htmlFor="welcome-email">
                Email
              </label>
              <input
                id="welcome-email"
                className="welcome-landing__field"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
              />
              <label className="welcome-landing__name-label" htmlFor="welcome-password" style={{ marginTop: "1rem" }}>
                Password
              </label>
              <input
                id="welcome-password"
                className="welcome-landing__field"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
              />
              {error && <p className="welcome-landing__error">{error}</p>}
              <button type="submit" className="primary-button" style={{ marginTop: "1.25rem" }} disabled={loading}>
                {loading ? "Logging in…" : "Log in"}
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: "0.5rem" }}
                onClick={() => { setMode("signup"); setError(""); }}
              >
                Create account
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="welcome-landing__form welcome-landing__form--bare">
              <label className="welcome-landing__name-label" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                className="welcome-landing__field"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
              />
              <label className="welcome-landing__name-label" htmlFor="signup-alias" style={{ marginTop: "1rem" }}>
                Display name
              </label>
              <input
                id="signup-alias"
                className="welcome-landing__field"
                type="text"
                autoComplete="nickname"
                placeholder="e.g. Alex"
                value={alias}
                onChange={(e) => { setAlias(e.target.value); setError(""); }}
                maxLength={40}
                required
              />
              <label className="welcome-landing__name-label" htmlFor="signup-password" style={{ marginTop: "1rem" }}>
                Password (min 6 characters)
              </label>
              <input
                id="signup-password"
                className="welcome-landing__field"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                minLength={6}
                required
              />
              {error && <p className="welcome-landing__error">{error}</p>}
              <button type="submit" className="primary-button" style={{ marginTop: "1.25rem" }} disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: "0.5rem" }}
                onClick={() => { setMode("login"); setError(""); }}
              >
                Already have an account? Log in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
