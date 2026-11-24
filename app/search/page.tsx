import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import PlayerRow from "@/components/PlayerRow";
import { createClient } from "@/lib/supabase/server";
import { cleanName } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

export const dynamic = "force-dynamic";

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
        <h1 className="poster">Find a <span className="grad-text">player</span></h1>
        <p>Search their exact Epic name. You need to find a player here before you can rate them.</p>
        <SearchBox defaultValue={q} autoFocus={!q} large />
      </section>
      {q.length > 0 && q.length < 3 && <p className="muted">Type at least 3 characters.</p>}
      {q.length >= 3 && (
        <>
          {results.length > 0 && (
            <section className="fade-up">
              <div className="sec-head"><h2>Results for “{q}”</h2><span className="small faint">{results.length}</span></div>
              <div className="card flush">{results.map((p) => <PlayerRow key={p.player_id} p={p} />)}</div>
            </section>
          )}
          {!exact && (
            <section className="card stack fade-up d1">
              <div>
                <h3 style={{ wordBreak: "break-all" }}>{q}</h3>
                <div className="muted small">isn&apos;t on FNRate yet. Make sure the spelling matches their Epic name exactly, then be the first to rate them.</div>
              </div>
              <Link className="btn full" href={`/rate/${encodeURIComponent(q)}`}>Be the first to rate {q}</Link>
            </section>
          )}
        </>
      )}
    </>
  );
}
