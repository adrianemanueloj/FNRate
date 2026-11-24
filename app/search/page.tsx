import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import PlayerRow from "@/components/PlayerRow";
import { createClient } from "@/lib/supabase/server";
import { cleanName } from "@/lib/categories";
import type { PlayerStats } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = cleanName((await searchParams).q);
  const supabase = await createClient();
  let results: PlayerStats[] = [];
  if (q.length >= 3) {
    const escaped = q.replace(/[\\%_]/g, (m) => "\\" + m);
    const { data } = await supabase
      .from("player_stats")
      .select("*")
      .ilike("epic_name", `%${escaped}%`)
      .order("rating_count", { ascending: false })
      .limit(20);
    results = (data as PlayerStats[]) ?? [];
  }
  const exact = results.some((r) => r.epic_name.toLowerCase() === q.toLowerCase());

  return (
    <div className="stack">
      <SearchBox defaultValue={q} />
      {q.length < 3 ? (
        <p className="muted">Type at least 3 characters.</p>
      ) : (
        <>
          {results.length > 0 && (
            <section className="panel" style={{ padding: 0 }}>
              {results.map((p) => (
                <PlayerRow key={p.player_id} p={p} />
              ))}
            </section>
          )}
          {!exact && (
            <section className="panel stack">
              <div>
                <b>{q}</b> isn&apos;t on FNRate yet.
                <div className="muted small">
                  Check the spelling matches their Epic name exactly, then be the first to rate them.
                </div>
              </div>
              <Link className="btn full" href={`/rate/${encodeURIComponent(q)}`}>
                Rate {q}
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}
