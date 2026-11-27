"use client";

import { useActionState, useState } from "react";
import { submitRating, type RateState } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { IconPlus } from "@/components/Icons";
import Slider from "@/components/Slider";

export default function RateForm({ name, leftToday, limit }: { name: string; leftToday: number; limit: number }) {
  const [state, action, pending] = useActionState<RateState, FormData>(submitRating, {});
  const [vals, setVals] = useState<Record<string, number>>({ overall: 50, toxicity: 50, teamwork: 50, comms: 50, skill: 50 });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const set = (k: string) => (v: number) => { setVals((o) => ({ ...o, [k]: v })); setTouched((o) => ({ ...o, [k]: true })); };
  const untouched = ["overall", ...CATEGORIES.map((c) => c.key)].filter((k) => !touched[k]).length;

  return (
    <form action={action} className="stack" style={{ gap: 18 }}>
      <input type="hidden" name="epic_name" value={name} />
      <p className="small muted" style={{ margin: 0 }}>
        {leftToday} of {limit} ratings left today. You can only rate each player once. 100 is always the best score.
      </p>

      <section className="panel cut" style={{ paddingBlock: 6 }}>
        <div className="rate-item">
          <Slider name="overall" label="Overall" low="Worst teammate" high="Best teammate" value={vals.overall} touched={!!touched.overall} onChange={set("overall")} />
        </div>
        {CATEGORIES.map((c) => (
          <div key={c.key} className="rate-item">
            <Slider name={c.key} label={c.label} low={c.low} high={c.high} hint={c.ask} value={vals[c.key]} touched={!!touched[c.key]} onChange={set(c.key)} />
            {open.includes(c.key) ? (
              <div>
                <textarea id={`r-${c.key}`} name={`review_${c.key}`} maxLength={500} autoFocus
                  placeholder={`Your ${c.label.toLowerCase()} review (optional)`} value={text[c.key] ?? ""}
                  onChange={(e) => setText((o) => ({ ...o, [c.key]: e.target.value }))} />
                <div className="counter">{(text[c.key] ?? "").length}/500</div>
              </div>
            ) : (
              <button type="button" className="addrev" onClick={() => setOpen([...open, c.key])}>
                <IconPlus /> Add a {c.label.toLowerCase()} review
              </button>
            )}
          </div>
        ))}
      </section>

      {state.error && <div className="notice err" role="alert">{state.error}</div>}

      <div className="stack" style={{ gap: 8 }}>
        {untouched > 0 && <span className="untouched">{untouched === 5 ? "Drag the sliders to set your scores." : `${untouched} score${untouched === 1 ? "" : "s"} still at 50.`}</span>}
        <button className="btn full" type="submit" disabled={pending}>{pending ? "Saving…" : `Submit rating`}</button>
        <p className="small faint" style={{ margin: 0 }}>Keep reviews about how they played. Slurs are blocked and anyone can report a review.</p>
      </div>
    </form>
  );
}
