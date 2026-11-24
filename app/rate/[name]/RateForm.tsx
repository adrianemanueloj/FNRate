"use client";

import { useActionState, useState } from "react";
import { submitRating, type RateState } from "@/app/actions";
import { CATEGORIES, scoreColor } from "@/lib/categories";

function Slider({
  name,
  label,
  low,
  high,
}: {
  name: string;
  label: string;
  low: string;
  high: string;
}) {
  const [v, setV] = useState(50);
  return (
    <div className="slider">
      <div className="head">
        <span style={{ fontWeight: 700 }}>{label}</span>
        <b style={{ color: scoreColor(v) }}>{v}</b>
      </div>
      <input
        type="range"
        name={name}
        min={1}
        max={100}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
      />
      <div className="ends">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export default function RateForm({ name, leftToday }: { name: string; leftToday: number }) {
  const [state, action, pending] = useActionState<RateState, FormData>(submitRating, {});
  const [open, setOpen] = useState<string[]>([]);

  return (
    <form action={action} className="stack">
      <input type="hidden" name="epic_name" value={name} />
      <div className="notice info small">
        You have <b>{leftToday}</b> rating{leftToday === 1 ? "" : "s"} left today. You can only rate each
        player once, so make it count.
      </div>

      <section className="panel">
        <Slider name="overall" label="Overall" low="Worst teammate" high="Best teammate" />
      </section>

      {CATEGORIES.map((c) => (
        <section key={c.key} className="panel">
          <Slider name={c.key} label={c.label} low={c.low} high={c.high} />
          {open.includes(c.key) ? (
            <textarea
              name={`review_${c.key}`}
              maxLength={500}
              placeholder={`What was their ${c.label.toLowerCase()} like? (optional)`}
              style={{ marginTop: 8 }}
              autoFocus
            />
          ) : (
            <button type="button" className="linkbtn" onClick={() => setOpen([...open, c.key])} style={{ marginTop: 6 }}>
              + Add a {c.label.toLowerCase()} review
            </button>
          )}
        </section>
      ))}

      {state.error && <div className="notice err">{state.error}</div>}

      <button className="btn full" type="submit" disabled={pending}>
        {pending ? "Submitting…" : `Submit rating for ${name}`}
      </button>
      <p className="muted small" style={{ textAlign: "center", margin: 0 }}>
        Keep reviews about gameplay. Hate speech and slurs are blocked.
      </p>
    </form>
  );
}
