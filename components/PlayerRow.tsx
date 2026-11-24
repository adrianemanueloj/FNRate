import Link from "next/link";
import { profileHref, scoreColor } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

export default function PlayerRow({ p }: { p: PlayerStats }) {
  return (
    <Link href={profileHref(p.epic_name)} className="player-row">
      <div>
        <div style={{ fontWeight: 700 }}>{p.epic_name}</div>
        <div className="muted small">
          {p.rating_count} rating{p.rating_count === 1 ? "" : "s"}
        </div>
      </div>
      <span className="pill" style={{ color: scoreColor(p.overall) }}>
        {p.overall ?? "–"}
      </span>
    </Link>
  );
}
