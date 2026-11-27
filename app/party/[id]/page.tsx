import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserAndPinned } from "@/lib/session";
import { CATEGORIES, profileHref, scoreColor, timeAgo, verdict } from "@/lib/categories";
import { isUuid, type Party } from "@/lib/party";
import { leaveParty } from "../actions";
import InviteBox from "../InviteBox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Party" };

export default async function PartyPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ rated?: string; new?: string }>;
}) {
  const id = (await params).id;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const { supabase, user } = await getUserAndPinned();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/party/${id}`)}`);
  const party = (await supabase.rpc("party_view", { p_party_id: id })).data as Party | null;
  if (!party) notFound();

  const others = party.members.filter((m) => !m.is_me);
  const waitUntil = party.next_rate_at && new Date(party.next_rate_at) > new Date() ? new Date(party.next_rate_at) : null;
  const waitMin = waitUntil ? Math.max(1, Math.ceil((waitUntil.getTime() - Date.now()) / 60000)) : 0;
  let rank = 0;

  return (
    <>
      <section className="hero">
        <span className="label">Party · {party.members.length} player{party.members.length === 1 ? "" : "s"}</span>
        <h1 style={{ textTransform: "none", wordBreak: "break-word" }}>{party.name}</h1>
        <p className="lede">Scores here come only from your party and don’t change anyone’s public profile.</p>
      </section>

      {sp.rated && <div className="notice ok" role="status">Saved! Your party’s scores are updated.</div>}

      {(sp.new || others.length === 0) && <InviteBox code={party.code} name={party.name} />}

      <div className="stack" style={{ gap: 8 }}>
        {others.length === 0 ? (
          <div className="notice">Invite at least one teammate before you can rate.</div>
        ) : waitUntil ? (
          <div className="notice">You rated your party {timeAgo(new Date(waitUntil.getTime() - 15 * 60000).toISOString())}. You can rate again in {waitMin} min, after your next match.</div>
        ) : (
          <Link className="btn full" href={`/party/${party.id}/rate`}>Rate this match</Link>
        )}
      </div>

      <section>
        <div className="sec-head"><h2>Party board</h2><span className="tiny faint">{party.rounds} rating{party.rounds === 1 ? "" : "s"} sent</span></div>
        <div className="panel flush">
          {party.members.map((m) => {
            const r = m.overall != null ? ++rank : null;
            return (
              <div key={m.user_id} className="pmember">
                <span className={`rank${r === 1 ? " r1" : ""}`}>{r ?? "–"}</span>
                <span className="stack" style={{ gap: 0, minWidth: 0 }}>
                  <Link href={profileHref(m.epic_name)} className="name" style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.epic_name}{m.is_me && <span className="you">You</span>}
                  </Link>
                  <span className="tiny faint">{m.ratings > 0 ? `${verdict(m.overall)} · ${m.ratings} rating${m.ratings === 1 ? "" : "s"}` : "No party ratings yet"}</span>
                </span>
                <span className="score" style={{ color: scoreColor(m.overall) }}>{m.overall ?? "–"}</span>
                {m.ratings > 0 && (
                  <div className="mini-stats">
                    {CATEGORIES.map((c) => (
                      <span key={c.key}>
                        <span className="v" style={{ color: scoreColor(m[c.key]) }}>{m[c.key] ?? "–"}</span>
                        <span className="k">{c.label}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {!sp.new && others.length > 0 && <InviteBox code={party.code} name={party.name} />}

      <form action={leaveParty}>
        <input type="hidden" name="party_id" value={party.id} />
        <button className="linkbtn small" type="submit">{party.is_owner ? "Delete this party (for everyone)" : "Leave this party"}</button>
      </form>
    </>
  );
}
