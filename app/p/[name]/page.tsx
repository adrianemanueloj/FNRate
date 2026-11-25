import type { Metadata } from "next";
import Link from "next/link";
import ScoreBlock from "@/components/ScoreBlock";
import StatRows from "@/components/StatRows";
import ReviewItem from "@/components/ReviewItem";
import Badge from "@/components/Badge";
import ShareButton from "@/components/ShareButton";
import { IconPin, IconThumb } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";
import { getUserAndPinned, type PlayerStats, type RatingStatus, type Review } from "@/lib/session";
import { CATEGORIES, catLabel, isCategory, profileHref, verdict, type CategoryKey } from "@/lib/categories";
import { isValidName, nameFromParam } from "@/lib/names";
import { pinPlayer } from "@/app/actions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const name = nameFromParam((await params).name);
  if (!isValidName(name)) return { title: "Player not found" };
  const supabase = await createClient();
  const { data: p } = await supabase.from("player_stats").select("*").eq("epic_name", name).maybeSingle<PlayerStats>();
  if (!p || !p.rating_count) return { title: `${name} on FNRate`, description: `Nobody has rated ${name} yet. Played with them? Be the first.` };
  const desc = `${p.overall}/100 overall from ${p.rating_count} players. Toxicity ${p.toxicity}, teamwork ${p.teamwork}, comms ${p.comms}, skill ${p.skill}.`;
  return { title: `${p.epic_name}: ${p.overall}/100`, description: desc, openGraph: { title: `${p.epic_name} on FNRate`, description: desc } };
}

export default async function ProfilePage({
  params,
  searchParams,
}: Params & { searchParams: Promise<{ cat?: string; rated?: string; reported?: string; err?: string }> }) {
  const name = nameFromParam((await params).name);
  const sp = await searchParams;

  if (!isValidName(name)) {
    return (
      <section className="hero">
        <h1>Player not found</h1>
        <p className="lede">Epic names are 3 to 32 characters. Try searching instead.</p>
        <Link className="btn" href="/search">Search players</Link>
      </section>
    );
  }

  const { supabase, user, pinned } = await getUserAndPinned();
  const { data: player } = await supabase.from("player_stats").select("*").eq("epic_name", name).maybeSingle<PlayerStats>();

  if (!player || player.rating_count === 0) {
    const n = player?.epic_name ?? name;
    return (
      <section className="hero">
        <span className="label">No ratings yet</span>
        <h1 style={{ wordBreak: "break-all", textTransform: "none" }}>{n}</h1>
        <p className="lede">Nobody has rated {n} yet. If you played with them, your rating will be the first thing people see.</p>
        <Link className="btn full" href={`/rate/${encodeURIComponent(n)}`}>Rate {n}</Link>
      </section>
    );
  }

  const cat: CategoryKey = isCategory(sp.cat) ? sp.cat : "toxicity";
  const [{ data: all }, statusRes, votesRes] = await Promise.all([
    supabase.from("public_reviews").select("*").eq("player_id", player.player_id).order("created_at", { ascending: false }).limit(200),
    user ? supabase.rpc("my_rating_status", { p_epic_name: player.epic_name }) : Promise.resolve({ data: null }),
    user ? supabase.rpc("my_helpful_votes", { p_player_id: player.player_id }) : Promise.resolve({ data: null }),
  ]);
  const reviews = (all ?? []) as Review[];
  const status = (statusRes.data ?? {}) as RatingStatus;
  const voted = new Set((votesRes.data ?? []) as string[]);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.key, reviews.filter((r) => r.category === c.key).length]));
  const shown = reviews.filter((r) => r.category === cat);
  const best = [...reviews].sort((a, b) => b.helpful - a.helpful || b.body.length - a.body.length)[0];
  const isMine = pinned?.player_id === player.player_id;
  const here = `${profileHref(player.epic_name)}?cat=${cat}`;

  return (
    <>
      {sp.rated && <div className="notice ok">Rating saved. Thanks for helping other players.</div>}
      {sp.reported && <div className="notice ok">Reported. A review is hidden after 3 reports.</div>}
      {sp.err && <div className="notice err">{sp.err}</div>}

      <section className="stack" style={{ gap: 6 }}>
        <div className="row" style={{ gap: 8 }}>
          {isMine && <span className="chip"><IconPin /> My account</span>}
          {player.badge && <Badge />}
        </div>
        <h1 style={{ wordBreak: "break-all", textTransform: "none", fontSize: "clamp(34px, 9vw, 50px)" }}>{player.epic_name}</h1>
      </section>

      <section className="panel cut scorepanel">
        <ScoreBlock value={player.overall} count={player.rating_count} />
        <div style={{ marginTop: 16 }}><StatRows p={player} active={cat} /></div>
      </section>

      {best && (
        <section aria-label="Top review">
          <div className="topreview">
            <q>{best.body}</q>
            <div className="meta">
              <span className="chip">{catLabel(best.category)}</span>
              {best.helpful > 0 ? <span className="row" style={{ gap: 4 }}><IconThumb />{best.helpful} found this helpful</span> : <span>Top review</span>}
            </div>
          </div>
        </section>
      )}

      <div className="stack">
        {isMine ? null : status.already_rated ? (
          <div className="notice">You rated {player.epic_name} already. Each player can only be rated once by you.</div>
        ) : (
          <Link className="btn full" href={`/rate/${encodeURIComponent(player.epic_name)}`}>Rate {player.epic_name}</Link>
        )}
        <div className="duo">
          <ShareButton title={`${player.epic_name} on FNRate: ${player.overall}/100 (${verdict(player.overall)})`} />
          {user && (
            <form action={pinPlayer}>
              <input type="hidden" name="player_id" value={isMine ? "" : player.player_id} />
              <input type="hidden" name="back" value={profileHref(player.epic_name)} />
              <button className="btn ghost full" type="submit"><IconPin />{isMine ? "Unpin" : "This is me"}</button>
            </form>
          )}
        </div>
      </div>

      <section id="reviews" style={{ scrollMarginTop: 70 }}>
        <div className="sec-head"><h2>Reviews</h2><span className="small faint">{reviews.length} total</span></div>
        <nav className="tabs" aria-label="Review category">
          {CATEGORIES.map((c) => (
            <Link key={c.key} href={`${profileHref(player.epic_name)}?cat=${c.key}#reviews`} scroll={false}
              className={c.key === cat ? "on" : ""} aria-current={c.key === cat ? "true" : undefined}>
              {c.label}<span className="n">{counts[c.key]}</span>
            </Link>
          ))}
        </nav>
        <div>
          {shown.length === 0 ? (
            <div className="empty" style={{ paddingInline: 0 }}>No {catLabel(cat).toLowerCase()} reviews yet.</div>
          ) : (
            shown.map((r) => <ReviewItem key={r.id} r={r} voted={voted.has(r.id)} back={here} />)
          )}
        </div>
      </section>
    </>
  );
}
