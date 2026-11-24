import Link from "next/link";
import ScoreCard from "@/components/ScoreCard";
import { getUserAndPinned, type PlayerStats } from "@/lib/session";
import { CATEGORIES, cleanName, isCategory, profileHref, type CategoryKey } from "@/lib/categories";
import { pinPlayer, reportReview } from "@/app/actions";

export const dynamic = "force-dynamic";

type Review = { id: string; category: CategoryKey; body: string; created_at: string };

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ cat?: string; rated?: string; reported?: string }>;
}) {
  const name = cleanName(decodeURIComponent((await params).name));
  const sp = await searchParams;
  const { supabase, user, pinned } = await getUserAndPinned();

  const { data: player } = await supabase
    .from("player_stats")
    .select("*")
    .eq("epic_name", name)
    .maybeSingle<PlayerStats>();

  if (!player) {
    return (
      <div className="stack">
        <h1>{name}</h1>
        <div className="panel stack">
          <div className="muted">Nobody has rated this player yet.</div>
          <Link className="btn full" href={`/rate/${encodeURIComponent(name)}`}>
            Be the first to rate {name}
          </Link>
        </div>
      </div>
    );
  }

  const cat: CategoryKey = isCategory(sp.cat) ? sp.cat : "toxicity";
  const catInfo = CATEGORIES.find((c) => c.key === cat)!;
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, category, body, created_at")
    .eq("player_id", player.player_id)
    .eq("category", cat)
    .order("created_at", { ascending: false })
    .limit(50);

  let status: { already_rated?: boolean; left_today?: number } = {};
  if (user) {
    const { data } = await supabase.rpc("my_rating_status", { p_epic_name: player.epic_name });
    status = data ?? {};
  }
  const isMine = pinned?.player_id === player.player_id;
  const here = `${profileHref(player.epic_name)}?cat=${cat}`;

  return (
    <div className="stack">
      {sp.rated && <div className="notice ok">Thanks! Your rating is in.</div>}
      {sp.reported && <div className="notice ok">Thanks, the review was reported. It gets hidden after 3 reports.</div>}

      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ wordBreak: "break-all" }}>{player.epic_name}</h1>
        {isMine && <span className="pill small" style={{ color: "var(--accent-2)" }}>My account</span>}
      </div>

      <section className="panel">
        <ScoreCard p={player} active={cat} />
        <p className="muted small" style={{ textAlign: "center", marginBottom: 0 }}>
          Tap a box to read its reviews. Every score is out of 100, higher is better.
        </p>
      </section>

      <div className="stack">
        {isMine ? null : status.already_rated ? (
          <div className="notice info">You already rated this player.</div>
        ) : (
          <Link className="btn full" href={`/rate/${encodeURIComponent(player.epic_name)}`}>
            Rate {player.epic_name}
          </Link>
        )}
        {user && (
          <form action={pinPlayer}>
            <input type="hidden" name="player_id" value={isMine ? "" : player.player_id} />
            <input type="hidden" name="back" value={profileHref(player.epic_name)} />
            <button className="btn ghost full" type="submit">
              {isMine ? "Unpin my account" : "📌 Pin as my account"}
            </button>
          </form>
        )}
      </div>

      <section className="panel" id="reviews">
        <h2>{catInfo.label} reviews</h2>
        {!reviews || reviews.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>No {catInfo.label.toLowerCase()} reviews yet.</p>
        ) : (
          (reviews as Review[]).map((r) => (
            <div key={r.id} className="review">
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{r.body}</div>
              <div className="meta">
                <span>{new Date(r.created_at).toLocaleDateString("en-GB")}</span>
                <form action={reportReview}>
                  <input type="hidden" name="review_id" value={r.id} />
                  <input type="hidden" name="back" value={here} />
                  <button className="linkbtn" type="submit">Report</button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
