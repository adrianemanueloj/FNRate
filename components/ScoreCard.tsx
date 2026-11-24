import Link from "next/link";
import { CATEGORIES, profileHref, scoreColor, type CategoryKey } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

export default function ScoreCard({
  p,
  active,
  linkCats = true,
}: {
  p: PlayerStats;
  active?: CategoryKey;
  linkCats?: boolean;
}) {
  return (
    <div>
      <div className="big-score">
        <div className="num" style={{ color: scoreColor(p.overall) }}>
          {p.overall ?? "–"}
        </div>
        <div className="lbl">
          Overall · {p.rating_count} rating{p.rating_count === 1 ? "" : "s"}
        </div>
      </div>
      <div className="cats">
        {CATEGORIES.map((c) => {
          const v = p[c.key];
          const inner = (
            <>
              <div className="n" style={{ color: scoreColor(v) }}>{v ?? "–"}</div>
              <div className="l">{c.label}</div>
            </>
          );
          return linkCats ? (
            <Link
              key={c.key}
              href={`${profileHref(p.epic_name)}?cat=${c.key}#reviews`}
              className={`cat${active === c.key ? " active" : ""}`}
              scroll={false}
            >
              {inner}
            </Link>
          ) : (
            <div key={c.key} className="cat">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
