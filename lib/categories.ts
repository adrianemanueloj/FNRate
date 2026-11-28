export const CATEGORIES = [
  { key: "toxicity", label: "Toxicity", low: "Very toxic", high: "Not toxic", ask: "How did they act when things went wrong?" },
  { key: "teamwork", label: "Teamwork", low: "Solo player", high: "Team player", ask: "Did they share loot, revive and stick together?" },
  { key: "comms", label: "Comms", low: "Silent", high: "Great callouts", ask: "Did they call out enemies and plans?" },
  { key: "skill", label: "Skill", low: "Beginner", high: "Cracked", ask: "How good were their aim, building and editing?" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function isCategory(v: string | undefined): v is CategoryKey {
  return CATEGORIES.some((c) => c.key === v);
}

export function catLabel(k: string) {
  return CATEGORIES.find((c) => c.key === k)?.label ?? k;
}

export function scoreColor(n: number | null | undefined) {
  if (n == null) return "var(--faint)";
  if (n >= 70) return "var(--good)";
  if (n >= 40) return "var(--ok)";
  return "var(--bad)";
}

export function verdict(n: number | null | undefined) {
  if (n == null) return "Not rated yet";
  if (n >= 90) return "Dream teammate";
  if (n >= 75) return "Great teammate";
  if (n >= 60) return "Solid teammate";
  if (n >= 40) return "Mixed reviews";
  if (n >= 20) return "Rough to play with";
  return "Avoid in your squad";
}

export function profileHref(name: string) {
  return `/p/${encodeURIComponent(name)}`;
}

export function cleanName(raw: string | undefined | null) {
  return (raw ?? "").trim().replace(/\s+/g, " ").slice(0, 32);
}

export function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const LEADERBOARDS = [
  { key: "best", label: "Best teammates", stat: "overall", blurb: "Highest overall score" },
  { key: "toxic", label: "Most toxic", stat: "toxicity", blurb: "Lowest toxicity score (100 = not toxic)" },
  { key: "comms", label: "Best comms", stat: "comms", blurb: "Highest comms score" },
  { key: "skill", label: "Most skilled", stat: "skill", blurb: "Highest skill score" },
] as const;
export type BoardKey = (typeof LEADERBOARDS)[number]["key"];
export const MIN_RATINGS_FOR_BOARDS = 2;
