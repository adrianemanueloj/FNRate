import { IconFlag, IconThumb } from "./Icons";
import { reportReview, toggleHelpful } from "@/app/actions";
import { timeAgo } from "@/lib/categories";
import type { Review } from "@/lib/session";

export default function ReviewItem({ r, voted, back }: { r: Review; voted: boolean; back: string }) {
  return (
    <div className="review">
      <div className="body">{r.body}</div>
      <div className="meta">
        <span>{timeAgo(r.created_at)}</span>
        <span className="row" style={{ gap: 14 }}>
          <form action={toggleHelpful}>
            <input type="hidden" name="review_id" value={r.id} />
            <input type="hidden" name="back" value={back} />
            <button className={`helpful${voted ? " on" : ""}`} type="submit" aria-pressed={voted}>
              <IconThumb /> Helpful{r.helpful > 0 ? ` · ${r.helpful}` : ""}
            </button>
          </form>
          <form action={reportReview}>
            <input type="hidden" name="review_id" value={r.id} />
            <input type="hidden" name="back" value={back} />
            <button className="linkbtn row" style={{ gap: 4 }} type="submit" aria-label="Report this review">
              <IconFlag className="" /> Report
            </button>
          </form>
        </span>
      </div>
    </div>
  );
}
