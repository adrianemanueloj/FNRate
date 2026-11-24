import { createClient } from "./supabase/server";

export type PlayerStats = {
  player_id: string;
  epic_name: string;
  rating_count: number;
  overall: number | null;
  toxicity: number | null;
  teamwork: number | null;
  comms: number | null;
  skill: number | null;
};

export async function getUserAndPinned() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, pinned: null as PlayerStats | null };
  const { data: settings } = await supabase
    .from("user_settings")
    .select("pinned_player_id")
    .maybeSingle();
  let pinned: PlayerStats | null = null;
  if (settings?.pinned_player_id) {
    const { data } = await supabase
      .from("player_stats")
      .select("*")
      .eq("player_id", settings.pinned_player_id)
      .maybeSingle();
    pinned = data;
  }
  return { supabase, user, pinned };
}
