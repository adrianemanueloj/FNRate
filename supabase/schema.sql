-- FNRate database setup.
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run.
-- Safe to run once on a fresh project.

create extension if not exists citext;

-- Players (Epic names). Created by the first person who rates them.
create table public.players (
  id uuid primary key default gen_random_uuid(),
  epic_name citext not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint epic_name_length check (char_length(epic_name) between 3 and 32)
);

-- One rating per (rater, player). Every score is 1-100, higher is better.
-- "toxicity" is stored so that 100 = not toxic at all.
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  overall smallint not null check (overall between 1 and 100),
  toxicity smallint not null check (toxicity between 1 and 100),
  teamwork smallint not null check (teamwork between 1 and 100),
  comms smallint not null check (comms between 1 and 100),
  skill smallint not null check (skill between 1 and 100),
  created_at timestamptz not null default now(),
  unique (player_id, rater_id)
);
create index ratings_rater_created on public.ratings (rater_id, created_at);

-- Written reviews always belong to one category.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references public.ratings(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('toxicity','teamwork','comms','skill')),
  body text not null check (char_length(body) between 3 and 500),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (rating_id, category)
);
create index reviews_player_category on public.reviews (player_id, category, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

-- Each signed-in user can pin one player profile as "my account".
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pinned_player_id uuid references public.players(id) on delete set null
);

-- Word filter. Add or remove words in Supabase > Table Editor > banned_words.
create table public.banned_words (word text primary key);
insert into public.banned_words (word) values
  ('nigger'),('nigga'),('faggot'),('fag'),('retard'),('kys'),('kill yourself'),
  ('cunt'),('tranny'),('chink'),('spic'),('kike'),('rape'),('whore'),('slut');

-- Row level security: the website can only read what is listed here,
-- and can only write through the functions below.
alter table public.players enable row level security;
alter table public.ratings enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.user_settings enable row level security;
alter table public.banned_words enable row level security;

create policy "players are public" on public.players for select using (true);
create policy "visible reviews are public" on public.reviews for select using (not hidden);
create policy "read own settings" on public.user_settings for select using (auth.uid() = user_id);
-- ratings and reports are never read directly (keeps raters anonymous).
grant select on public.players, public.reviews to anon, authenticated;
grant select on public.user_settings to authenticated;

-- Average scores per player.
create view public.player_stats with (security_invoker = false) as
select
  p.id as player_id,
  p.epic_name,
  count(r.id)::int as rating_count,
  round(avg(r.overall))::int as overall,
  round(avg(r.toxicity))::int as toxicity,
  round(avg(r.teamwork))::int as teamwork,
  round(avg(r.comms))::int as comms,
  round(avg(r.skill))::int as skill
from public.players p
left join public.ratings r on r.player_id = p.id
group by p.id, p.epic_name;
grant select on public.player_stats to anon, authenticated;

create or replace function public.contains_banned_word(txt text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.banned_words b
    where lower(txt) ~ ('\m' || regexp_replace(lower(b.word), '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M')
  );
$$;

-- How many ratings the current user has left today (UTC day) and whether
-- they already rated a given player.
create or replace function public.my_rating_status(p_epic_name text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  used int;
  already boolean := false;
begin
  if uid is null then
    return json_build_object('signed_in', false);
  end if;
  select count(*) into used from public.ratings
    where rater_id = uid and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  select exists (
    select 1 from public.ratings r join public.players p on p.id = r.player_id
    where r.rater_id = uid and p.epic_name = p_epic_name::citext
  ) into already;
  return json_build_object('signed_in', true, 'left_today', greatest(0, 3 - used), 'already_rated', already);
end;
$$;

-- Submit a rating (and optional reviews). Enforces every rule server-side.
create or replace function public.submit_rating(
  p_epic_name text,
  p_overall int, p_toxicity int, p_teamwork int, p_comms int, p_skill int,
  p_reviews jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  name text := btrim(p_epic_name);
  pid uuid;
  rid uuid;
  used int;
  cat text;
  txt text;
begin
  if uid is null then raise exception 'You need to sign in to rate.'; end if;
  if name is null or char_length(name) < 3 or char_length(name) > 32 then
    raise exception 'Epic names are 3 to 32 characters.';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text));
  select count(*) into used from public.ratings
    where rater_id = uid and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  if used >= 3 then raise exception 'You have used your 3 ratings for today. Come back tomorrow.'; end if;

  select id into pid from public.players where epic_name = name::citext;
  if pid is null then
    insert into public.players (epic_name, created_by) values (name, uid)
      on conflict (epic_name) do nothing returning id into pid;
    if pid is null then select id into pid from public.players where epic_name = name::citext; end if;
  end if;

  if exists (select 1 from public.user_settings where user_id = uid and pinned_player_id = pid) then
    raise exception 'You cannot rate the account you pinned as yours.';
  end if;
  if exists (select 1 from public.ratings where rater_id = uid and player_id = pid) then
    raise exception 'You already rated this player. Each player can only be rated once by you.';
  end if;

  for cat, txt in select key, btrim(value) from jsonb_each_text(coalesce(p_reviews, '{}'::jsonb)) loop
    if cat not in ('toxicity','teamwork','comms','skill') then raise exception 'Unknown category.'; end if;
    if txt <> '' and public.contains_banned_word(txt) then
      raise exception 'Your % review has words that are not allowed. Please edit it.', cat;
    end if;
  end loop;

  insert into public.ratings (player_id, rater_id, overall, toxicity, teamwork, comms, skill)
    values (pid, uid, p_overall, p_toxicity, p_teamwork, p_comms, p_skill)
    returning id into rid;

  for cat, txt in select key, btrim(value) from jsonb_each_text(coalesce(p_reviews, '{}'::jsonb)) loop
    if txt <> '' then
      insert into public.reviews (rating_id, player_id, author_id, category, body)
        values (rid, pid, uid, cat, left(txt, 500));
    end if;
  end loop;

  return pid;
end;
$$;

-- Report a review. Hidden automatically after 3 reports.
create or replace function public.report_review(p_review_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'You need to sign in to report.'; end if;
  insert into public.reports (review_id, reporter_id) values (p_review_id, uid)
    on conflict do nothing;
  select count(*) into n from public.reports where review_id = p_review_id;
  if n >= 3 then update public.reviews set hidden = true where id = p_review_id; end if;
end;
$$;

-- Pin (or unpin with null) a player as "my account".
create or replace function public.pin_player(p_player_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'You need to sign in.'; end if;
  insert into public.user_settings (user_id, pinned_player_id) values (uid, p_player_id)
    on conflict (user_id) do update set pinned_player_id = excluded.pinned_player_id;
end;
$$;

revoke execute on function public.contains_banned_word(text) from public, anon, authenticated;
grant execute on function public.my_rating_status(text) to anon, authenticated;
grant execute on function public.submit_rating(text,int,int,int,int,int,jsonb) to authenticated;
grant execute on function public.report_review(uuid) to authenticated;
grant execute on function public.pin_player(uuid) to authenticated;
revoke execute on function public.submit_rating(text,int,int,int,int,int,jsonb) from anon, public;
revoke execute on function public.report_review(uuid) from anon, public;
revoke execute on function public.pin_player(uuid) from anon, public;
