import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndPinned } from "@/lib/session";
import { JoinPartyForm } from "../../PartyForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Join a party" };

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.replace(/[^0-9a-z]/gi, "").toUpperCase().slice(0, 8);
  const { user, pinned } = await getUserAndPinned();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/party/join/${code}`)}`);
  return (
    <div className="stack" style={{ maxWidth: 440, width: "100%", gap: 18 }}>
      <section className="hero">
        <span className="label">Party invite</span>
        <h1>Join the <span className="hl">party</span></h1>
        <p className="lede">Type your Epic name so your squad knows who you are. Then you can rate each other after matches.</p>
      </section>
      <JoinPartyForm code={code} epicName={pinned?.epic_name ?? ""} compact />
      <Link className="small link" href="/party">What are parties?</Link>
    </div>
  );
}
