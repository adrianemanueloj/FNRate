"use client";

import { useActionState, useState } from "react";
import { submitRating, type RateState } from "@/app/actions";
import { CATEGORIES, scoreColor } from "@/lib/categories";
import { IconPlus } from "@/components/Icons";

function Slider({ name, label, low, high, value, onChange }: {
  name: string; label: string; low: string; high: string; value: number; onChange: (v: number) => void;
}) {
  const c = scoreColor(value);
  return (
    <div className="slider">
      <div className="head">
        <label className="lbl" htmlFor={`s-${name}`}>{label}</label>
        <span className="v" style={{ color: c }}>{value}</span>
      </div>
      <input id={`s-${name}`} type="range" name={name} min={1} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--c" as string]: c, ["--p" as string]: `${value}%` }} />
      <div className="ends"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export default function RateForm({ name, leftToday, limit }: { name: string; leftToday: number; limit: number }) {
  const [state, action, pending] = useActionState<RateState, FormData>(submitRating, {});
  const [vals, setVals] = useState<Record<string, number>>({ overall: 50, toxicity: 50, teamwork: 50, comms: 50, skill: 50 });
  const [open, setOpen] = useState<string[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const set = (k: string) => (v: number) => setVals((o) => ({ ...o, [k]: v }));

  return (
    <form action={action} className="stack" style={{ gap: 14 }}>
      <input type="hidden" name="epic_name" value={name} />
      <div className="notice info small">
        <span>You have <b>{leftToday} of {limit}</b> ratings left today. You can only rate each player once, so make it count.</span>
      </div>

      <section className="card glow">
        <Slider name="overall" label="Overall" low="Worst teammate" high="Best teammate" value={vals.overall} onChange={set("overall")} />
      </section>

      {CATEGORIES.map((c) => (
        <section key={c.key} className="card stack" style={{ gap: 8 }}>
          <Slider name={c.key} label={c.label} low={c.low} high={c.high} value={vals[c.key]} onChange={set(c.key)} />
          {open.includes(c.key) ? (
            <div>
              <textarea id={`r-${c.key}`} name={`review_${c.key}`} maxLength={500} autoFocus
                placeholder={`${c.ask} (optional)`} value={text[c.key] ?? ""}
                onChange={(e) => setText((o) => ({ ...o, [c.key]: e.target.value }))} />
              <div className="counter">{(text[c.key] ?? "").length}/500</div>
            </div>
          ) : (
            <button type="button" className="addrev" onClick={() => setOpen([...open, c.key])}>
              <IconPlus className="" /> Write a {c.label.toLowerCase()} review
            </button>
          )}
        </section>
      ))}

      {state.error && <div className="notice err" role="alert">{state.error}</div>}

      <button className="btn full" type="submit" disabled={pending}>
        {pending ? "Submitting…" : `Submit rating for ${name}`}
      </button>
      <p className="small faint" style={{ textAlign: "center", margin: 0 }}>
        Keep reviews about how they played. Hate speech and slurs are blocked, and anyone can report a review.
      </p>
    </form>
  );
}
