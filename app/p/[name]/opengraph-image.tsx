import { ImageResponse } from "next/og";
import { nameFromParam, isValidName } from "@/lib/names";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FNRate player card";

type Stats = { epic_name: string; rating_count: number; overall: number | null; toxicity: number | null; teamwork: number | null; comms: number | null; skill: number | null };

const col = (n: number | null) => (n == null ? "#6a7096" : n >= 70 ? "#2fd88f" : n >= 40 ? "#f5c044" : "#ff5470");

async function load(name: string): Promise<Stats | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !isValidName(name)) return null;
  const r = await fetch(`${url}/rest/v1/player_stats?select=*&epic_name=eq.${encodeURIComponent(name)}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).catch(() => null);
  if (!r || !r.ok) return null;
  const rows = (await r.json()) as Stats[];
  return rows[0] ?? null;
}

export default async function Image({ params }: { params: Promise<{ name: string }> }) {
  const name = nameFromParam((await params).name);
  const p = await load(name);
  const rated = p && p.rating_count > 0;
  const cats: [string, number | null][] = rated
    ? [["Toxicity", p!.toxicity], ["Teamwork", p!.teamwork], ["Comms", p!.comms], ["Skill", p!.skill]]
    : [];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0c0e1a", color: "#eceefa", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 800 }}>
          <div style={{ width: 40, height: 40, background: "#7c5cff" }} />
          <span>FN</span><span style={{ color: "#9479ff", marginLeft: -14 }}>RATE</span>
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, marginTop: 40, maxWidth: 1072, overflow: "hidden" }}>{p?.epic_name ?? name}</div>
        {rated ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 56, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <span style={{ fontSize: 200, fontWeight: 800, lineHeight: 0.85, color: col(p!.overall) }}>{p!.overall}</span>
              <span style={{ fontSize: 36, color: "#6a7096", marginBottom: 12 }}>/100</span>
            </div>
            <div style={{ display: "flex", gap: 32, marginBottom: 14 }}>
              {cats.map(([k, v]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 56, fontWeight: 800, color: col(v) }}>{v}</span>
                  <span style={{ fontSize: 22, color: "#9ba1c4", textTransform: "uppercase" }}>{k}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 40, color: "#9ba1c4", marginTop: 24 }}>No ratings yet. Played with them? Rate them.</div>
        )}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 26, color: "#9ba1c4" }}>
          {rated ? `Rated by ${p!.rating_count} player${p!.rating_count === 1 ? "" : "s"} · fn-rate.vercel.app` : "fn-rate.vercel.app"}
        </div>
      </div>
    ),
    size
  );
}
