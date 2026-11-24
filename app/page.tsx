import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import ScoreCard from "@/components/ScoreCard";
import PlayerRow from "@/components/PlayerRow";
import { getUserAndPinned, type PlayerStats } from "@/lib/session";
import { profileHref } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { supabase, user, pinned } = await getUserAndPinned();
  const { data: recent } = await supabase
    .from("player_stats")
    .select("*")
    .gt("rating_count", 0)
    .order("rating_count", { ascending: false })
    .limit(8);

  return (
    <div className="stack">
      {pinned && (
        <section className="panel pinned">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>My account · {pinned.epic_name}</h2>
            <Link href={profileHref(pinned.epic_name)} className="muted small">Open →</Link>
          </div>
          <ScoreCard p={pinned} />
        </section>
      )}

      <section>
        <h1>How good is your teammate, really?</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Search any Epic name to see their rating, or be the first to rate them.
        </p>
        <SearchBox />
      </section>

      {user && !pinned && (
        <div className="notice info">
          Tip: open your own profile and tap <b>Pin as my account</b> to see your stats here.
        </div>
      )}
      {!user && (
        <div className="notice info">
          <Link href="/login" style={{ color: "var(--text)", textDecoration: "underline" }}>Sign in</Link>{" "}
          with email or Discord to rate players. You get 3 ratings a day.
        </div>
      )}

      {recent && recent.length > 0 && (
        <section className="panel" style={{ padding: 0 }}>
          <h2 style={{ padding: "14px 14px 0" }}>Most rated</h2>
          {(recent as PlayerStats[]).map((p) => (
            <PlayerRow key={p.player_id} p={p} />
          ))}
        </section>
      )}
    </div>
  );
}
