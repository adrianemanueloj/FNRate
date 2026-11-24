import Link from "next/link";
import PlayerRow from "@/components/PlayerRow";
import { createClient } from "@/lib/supabase/server";
import { LEADERBOARDS, MIN_RATINGS_FOR_BOARDS } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Leaderboards({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tabKey = (await searchParams).tab;
  const tab = LEADERBOARDS.find((b) => b.key === tabKey) ?? LEADERBOARDS[0];
  const supabase = await createClient();
  const { data } = await supabase.rpc("leaderboard", { p_kind: tab.key, p_limit: 50 });
  const list = (data ?? []) as PlayerStats[];

  return (
    <>
      <section className="hero">
        <span className="eyebrow grad-text">Leaderboards</span>
        <h1 className="poster">{tab.label}</h1>
        <p>{tab.blurb}. Players need at least {MIN_RATINGS_FOR_BOARDS} ratings to show up.</p>
      </section>
      <nav className="tabs" aria-label="Leaderboard">
        {LEADERBOARDS.map((b) => (
          <Link key={b.key} href={`/leaderboards?tab=${b.key}`} className={b.key === tab.key ? "on" : ""}>{b.label}</Link>
        ))}
      </nav>
      <section className="card flush fade-up" key={tab.key}>
        {list.length ? (
          list.map((p, i) => (
            <PlayerRow key={p.player_id} p={p} rank={i + 1} stat={tab.stat}
              sub={tab.stat === "overall" ? `${p.rating_count} ratings` : `${p.rating_count} ratings · overall ${p.overall}`} />
          ))
        ) : (
          <div className="empty">No players have {MIN_RATINGS_FOR_BOARDS}+ ratings yet. Start rating your teammates!</div>
        )}
      </section>
    </>
  );
}
