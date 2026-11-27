import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserAndPinned } from "@/lib/session";
import { isUuid, type Party } from "@/lib/party";
import PartyRateForm from "./PartyRateForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rate your party" };

export default async function RatePartyPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!isUuid(id)) notFound();
  const { supabase, user } = await getUserAndPinned();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/party/${id}/rate`)}`);
  const party = (await supabase.rpc("party_view", { p_party_id: id })).data as Party | null;
  if (!party) notFound();
  const others = party.members.filter((m) => !m.is_me);
  const wait = party.next_rate_at && new Date(party.next_rate_at) > new Date();

  return (
    <>
      <section className="hero">
        <span className="label">{party.name}</span>
        <h1>Rate this <span className="hl">match</span></h1>
        <p className="lede">How did each teammate play? 100 is always the best score. Only your party sees the results.</p>
      </section>
      {wait || others.length === 0 ? (
        <div className="stack">
          <div className="notice">{others.length === 0 ? "Nobody else is in this party yet." : "You just rated this party. You can rate again after your next match."}</div>
          <Link className="btn ghost full" href={`/party/${id}`}>Back to party</Link>
        </div>
      ) : (
        <PartyRateForm partyId={id} members={others.map((m) => ({ user_id: m.user_id, epic_name: m.epic_name }))} />
      )}
    </>
  );
}
