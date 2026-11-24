import Link from "next/link";
import { profileHref } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

type Stat = "overall" | "toxicity" | "comms" | "skill";

export default function TopCard({ kind, title, stat, statLabel, p }: {
  kind: string; title: string; stat: Stat; statLabel: string; p?: PlayerStats;
}) {
  return (
    <article className={`top1 t-${kind}`}>
      <div className="head">
        <h3 className="poster">{title}</h3>
        <Link href={`/leaderboards?tab=${kind}`}>View all</Link>
      </div>
      {p ? (
        <Link href={profileHref(p.epic_name)} className="body">
          <span className="ghost" aria-hidden="true">#1</span>
          <span className="mono" aria-hidden="true">{p.epic_name.replace(/[^a-z0-9]/gi, "").slice(0, 1).toUpperCase() || "?"}</span>
          <span className="who">
            <span className="n">{p.epic_name}</span>
            <span className="s">{statLabel} <b>{p[stat]}</b></span>
          </span>
        </Link>
      ) : (
        <div className="body"><span className="ghost" aria-hidden="true">#1</span><span className="small muted">Nobody here yet. Rate your teammates to fill it.</span></div>
      )}
    </article>
  );
}
