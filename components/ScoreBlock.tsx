import CountUp from "./CountUp";
import { scoreColor, verdict } from "@/lib/categories";

// Big overall number with a 20-segment meter under it.
export default function ScoreBlock({ value, count }: { value: number | null; count: number }) {
  const c = scoreColor(value);
  const lit = value == null ? 0 : Math.max(1, Math.round(value / 5));
  return (
    <div className="scorebox">
      <div className="overall">
        <span className="big" style={{ color: c }} aria-label={value == null ? "Not rated" : `${value} out of 100`}>
          {value == null ? "–" : <CountUp value={value} />}
        </span>
        <span className="side">
          <span className="of">/ 100 overall</span>
          <span className="verdict">{verdict(value)}</span>
          <span className="small faint">{count} rating{count === 1 ? "" : "s"}</span>
        </span>
      </div>
      <div className="meter" aria-hidden="true" style={{ ["--c" as string]: c }}>
        {Array.from({ length: 20 }, (_, i) => (
          <i key={i} className={i < lit ? "lit" : ""} style={{ ["--n" as string]: i }} />
        ))}
      </div>
    </div>
  );
}
