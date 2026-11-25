import Link from "next/link";
import { CATEGORIES, profileHref, scoreColor, type CategoryKey } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

// Stat-sheet rows: label, bar, number. Tapping a row shows that category's reviews.
export default function StatRows({ p, active }: { p: PlayerStats; active?: CategoryKey }) {
  return (
    <div className="statrows">
      {CATEGORIES.map((c) => {
        const v = p[c.key];
        return (
          <Link key={c.key} href={`${profileHref(p.epic_name)}?cat=${c.key}#reviews`} scroll={false}
            className={`statrow${active === c.key ? " on" : ""}`}
            aria-label={`${c.label} ${v ?? "not rated"} out of 100. Show ${c.label} reviews`}>
            <span className="k">{c.label}</span>
            <span className="bar"><i style={{ ["--w" as string]: `${v ?? 0}%`, ["--c" as string]: scoreColor(v) }} /></span>
            <span className="v" style={{ color: scoreColor(v) }}>{v ?? "–"}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function MiniStats({ p }: { p: PlayerStats }) {
  return (
    <div className="mini-stats">
      {CATEGORIES.map((c) => (
        <Link key={c.key} href={`${profileHref(p.epic_name)}?cat=${c.key}#reviews`}>
          <span className="v" style={{ color: scoreColor(p[c.key]) }}>{p[c.key] ?? "–"}</span>
          <span className="k">{c.label}</span>
        </Link>
      ))}
    </div>
  );
}
