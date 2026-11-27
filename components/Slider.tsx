import { scoreColor } from "@/lib/categories";

export default function Slider({ name, label, low, high, hint, value, touched, onChange }: {
  name: string; label: string; low: string; high: string; hint?: string; value: number; touched: boolean; onChange: (v: number) => void;
}) {
  const c = touched ? scoreColor(value) : "var(--faint)";
  return (
    <div className="slider">
      <div className="head">
        <label htmlFor={`s-${name}`}>{label}</label>
        <span className="v" style={{ color: c }}>{value}</span>
      </div>
      {hint && <div className="hint">{hint}</div>}
      <input id={`s-${name}`} type="range" name={name} min={1} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--c" as string]: c, ["--p" as string]: `${value}%` }} />
      <div className="ends"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}
