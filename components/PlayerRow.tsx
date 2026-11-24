import Link from "next/link";
import Badge from "./Badge";
import { profileHref, scoreColor } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

type Stat = "overall" | "toxicity" | "teamwork" | "comms" | "skill";

export default function PlayerRow({ p, rank, stat = "overall", sub }: { p: PlayerStats; rank?: number; stat?: Stat; sub?: string }) {
  const v = p[stat];
  return (
    <Link href={profileHref(p.epic_name)} className="prow">
      {rank != null && <span className={`rank${rank <= 3 ? ` r${rank}` : ""}`}>{rank}</span>}
      <span className="who">
        <span className="name"><span>{p.epic_name}</span>{p.badge && <Badge />}</span>
        <span className="small faint">{sub ?? `${p.rating_count} rating${p.rating_count === 1 ? "" : "s"}`}</span>
      </span>
      <span className="pill" style={{ color: scoreColor(v) }}>{v ?? "–"}</span>
    </Link>
  );
}
