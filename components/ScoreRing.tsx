import CountUp from "./CountUp";
import { scoreColor } from "@/lib/categories";

export default function ScoreRing({ value, size = "lg" }: { value: number | null; size?: "lg" | "sm" }) {
  const r = 44;
  const len = 2 * Math.PI * r;
  const v = value ?? 0;
  const off = len * (1 - v / 100);
  const c = scoreColor(value);
  return (
    <div className={`ring${size === "sm" ? " sm" : ""}`} role="img" aria-label={value == null ? "Not rated yet" : `Overall ${value} out of 100`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <circle className="track" cx="50" cy="50" r={r} fill="none" strokeWidth="7" />
        {value != null && (
          <>
            <circle className="val" cx="50" cy="50" r={r} fill="none" stroke={c} strokeWidth="7" opacity=".45" filter="url(#glow)"
              strokeDasharray={len} strokeDashoffset={off} style={{ ["--len" as string]: len }} />
            <circle className="val" cx="50" cy="50" r={r} fill="none" stroke={c} strokeWidth="7"
              strokeDasharray={len} strokeDashoffset={off} style={{ ["--len" as string]: len }} />
          </>
        )}
      </svg>
      <div className="center">
        <div className="big" style={{ color: c }}>{value == null ? "–" : <CountUp value={value} />}</div>
        <div className="of">{size === "sm" ? "overall" : "overall / 100"}</div>
      </div>
    </div>
  );
}
