"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export default function HashSignIn() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    // Remove tokens from the address bar before anything else runs.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    if (!access_token || !refresh_token) { setFailed(true); return; }
    createClient().auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) setFailed(true);
      else window.location.replace(next);
    });
  }, []);

  return (
    <div className="stack" style={{ maxWidth: 420, margin: "48px auto", gap: 14 }}>
      {failed ? (
        <>
          <div className="notice err" role="alert">
            That sign-in link didn’t work. It may have been used already or be more than an hour old.
          </div>
          <Link className="btn full" href="/login">Get a new link</Link>
        </>
      ) : (
        <div className="notice" role="status">Signing you in…</div>
      )}
    </div>
  );
}
