"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clearHandoffId, isUuid, myHandoffId } from "@/lib/handoff";

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

type State = "working" | "handed" | "failed";

export default function HashSignIn() {
  const [state, setState] = useState<State>("working");
  const tokens = useRef<{ access_token: string; refresh_token: string } | null>(null);
  const handoff = useRef<string | null>(null);
  const next = useRef("/");

  async function signInHere() {
    if (!tokens.current) return setState("failed");
    setState("working");
    const supabase = createClient();
    // Take back the handoff so the other device doesn't also use this session.
    if (handoff.current) await supabase.rpc("take_handoff", { p_id: handoff.current });
    const { error } = await supabase.auth.setSession(tokens.current);
    clearHandoffId();
    if (error) setState("failed");
    else window.location.replace(next.current);
  }

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    next.current = safeNext(query.get("next"));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    // Remove tokens from the address bar before anything else runs.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (!access_token || !refresh_token) { setState("failed"); return; }
    tokens.current = { access_token, refresh_token };

    const h = query.get("h");
    if (isUuid(h) && myHandoffId() !== h) {
      // Opened on a different device or browser than the one that asked.
      handoff.current = h;
      createClient().rpc("put_handoff", { p_id: h, p_access: access_token, p_refresh: refresh_token })
        .then(({ error }) => {
          if (error) { handoff.current = null; signInHere(); }
          else setState("handed");
        });
      return;
    }
    signInHere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack" style={{ maxWidth: 420, margin: "48px auto", gap: 14 }}>
      {state === "failed" && (
        <>
          <div className="notice err" role="alert">
            That sign-in link didn’t work. It may have been used already or be more than an hour old.
          </div>
          <Link className="btn full" href="/login">Get a new link</Link>
        </>
      )}
      {state === "handed" && (
        <>
          <div className="notice ok" role="status">
            <b>You’re signed in.</b> Go back to the device where you asked for the link. It will sign in by itself in a few seconds. You can close this page.
          </div>
          <button className="btn ghost full" onClick={signInHere}>Sign in on this device instead</button>
        </>
      )}
      {state === "working" && <div className="notice" role="status">Signing you in…</div>}
    </div>
  );
}
