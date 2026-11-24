import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import ScoreRing from "@/components/ScoreRing";
import CatTiles from "@/components/CatTiles";
import PlayerRow from "@/components/PlayerRow";
import Badge from "@/components/Badge";
import TopCard from "@/components/TopCard";
import { getUserAndPinned, type PlayerStats, type RatingStatus } from "@/lib/session";
import { profileHref, timeAgo, verdict } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { supabase, user, pinned } = await getUserAndPinned();
  const [best, toxic, comms, skill, recent, status, total] = await Promise.all([
    supabase.rpc("leaderboard", { p_kind: "best", p_limit: 5 }),
    supabase.rpc("leaderboard", { p_kind: "toxic", p_limit: 5 }),
    supabase.rpc("leaderboard", { p_kind: "comms", p_limit: 1 }),
    supabase.rpc("leaderboard", { p_kind: "skill", p_limit: 1 }),
    supabase.from("player_stats").select("*").gt("rating_count", 0).order("last_rated_at", { ascending: false }).limit(6),
    user ? supabase.rpc("my_rating_status") : Promise.resolve({ data: null }),
    supabase.from("players").select("id", { count: "exact", head: true }),
  ]);
  const playerCount = total.count ?? 0;
  const topComms = ((comms.data ?? []) as PlayerStats[])[0];
  const topSkill = ((skill.data ?? []) as PlayerStats[])[0];
  const s = (status.data ?? {}) as RatingStatus;
  const bestList = (best.data ?? []) as PlayerStats[];
  const toxicList = (toxic.data ?? []) as PlayerStats[];
  const recentList = (recent.data ?? []) as PlayerStats[];

  return (
    <>
      {pinned && (
        <section className="card glow fade-up" aria-label="My account">
          <div className="spread" style={{ marginBottom: 12 }}>
            <span className="eyebrow">My account</span>
            <Link href={profileHref(pinned.epic_name)} className="small" style={{ color: "var(--cyan)", fontWeight: 600 }}>Open profile →</Link>
          </div>
          <div className="row" style={{ gap: 16, flexWrap: "nowrap" }}>
            <ScoreRing value={pinned.overall} size="sm" />
            <div className="stack" style={{ gap: 4, minWidth: 0 }}>
              <h2 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinned.epic_name}</h2>
              <div className="row" style={{ gap: 6 }}>
                {pinned.badge && <Badge />}
                <span className="verdict">{verdict(pinned.overall)}</span>
              </div>
              <span className="small muted">{pinned.rating_count} rating{pinned.rating_count === 1 ? "" : "s"}</span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}><CatTiles p={pinned} /></div>
        </section>
      )}

      <section className="hero big-hero fade-up d1">
        <span className="eyebrow grad-text">Rate your squad</span>
        <h1 className="poster">Is your teammate <span className="grad-text">actually good?</span></h1>
        <p>Look up any Epic name to see their toxicity, teamwork, comms and skill, rated by people who played with them.</p>
        <SearchBox large />
        <div className="statline">
          <span className="dot" aria-hidden="true" />
          <span><b>{playerCount.toLocaleString("en-US")}</b> players rated</span>
          {user ? (
            <span className="chip cyan">{s.left_today ?? 0} of {s.daily_limit ?? 3} ratings left today</span>
          ) : (
            <span>· <Link href="/login" style={{ color: "var(--text)", fontWeight: 700, textDecoration: "underline" }}>Sign in</Link> to rate</span>
          )}
        </div>
        {user && !pinned && <span className="small muted">Tip: find your own profile and pin it as your account.</span>}
      </section>

      <section className="fade-up d2" aria-label="Number one players">
        <div className="tops">
          <TopCard kind="best" title="Best teammate" stat="overall" statLabel="Overall" p={bestList[0]} />
          <TopCard kind="toxic" title="Most toxic" stat="toxicity" statLabel="Toxicity" p={toxicList[0]} />
          <TopCard kind="comms" title="Top comms" stat="comms" statLabel="Comms" p={topComms} />
          <TopCard kind="skill" title="Most skilled" stat="skill" statLabel="Skill" p={topSkill} />
        </div>
      </section>

      <div className="grid2 fade-up d3">
        <section>
          <div className="sec-head"><h2 className="poster">Best teammates</h2><Link href="/leaderboards?tab=best">See all</Link></div>
          <div className="card flush">
            {bestList.length ? bestList.map((p, i) => <PlayerRow key={p.player_id} p={p} rank={i + 1} />) : <div className="empty">No one has 3+ ratings yet.</div>}
          </div>
        </section>
        <section>
          <div className="sec-head"><h2 className="poster">Most toxic</h2><Link href="/leaderboards?tab=toxic">See all</Link></div>
          <div className="card flush">
            {toxicList.length ? toxicList.map((p, i) => <PlayerRow key={p.player_id} p={p} rank={i + 1} stat="toxicity" sub={`Toxicity score · ${p.rating_count} ratings`} />) : <div className="empty">No one has 3+ ratings yet.</div>}
          </div>
        </section>
      </div>

      {recentList.length > 0 && (
        <section className="fade-up d3">
          <div className="sec-head"><h2 className="poster">Just rated</h2></div>
          <div className="card flush">
            {recentList.map((p) => (
              <PlayerRow key={p.player_id} p={p} sub={p.last_rated_at ? `Rated ${timeAgo(p.last_rated_at)}` : undefined} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
