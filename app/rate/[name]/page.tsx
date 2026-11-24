import Link from "next/link";
import { redirect } from "next/navigation";
import RateForm from "./RateForm";
import { getUserAndPinned } from "@/lib/session";
import { cleanName, profileHref } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function RatePage({ params }: { params: Promise<{ name: string }> }) {
  const name = cleanName(decodeURIComponent((await params).name));
  const { supabase, user, pinned } = await getUserAndPinned();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/rate/${name}`)}`);
  if (name.length < 3) redirect("/");

  const { data: status } = await supabase.rpc("my_rating_status", { p_epic_name: name });
  const s = (status ?? {}) as { already_rated?: boolean; left_today?: number };
  const isMine = pinned?.epic_name.toLowerCase() === name.toLowerCase();

  let block: string | null = null;
  if (isMine) block = "This is the account you pinned as yours, so you can't rate it.";
  else if (s.already_rated) block = "You already rated this player. You can only rate each player once.";
  else if ((s.left_today ?? 0) <= 0) block = "You've used your 3 ratings for today. Come back tomorrow!";

  return (
    <div className="stack">
      <div>
        <div className="muted small">Rating</div>
        <h1 style={{ marginTop: 0, wordBreak: "break-all" }}>{name}</h1>
      </div>
      {block ? (
        <div className="stack">
          <div className="notice info">{block}</div>
          <Link className="btn ghost full" href={profileHref(name)}>Back to profile</Link>
        </div>
      ) : (
        <RateForm name={name} leftToday={s.left_today ?? 0} />
      )}
    </div>
  );
}
