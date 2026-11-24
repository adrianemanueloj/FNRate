import Link from "next/link";
import { CATEGORIES, profileHref, scoreColor, type CategoryKey } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

export default function CatTiles({ p, active, link = true }: { p: PlayerStats; active?: CategoryKey; link?: boolean }) {
  return (
    <div className="cats">
      {CATEGORIES.map((c) => {
        const v = p[c.key];
        const inner = (
          <>
            <span className="v" style={{ color: scoreColor(v) }}>{v ?? "–"}</span>
            <span className="bar"><i style={{ ["--w" as string]: `${v ?? 0}%`, background: scoreColor(v) }} /></span>
            <span className="l">{c.label}</span>
          </>
        );
        return link ? (
          <Link key={c.key} href={`${profileHref(p.epic_name)}?cat=${c.key}#reviews`} scroll={false}
            className={`cat${active === c.key ? " on" : ""}`} aria-label={`${c.label} ${v ?? "not rated"}. Read ${c.label} reviews`}>
            {inner}
          </Link>
        ) : (
          <div key={c.key} className="cat">{inner}</div>
        );
      })}
    </div>
  );
}
