import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import PlayerRow from "@/components/PlayerRow";
import TopCard from "@/components/TopCard";
import Badge from "@/components/Badge";
import { MiniStats } from "@/components/StatRows";
import { getUserAndPinned, type PlayerStats, type RatingStatus } from "@/lib/session";
import { profileHref, scoreColor, timeAgo, verdict } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { supabase, user, pinned } = await getUserAndPinned();
  const [best, toxic, comms, skill, recent, status, total] = await Promise.all([
    supabase.rpc("leaderboard", { p_kind: "best", p_limit: 5 }),
    supabase.rpc("leaderboard", { p_kind: "toxic", p_limit: 5 }),
    supabase.rpc("leaderboard", { p_kind: "comms", p_limit: 1 }),
    supabase.rpc("leaderboard", { p_kind: "skill", p_limit: 1 }),
    supabase.from("player_stats").select("*").gt("rating_count", 0).order("last_rated_at", { ascending: false }).limit(8),
    user ? supabase.rpc("my_rating_status") : Promise.resolve({ data: null }),
    supabase.from("players").select("id", { count: "exact", head: true }),
  ]);
  const s = (status.data ?? {}) as RatingStatus;
  const bestList = (best.data ?? []) as PlayerStats[];
  const toxicList = (toxic.data ?? []) as PlayerStats[];
  const recentList = (recent.data ?? []) as PlayerStats[];
  const topComms = ((comms.data ?? []) as PlayerStats[])[0];
  const topSkill = ((skill.data ?? []) as PlayerStats[])[0];
  const playerCount = total.count ?? 0;
  const boardsLive = bestList.length > 0;

  return (
    <>
      {pinned && (
        <section className="panel" aria-label="My account">
          <div className="spread">
            <span className="label">My account</span>
            <Link href={profileHref(pinned.epic_name)} className="link small">Open</Link>
          </div>
          <div className="row" style={{ marginTop: 6, flexWrap: "nowrap", gap: 14, alignItems: "flex-end" }}>
            <span className="num" style={{ fontSize: 64, lineHeight: 0.8, fontWeight: 800, color: scoreColor(pinned.overall) }}>{pinned.overall ?? "–"}</span>
            <span className="stack" style={{ gap: 2, minWidth: 0 }}>
              <span className="row" style={{ gap: 8, flexWrap: "nowrap", minWidth: 0 }}>
                <h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinned.epic_name}</h3>
                {pinned.badge && <Badge />}
              </span>
              <span className="small muted">{verdict(pinned.overall)} · {pinned.rating_count} ratings</span>
            </span>
          </div>
          <MiniStats p={pinned} />
        </section>
      )}

      <section className="hero hero-band">
        <h1>Rate your teammates <span className="hl">after the game</span></h1>
        <p className="lede">Just played with someone? Type their Epic name and rate their toxicity, teamwork, comms and skill.</p>
        <SearchBox />
        <div className="hero-meta">
          {playerCount >= 25 && <span><b>{playerCount.toLocaleString("en-US")}</b> players rated</span>}
          {user ? (
            <span><b>{s.left_today ?? 0}</b> of {s.daily_limit ?? 3} ratings left today</span>
          ) : (
            <span><Link href="/login" className="link">Sign in</Link> with email or Discord to rate. 3 ratings a day.</span>
          )}
        </div>
        {user && !pinned && (
          <p className="small muted" style={{ margin: 0 }}>Search your own Epic name and tap “This is me” to keep your stats here.</p>
        )}
      </section>

      {boardsLive ? (
        <section aria-label="Number one players">
          <div className="sec-head"><h2>Top of the boards</h2><Link href="/leaderboards">All boards</Link></div>
          <div className="tops">
            <TopCard kind="best" title="Best teammate" stat="overall" p={bestList[0]} />
            <TopCard kind="toxic" title="Most toxic" stat="toxicity" p={toxicList[0]} />
            <TopCard kind="comms" title="Best comms" stat="comms" p={topComms} />
            <TopCard kind="skill" title="Most skilled" stat="skill" p={topSkill} />
          </div>
        </section>
      ) : (
        <section className="panel cut">
          <h2>How it works</h2>
          <ol className="steps" style={{ marginTop: 12 }}>
            <li><span><b>Search someone you played with</b><span className="muted small">Use their exact Epic name. If nobody has rated them yet, you’ll be first.</span></span></li>
            <li><span><b>Rate them out of 100</b><span className="muted small">Toxicity, teamwork, comms and skill. Overall is the average. Add a short review if you want.</span></span></li>
            <li><span><b>Climb the boards</b><span className="muted small">Players with 2 or more ratings show up on Best teammates and Most toxic.</span></span></li>
          </ol>
        </section>
      )}

      {boardsLive && (
        <div className="grid2">
          <section>
            <div className="sec-head"><h2>Best teammates</h2><Link href="/leaderboards?tab=best">See all</Link></div>
            <div className="panel flush">{bestList.map((p, i) => <PlayerRow key={p.player_id} p={p} rank={i + 1} />)}</div>
          </section>
          <section>
            <div className="sec-head"><h2>Most toxic</h2><Link href="/leaderboards?tab=toxic">See all</Link></div>
            <div className="panel flush">
              {toxicList.map((p, i) => <PlayerRow key={p.player_id} p={p} rank={i + 1} stat="toxicity" sub={`Toxicity · ${p.rating_count} ratings`} />)}
            </div>
          </section>
        </div>
      )}

      <section className="panel cut">
        <div className="spread" style={{ gap: 14, alignItems: "center" }}>
          <span className="stack" style={{ gap: 2 }}>
            <h2>Rate your own squad</h2>
            <span className="small muted">Make a party, invite your friends and rate each other after every match. Only your party sees it.</span>
          </span>
          <Link className="btn" href="/party">Party</Link>
        </div>
      </section>

      {recentList.length > 0 && (
        <section>
          <div className="sec-head"><h2>Just rated</h2></div>
          <div className="panel flush">
            {recentList.map((p) => (
              <PlayerRow key={p.player_id} p={p} sub={p.last_rated_at ? `Rated ${timeAgo(p.last_rated_at)}` : undefined} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
