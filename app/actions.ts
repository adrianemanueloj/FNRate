"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, cleanName, profileHref } from "@/lib/categories";

function safeBack(v: FormDataEntryValue | null) {
  const s = String(v ?? "/");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

function clampScore(v: FormDataEntryValue | null) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(1, n));
}

export type RateState = { error?: string };

export async function submitRating(_prev: RateState, form: FormData): Promise<RateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name = cleanName(form.get("epic_name") as string);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/rate/${name}`)}`);

  const reviews: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const t = String(form.get(`review_${c.key}`) ?? "").trim().slice(0, 500);
    if (t) {
      if (t.length < 3) return { error: `Your ${c.label} review is too short.` };
      reviews[c.key] = t;
    }
  }

  const { error } = await supabase.rpc("submit_rating", {
    p_epic_name: name,
    // Overall is the average of the four categories (the database enforces this too).
    p_overall: Math.round(CATEGORIES.reduce((sum, c) => sum + clampScore(form.get(c.key)), 0) / CATEGORIES.length),
    p_toxicity: clampScore(form.get("toxicity")),
    p_teamwork: clampScore(form.get("teamwork")),
    p_comms: clampScore(form.get("comms")),
    p_skill: clampScore(form.get("skill")),
    p_reviews: reviews,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(`${profileHref(name)}?rated=1`);
}

export async function reportReview(form: FormData) {
  const supabase = await createClient();
  const back = safeBack(form.get("back"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  await supabase.rpc("report_review", { p_review_id: String(form.get("review_id")) });
  const sep = back.includes("?") ? "&" : "?";
  redirect(`${back}${sep}reported=1#reviews`);
}

export async function toggleHelpful(form: FormData) {
  const supabase = await createClient();
  const back = safeBack(form.get("back"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  const { error } = await supabase.rpc("toggle_helpful", { p_review_id: String(form.get("review_id")) });
  const sep = back.includes("?") ? "&" : "?";
  redirect(error ? `${back}${sep}err=${encodeURIComponent(error.message)}#reviews` : `${back}#reviews`);
}

export async function pinPlayer(form: FormData) {
  const supabase = await createClient();
  const back = safeBack(form.get("back"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  const id = String(form.get("player_id") ?? "");
  await supabase.rpc("pin_player", { p_player_id: id || null });
  revalidatePath("/", "layout");
  redirect(back);
}
