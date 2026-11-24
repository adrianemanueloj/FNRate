import Link from "next/link";
import { redirect } from "next/navigation";
import RateForm from "./RateForm";
import { getUserAndPinned, type RatingStatus } from "@/lib/session";
import { cleanName, profileHref } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function RatePage({ params }: { params: Promise<{ name: string }> }) {
  const name = cleanName(decodeURIComponent((await params).name));
  const { supabase, user, pinned } = await getUserAndPinned();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/rate/${name}`)}`);
  if (name.length < 3) redirect("/search");

  const { data } = await supabase.rpc("my_rating_status", { p_epic_name: name });
  const s = (data ?? {}) as RatingStatus;
  const isMine = pinned?.epic_name.toLowerCase() === name.toLowerCase();

  let block: string | null = null;
  if (isMine) block = "This is the account you pinned as yours, so you can't rate it.";
  else if (s.already_rated) block = "You already rated this player. You can only rate each player once.";
  else if ((s.left_today ?? 0) <= 0) block = `You've used all ${s.daily_limit ?? 3} of your ratings today. Come back tomorrow!`;

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Rating</span>
        <h1 style={{ wordBreak: "break-all" }}>{name}</h1>
      </section>
      {block ? (
        <div className="stack">
          <div className="notice info">{block}</div>
          {!isMine && !s.already_rated && !s.plus && (
            <Link className="btn full" href="/premium">Get more ratings with FNRate Plus</Link>
          )}
          <Link className="btn ghost full" href={profileHref(name)}>Back to profile</Link>
        </div>
      ) : (
        <RateForm name={name} leftToday={s.left_today ?? 0} limit={s.daily_limit ?? 3} />
      )}
    </>
  );
}
