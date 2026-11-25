"use client";

import { useState } from "react";
import { IconShare } from "./Icons";

export default function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = window.location.href.split("?")[0].split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* cancelled */
    }
  }
  return (
    <button type="button" className="btn ghost full" onClick={share}>
      <IconShare /> {done ? "Link copied" : "Share profile"}
    </button>
  );
}
