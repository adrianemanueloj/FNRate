"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cleanName } from "@/lib/categories";

export type PartyState = { error?: string };

async function needUser(next: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return supabase;
}

function friendly(msg: string) {
  if (/function .* does not exist|could not find the function/i.test(msg)) return "Parties aren’t switched on yet. Try again soon.";
  return msg;
}

export async function createParty(_prev: PartyState, form: FormData): Promise<PartyState> {
  const supabase = await needUser("/party");
  const { data, error } = await supabase.rpc("create_party", {
    p_name: String(form.get("name") ?? "").trim().slice(0, 40),
    p_epic_name: cleanName(form.get("epic_name") as string),
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/party");
  redirect(`/party/${data}?new=1`);
}

export async function joinParty(_prev: PartyState, form: FormData): Promise<PartyState> {
  const code = String(form.get("code") ?? "").replace(/[^0-9a-z]/gi, "").toUpperCase().slice(0, 8);
  const supabase = await needUser(`/party/join/${code}`);
  if (code.length !== 8) return { error: "Invite codes are 8 letters and numbers." };
  const { data, error } = await supabase.rpc("join_party", { p_code: code, p_epic_name: cleanName(form.get("epic_name") as string) });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/party");
  redirect(`/party/${data}`);
}

export async function leaveParty(form: FormData) {
  const id = String(form.get("party_id") ?? "");
  const supabase = await needUser(`/party/${id}`);
  await supabase.rpc("leave_party", { p_party_id: id });
  revalidatePath("/party");
  redirect("/party");
}

export async function rateParty(_prev: PartyState, form: FormData): Promise<PartyState> {
  const id = String(form.get("party_id") ?? "");
  const supabase = await needUser(`/party/${id}/rate`);
  const ids = form.getAll("member").map(String);
  const score = (k: string) => {
    const n = Math.round(Number(form.get(k)));
    return Number.isFinite(n) ? Math.min(100, Math.max(1, n)) : 50;
  };
  const ratings = ids
    .filter((u) => form.get(`skip_${u}`) !== "on")
    .map((u) => ({
      user_id: u,
      overall: Math.round((score(`toxicity_${u}`) + score(`teamwork_${u}`) + score(`comms_${u}`) + score(`skill_${u}`)) / 4),
      toxicity: score(`toxicity_${u}`), teamwork: score(`teamwork_${u}`),
      comms: score(`comms_${u}`), skill: score(`skill_${u}`),
    }));
  if (ratings.length === 0) return { error: "Rate at least one teammate, or go back." };
  const { error } = await supabase.rpc("rate_party", { p_party_id: id, p_ratings: ratings });
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/party/${id}`);
  redirect(`/party/${id}?rated=1`);
}
