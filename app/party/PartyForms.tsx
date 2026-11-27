"use client";

import { useActionState } from "react";
import { createParty, joinParty, type PartyState } from "./actions";

export function CreatePartyForm({ epicName }: { epicName: string }) {
  const [state, action, pending] = useActionState<PartyState, FormData>(createParty, {});
  return (
    <form action={action} className="stack" style={{ gap: 10 }}>
      <input name="name" required minLength={2} maxLength={40} placeholder="Party name, e.g. Friday squad" aria-label="Party name" />
      <input name="epic_name" required minLength={3} maxLength={32} defaultValue={epicName} placeholder="Your Epic name" aria-label="Your Epic name" autoComplete="off" />
      <button className="btn full" type="submit" disabled={pending}>{pending ? "Creating…" : "Create party"}</button>
      {state.error && <div className="notice err" role="alert">{state.error}</div>}
    </form>
  );
}

export function JoinPartyForm({ code = "", epicName, compact = false }: { code?: string; epicName: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<PartyState, FormData>(joinParty, {});
  return (
    <form action={action} className="stack" style={{ gap: 10 }}>
      {compact && code ? <input type="hidden" name="code" value={code} /> : (
        <input name="code" required defaultValue={code} placeholder="Invite code, e.g. 2B9C2985" aria-label="Invite code"
          autoCapitalize="characters" autoComplete="off" maxLength={12} />
      )}
      <input name="epic_name" required minLength={3} maxLength={32} defaultValue={epicName} placeholder="Your Epic name" aria-label="Your Epic name" autoComplete="off" />
      <button className={compact ? "btn full" : "btn ghost full"} type="submit" disabled={pending}>{pending ? "Joining…" : "Join party"}</button>
      {state.error && <div className="notice err" role="alert">{state.error}</div>}
    </form>
  );
}
