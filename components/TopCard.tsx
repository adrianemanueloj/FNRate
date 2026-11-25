import Link from "next/link";
import { profileHref } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

type Stat = "overall" | "toxicity" | "comms" | "skill";

export default function TopCard({ kind, title, stat, p }: { kind: string; title: string; stat: Stat; p?: PlayerStats }) {
  return (
    <article className={`top1 t-${kind}`}>
      <span className="ghost" aria-hidden="true">#1</span>
      <div className="ttl">
        <h3>{title}</h3>
        <Link href={`/leaderboards?tab=${kind}`}>All</Link>
      </div>
      {p ? (
        <Link href={profileHref(p.epic_name)} className="who">
          <span className="s">{p[stat]}<small>/100</small></span>
          <span className="n">{p.epic_name}</span>
        </Link>
      ) : (
        <span className="open">Open spot</span>
      )}
    </article>
  );
}
