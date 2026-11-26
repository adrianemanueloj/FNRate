// Cross-device sign-in. The device that asks for an email link makes a random
// id and puts it in the link. If the link is opened somewhere else (e.g. a
// phone), that device hands the session to the waiting one through Supabase.
const KEY = "fnrate_handoff";

export function newHandoffId() {
  const id = crypto.randomUUID();
  try { localStorage.setItem(KEY, id); } catch {}
  return id;
}

export function myHandoffId(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function clearHandoffId() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function isUuid(s: string | null): s is string {
  return !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
