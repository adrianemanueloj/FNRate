import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";
import CatTiles from "@/components/CatTiles";
import ReviewItem from "@/components/ReviewItem";
import Badge from "@/components/Badge";
import { IconPin, IconThumb } from "@/components/Icons";
import { getUserAndPinned, type PlayerStats, type RatingStatus, type Review } from "@/lib/session";
import { CATEGORIES, catLabel, cleanName, isCategory, profileHref, verdict, type CategoryKey } from "@/lib/categories";
import { pinPlayer } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ cat?: string; rated?: string; reported?: string; err?: string }>;
}) {
  const name = cleanName(decodeURIComponent((await params).name));
  const sp = await searchParams;
  const { supabase, user, pinned } = await getUserAndPinned();

  const { data: player } = await supabase.from("player_stats").select("*").eq("epic_name", name).maybeSingle<PlayerStats>();

  if (!player || player.rating_count === 0) {
    return (
      <section className="card stack fade-up" style={{ textAlign: "center", alignItems: "center", paddingBlock: 32 }}>
        <ScoreRing value={null} />
        <h1 style={{ wordBreak: "break-all" }}>{player?.epic_name ?? name}</h1>
        <p className="muted" style={{ margin: 0 }}>Nobody has rated this player yet.</p>
        <Link className="btn full" href={`/rate/${encodeURIComponent(player?.epic_name ?? name)}`}>Be the first to rate them</Link>
      </section>
    );
  }

  const cat: CategoryKey = isCategory(sp.cat) ? sp.cat : "toxicity";
  const [{ data: all }, statusRes, votesRes] = await Promise.all([
    supabase.from("public_reviews").select("*").eq("player_id", player.player_id)
      .order("created_at", { ascending: false }).limit(200),
    user ? supabase.rpc("my_rating_status", { p_epic_name: player.epic_name }) : Promise.resolve({ data: null }),
    user ? supabase.rpc("my_helpful_votes", { p_player_id: player.player_id }) : Promise.resolve({ data: null }),
  ]);
  const reviews = (all ?? []) as Review[];
  const status = (statusRes.data ?? {}) as RatingStatus;
  const voted = new Set(((votesRes.data ?? []) as string[]));
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.key, reviews.filter((r) => r.category === c.key).length]));
  const shown = reviews.filter((r) => r.category === cat);
  const best = [...reviews].sort((a, b) => b.helpful - a.helpful || b.body.length - a.body.length)[0];
  const isMine = pinned?.player_id === player.player_id;
  const here = `${profileHref(player.epic_name)}?cat=${cat}`;

  return (
    <>
      {sp.rated && <div className="notice ok fade-up">Thanks! Your rating for {player.epic_name} is in.</div>}
      {sp.reported && <div className="notice ok fade-up">Thanks for reporting. Reviews are hidden after 3 reports.</div>}
      {sp.err && <div className="notice err fade-up">{sp.err}</div>}

      <section className="card fade-up">
        <div className="stack" style={{ alignItems: "center", textAlign: "center", gap: 6 }}>
          <div className="row" style={{ justifyContent: "center", gap: 8 }}>
            {isMine && <span className="chip cyan"><IconPin className="" /> My account</span>}
            {player.badge && <Badge />}
          </div>
          <h1 style={{ wordBreak: "break-all" }}>{player.epic_name}</h1>
          <span className="small muted">{player.rating_count} rating{player.rating_count === 1 ? "" : "s"} from other players</span>
        </div>
        <div className="score-hero">
          <ScoreRing value={player.overall} />
          <span className="verdict">{verdict(player.overall)}</span>
        </div>
        <div style={{ marginTop: 14 }}><CatTiles p={player} active={cat} /></div>

        {best && (
          <div className="best" style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Top review</div>
            <q>{best.body}</q>
            <div className="meta">
              <span className="chip">{catLabel(best.category)}</span>
              {best.helpful > 0 && <span className="row" style={{ gap: 4 }}><IconThumb className="" />{best.helpful} found this helpful</span>}
            </div>
          </div>
        )}
      </section>

      <div className="stack fade-up d1">
        {isMine ? null : status.already_rated ? (
          <div className="notice info">You already rated {player.epic_name}. Each player can only be rated once by you.</div>
        ) : (
          <Link className="btn full" href={`/rate/${encodeURIComponent(player.epic_name)}`}>Rate {player.epic_name}</Link>
        )}
        {user && (
          <form action={pinPlayer}>
            <input type="hidden" name="player_id" value={isMine ? "" : player.player_id} />
            <input type="hidden" name="back" value={profileHref(player.epic_name)} />
            <button className="btn ghost full" type="submit">
              <IconPin className="" />{isMine ? "Unpin my account" : "This is me: pin as my account"}
            </button>
          </form>
        )}
      </div>

      <section className="card fade-up d2" id="reviews">
        <div className="sec-head"><h2 className="poster">Reviews</h2><span className="small faint">{reviews.length} total</span></div>
        <div className="tabs" role="tablist" aria-label="Review category">
          {CATEGORIES.map((c) => (
            <Link key={c.key} href={`${profileHref(player.epic_name)}?cat=${c.key}#reviews`} scroll={false}
              className={c.key === cat ? "on" : ""} role="tab" aria-selected={c.key === cat}>
              {c.label}<span className="n">{counts[c.key]}</span>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 6 }}>
          {shown.length === 0 ? (
            <div className="empty">No {catLabel(cat).toLowerCase()} reviews yet.</div>
          ) : (
            shown.map((r) => <ReviewItem key={r.id} r={r} voted={voted.has(r.id)} back={here} />)
          )}
        </div>
      </section>
    </>
  );
}
