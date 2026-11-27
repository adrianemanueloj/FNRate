import Link from "next/link";
import { getUserAndPinned } from "@/lib/session";
import { CreatePartyForm, JoinPartyForm } from "./PartyForms";
import type { PartyListItem } from "@/lib/party";

export const dynamic = "force-dynamic";
export const metadata = { title: "Party" };

export default async function PartyHome() {
  const { supabase, user, pinned } = await getUserAndPinned();
  const parties = user ? (((await supabase.rpc("my_parties")).data ?? []) as PartyListItem[]) : [];
  const epic = pinned?.epic_name ?? "";

  return (
    <>
      <section className="hero">
        <h1>Your <span className="hl">party</span></h1>
        <p className="lede">Make a group for your squad. After a match, everyone rates how the others played. Only your party sees these scores.</p>
      </section>

      {!user ? (
        <div className="stack">
          <Link className="btn full" href="/login?next=/party">Sign in to make a party</Link>
        </div>
      ) : (
        <>
          {parties.length > 0 && (
            <section>
              <div className="sec-head"><h2>My parties</h2></div>
              <div className="panel flush">
                {parties.map((p) => (
                  <Link key={p.id} href={`/party/${p.id}`} className="prow">
                    <span className="who">
                      <span className="name"><span>{p.name}</span></span>
                      <span className="tiny faint">{p.member_count} player{p.member_count === 1 ? "" : "s"}{p.is_owner ? " · you made it" : ""}</span>
                    </span>
                    <span className="small link">Open</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <div className="grid2">
            <section className="panel cut">
              <h2>New party</h2>
              <p className="small muted" style={{ marginTop: 4 }}>You’ll get an invite link to send to your squad.</p>
              <CreatePartyForm epicName={epic} />
            </section>
            <section className="panel cut">
              <h2>Join with a code</h2>
              <p className="small muted" style={{ marginTop: 4 }}>Got a code from a friend? Put it here.</p>
              <JoinPartyForm epicName={epic} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
