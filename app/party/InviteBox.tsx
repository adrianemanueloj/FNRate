"use client";

import { useState } from "react";
import { IconShare } from "@/components/Icons";

export default function InviteBox({ code, name }: { code: string; name: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = `${window.location.origin}/party/join/${code}`;
    try {
      if (navigator.share) { await navigator.share({ title: `Join ${name} on FNRate`, url }); return; }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch { /* cancelled */ }
  }
  return (
    <section className="panel cut stack" style={{ gap: 10 }}>
      <div className="invite">
        <span className="stack" style={{ gap: 0 }}>
          <span className="label">Invite code</span>
          <span className="code">{code}</span>
        </span>
        <button type="button" className="btn" onClick={share}><IconShare /> {done ? "Link copied" : "Invite"}</button>
      </div>
      <span className="small muted">Send the invite link to your squad. They sign in, type their Epic name and they’re in.</span>
    </section>
  );
}
