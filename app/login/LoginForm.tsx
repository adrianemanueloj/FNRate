"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  function friendly(msg: string) {
    if (/rate limit|too many/i.test(msg)) return "Too many sign-in emails were sent just now. Wait a few minutes and try again.";
    if (/provider is not enabled|unsupported provider/i.test(msg)) return "Discord sign-in isn’t switched on yet. Use email for now.";
    return msg;
  }

  async function discord() {
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({ provider: "discord", options: { redirectTo: redirectTo() } });
    if (error) { setError(friendly(error.message)); setBusy(false); }
  }

  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setBusy(false);
    if (error) setError(friendly(error.message));
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="notice ok" role="status">
        Check <b>{email}</b> for a sign-in link. It can take a minute, so check spam too. The link works for one hour.
        <div style={{ marginTop: 8 }}><button className="linkbtn" onClick={() => setSent(false)}>Use a different email</button></div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <button className="btn discord full" onClick={discord} disabled={busy}>Continue with Discord</button>
      <div className="divider">or</div>
      <form onSubmit={emailLink} className="stack" style={{ gap: 10 }}>
        <input id="email" type="email" required placeholder="you@example.com" aria-label="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
        <button className="btn ghost full" type="submit" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
      </form>
      {error && <div className="notice err" role="alert">{error}</div>}
    </div>
  );
}
