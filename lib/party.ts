export type PartyMember = {
  user_id: string; epic_name: string; is_me: boolean; is_owner: boolean; ratings: number;
  overall: number | null; toxicity: number | null; teamwork: number | null; comms: number | null; skill: number | null;
};
export type Party = {
  id: string; name: string; code: string; is_owner: boolean; rounds: number;
  next_rate_at: string | null; members: PartyMember[];
};
export type PartyListItem = { id: string; name: string; member_count: number; is_owner: boolean };

export function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
