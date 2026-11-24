"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function discord() {
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="notice ok" role="status">
        <span>Check your email! We sent a sign-in link to <b>{email}</b>. Open it on this same device.</span>
      </div>
    );
  }

  return (
    <div className="stack">
      <button className="btn discord full" onClick={discord} disabled={busy}>
        Continue with Discord
      </button>
      <div className="divider">or</div>
      <form onSubmit={emailLink} className="stack">
        <input
          type="email"
          required
          placeholder="you@example.com"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button className="btn ghost full" type="submit" disabled={busy}>
          Email me a sign-in link
        </button>
      </form>
      {error && <div className="notice err" role="alert">{error}</div>}
    </div>
  );
}
