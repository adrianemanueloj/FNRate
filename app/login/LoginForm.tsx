"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createImplicitClient } from "@/lib/supabase/implicit";
import { clearHandoffId, newHandoffId } from "@/lib/handoff";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoffId, setHandoffId] = useState<string | null>(null);

  // While waiting, check whether the link was opened on another device.
  useEffect(() => {
    if (!sent || !handoffId) return;
    const supabase = createClient();
    const started = Date.now();
    let done = false;
    let busyCheck = false;
    async function check() {
      if (done || busyCheck || document.visibilityState === "hidden") return;
      if (Date.now() - started > 65 * 60 * 1000) return;
      busyCheck = true;
      const { data } = await supabase.rpc("take_handoff", { p_id: handoffId });
      busyCheck = false;
      const row = Array.isArray(data) ? data[0] : null;
      if (!row?.at || !row?.rt || done) return;
      done = true;
      const { error } = await supabase.auth.setSession({ access_token: row.at, refresh_token: row.rt });
      clearHandoffId();
      if (error) { setError("Signing in didn’t work. Ask for a new link."); setSent(false); }
      else window.location.replace(next);
    }
    const timer = setInterval(check, 3000);
    document.addEventListener("visibilitychange", check);
    return () => { done = true; clearInterval(timer); document.removeEventListener("visibilitychange", check); };
  }, [sent, handoffId, next]);

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
    const h = newHandoffId();
    const { error } = await createImplicitClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/hash?next=${encodeURIComponent(next)}&h=${h}` },
    });
    setBusy(false);
    if (error) setError(friendly(error.message));
    else { setHandoffId(h); setSent(true); }
  }

  if (sent) {
    return (
      <div className="notice ok" role="status">
        Check <b>{email}</b> for a sign-in link. It can take a minute, so check spam too. The link works for one hour. You can open it on your phone too: this page will sign in by itself once you tap it.
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
