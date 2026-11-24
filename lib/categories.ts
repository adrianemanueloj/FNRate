export const CATEGORIES = [
  { key: "toxicity", label: "Toxicity", low: "Very toxic", high: "Not toxic" },
  { key: "teamwork", label: "Teamwork", low: "Solo player", high: "Team player" },
  { key: "comms", label: "Comms", low: "Silent / useless", high: "Great callouts" },
  { key: "skill", label: "Skill", low: "Beginner", high: "Cracked" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function isCategory(v: string | undefined): v is CategoryKey {
  return CATEGORIES.some((c) => c.key === v);
}

export function scoreColor(n: number | null | undefined) {
  if (n == null) return "var(--muted)";
  if (n >= 70) return "var(--good)";
  if (n >= 40) return "var(--ok)";
  return "var(--bad)";
}

export function profileHref(name: string) {
  return `/p/${encodeURIComponent(name)}`;
}

export function cleanName(raw: string | undefined | null) {
  return (raw ?? "").trim().replace(/\s+/g, " ").slice(0, 32);
}
