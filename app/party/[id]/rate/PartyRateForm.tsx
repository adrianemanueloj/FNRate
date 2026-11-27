"use client";

import { useActionState, useState } from "react";
import Slider from "@/components/Slider";
import { CATEGORIES } from "@/lib/categories";
import { rateParty, type PartyState } from "../../actions";

type M = { user_id: string; epic_name: string };

export default function PartyRateForm({ partyId, members }: { partyId: string; members: M[] }) {
  const [state, action, pending] = useActionState<PartyState, FormData>(rateParty, {});
  const [vals, setVals] = useState<Record<string, number>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [skip, setSkip] = useState<Record<string, boolean>>({});
  const set = (k: string) => (v: number) => { setVals((o) => ({ ...o, [k]: v })); setTouched((o) => ({ ...o, [k]: true })); };
  const rating = members.filter((m) => !skip[m.user_id]).length;

  return (
    <form action={action} className="stack" style={{ gap: 18 }}>
      <input type="hidden" name="party_id" value={partyId} />
      {members.map((m) => {
        const off = !!skip[m.user_id];
        return (
          <section key={m.user_id} className="panel cut" style={{ paddingBlock: 6 }}>
            <input type="hidden" name="member" value={m.user_id} />
            <div className="spread" style={{ padding: "10px 0 4px", gap: 10 }}>
              <h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{m.epic_name}</h3>
              <label className="skip">
                <input type="checkbox" name={`skip_${m.user_id}`} checked={off}
                  onChange={(e) => setSkip((o) => ({ ...o, [m.user_id]: e.target.checked }))} />
                Not in this match
              </label>
            </div>
            {!off && (
              <>
                <div className="rate-item">
                  <Slider name={`overall_${m.user_id}`} label="Overall" low="Worst teammate" high="Best teammate"
                    value={vals[`overall_${m.user_id}`] ?? 50} touched={!!touched[`overall_${m.user_id}`]} onChange={set(`overall_${m.user_id}`)} />
                </div>
                {CATEGORIES.map((c) => {
                  const k = `${c.key}_${m.user_id}`;
                  return (
                    <div key={c.key} className="rate-item">
                      <Slider name={k} label={c.label} low={c.low} high={c.high} value={vals[k] ?? 50} touched={!!touched[k]} onChange={set(k)} />
                    </div>
                  );
                })}
              </>
            )}
          </section>
        );
      })}
      {state.error && <div className="notice err" role="alert">{state.error}</div>}
      <div className="stack" style={{ gap: 8 }}>
        <button className="btn full" type="submit" disabled={pending || rating === 0}>
          {pending ? "Saving…" : rating === 0 ? "Pick someone to rate" : `Save ratings for ${rating} teammate${rating === 1 ? "" : "s"}`}
        </button>
        <p className="small faint" style={{ margin: 0 }}>Nobody sees who gave which score. You can rate again after 15 minutes, so one rating per match.</p>
      </div>
    </form>
  );
}
