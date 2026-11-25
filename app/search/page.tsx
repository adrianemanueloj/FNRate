import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import PlayerRow from "@/components/PlayerRow";
import { createClient } from "@/lib/supabase/server";
import { cleanName } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search players" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = cleanName((await searchParams).q);
  const supabase = await createClient();
  let results: PlayerStats[] = [];
  if (q.length >= 3) {
    const escaped = q.replace(/[\\%_]/g, (m) => "\\" + m);
    const { data } = await supabase.from("player_stats").select("*").ilike("epic_name", `%${escaped}%`)
      .order("rating_count", { ascending: false }).limit(20);
    results = (data as PlayerStats[]) ?? [];
  }
  const exact = results.some((r) => r.epic_name.toLowerCase() === q.toLowerCase());

  return (
    <>
      <section className="hero">
        <h1>Find a player</h1>
        <p className="lede">Use their exact Epic name. You have to find someone here before you can rate them.</p>
        <SearchBox defaultValue={q} autoFocus={!q} />
      </section>
      {q.length > 0 && q.length < 3 && <p className="muted">Type at least 3 characters.</p>}
      {q.length >= 3 && (
        <>
          {!exact && (
            <section className="panel cut stack">
              <div>
                <span className="label">Not rated yet</span>
                <h3 style={{ wordBreak: "break-all", marginTop: 4 }}>{q}</h3>
                <p className="small muted" style={{ margin: "4px 0 0" }}>Check the spelling matches their Epic name, capitals don’t matter. Then be the first to rate them.</p>
              </div>
              <Link className="btn full" href={`/rate/${encodeURIComponent(q)}`}>Rate {q}</Link>
            </section>
          )}
          {results.length > 0 && (
            <section>
              <div className="sec-head"><h2>{exact ? "Results" : "Similar names"}</h2><span className="small faint">{results.length}</span></div>
              <div className="panel flush">{results.map((p) => <PlayerRow key={p.player_id} p={p} />)}</div>
            </section>
          )}
        </>
      )}
    </>
  );
}
