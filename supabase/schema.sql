-- FNRate database setup.
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run.
-- Run it once on a fresh project.

create extension if not exists citext;

-- ============ Tables ============

-- Players (Epic names). Created by the first person who rates them.
create table public.players (
  id uuid primary key default gen_random_uuid(),
  epic_name citext not null unique,
  created_by uuid references auth.users(id) on delete set null,
  badge_until timestamptz,               -- paid profile badge (coming soon)
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

-- "Helpful" votes decide each player's best review.
create table public.review_votes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, voter_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

-- Per-user settings: pinned "my account" and plan (FNRate Plus = more daily ratings).
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pinned_player_id uuid references public.players(id) on delete set null,
  plan text not null default 'free' check (plan in ('free','plus')),
  plan_until timestamptz
);

-- Word filter. Add or remove words in Supabase > Table Editor > banned_words.
create table public.banned_words (word text primary key);
insert into public.banned_words (word) values
  ('nigger'),('nigga'),('faggot'),('fag'),('retard'),('kys'),('kill yourself'),
  ('cunt'),('tranny'),('chink'),('spic'),('kike'),('rape'),('whore'),('slut');

-- ============ Security ============
-- The website reads only through the views and functions below, and writes
-- only through the functions. Raters and review authors stay anonymous.
alter table public.players enable row level security;
alter table public.ratings enable row level security;
alter table public.reviews enable row level security;
alter table public.review_votes enable row level security;
alter table public.reports enable row level security;
alter table public.user_settings enable row level security;
alter table public.banned_words enable row level security;

create policy "players are public" on public.players for select using (true);
create policy "read own settings" on public.user_settings for select using (auth.uid() = user_id);
grant select on public.players to anon, authenticated;
grant select on public.user_settings to authenticated;

-- ============ Views ============

-- Average scores per player.
create view public.player_stats with (security_invoker = false) as
select
  p.id as player_id,
  p.epic_name,
  coalesce(p.badge_until > now(), false) as badge,
  count(r.id)::int as rating_count,
  round(avg(r.overall))::int as overall,
  round(avg(r.toxicity))::int as toxicity,
  round(avg(r.teamwork))::int as teamwork,
  round(avg(r.comms))::int as comms,
  round(avg(r.skill))::int as skill,
  max(r.created_at) as last_rated_at
from public.players p
left join public.ratings r on r.player_id = p.id
group by p.id, p.epic_name, p.badge_until;
grant select on public.player_stats to anon, authenticated;

-- Visible reviews with their helpful count (no author ids).
create view public.public_reviews with (security_invoker = false) as
select
  v.id, v.player_id, v.category, v.body, v.created_at,
  (select count(*) from public.review_votes rv where rv.review_id = v.id)::int as helpful
from public.reviews v
where not v.hidden;
grant select on public.public_reviews to anon, authenticated;

-- ============ Functions ============

create or replace function public.contains_banned_word(txt text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.banned_words b
    where lower(txt) ~ ('\m' || regexp_replace(lower(b.word), '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M')
  );
$$;

-- 3 ratings a day, 10 with FNRate Plus.
create or replace function public.daily_limit(uid uuid)
returns int language sql stable security definer set search_path = public as $$
  select case when exists (
    select 1 from public.user_settings s
    where s.user_id = uid and s.plan = 'plus' and (s.plan_until is null or s.plan_until > now())
  ) then 10 else 3 end;
$$;

create or replace function public.ratings_used_today(uid uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.ratings
  where rater_id = uid and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
$$;

-- Status for the signed-in user: ratings left today, plan, and whether they
-- already rated a given player.
create or replace function public.my_rating_status(p_epic_name text default null)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  lim int;
  already boolean := false;
begin
  if uid is null then return json_build_object('signed_in', false); end if;
  lim := public.daily_limit(uid);
  if p_epic_name is not null then
    select exists (
      select 1 from public.ratings r join public.players p on p.id = r.player_id
      where r.rater_id = uid and p.epic_name = p_epic_name::citext
    ) into already;
  end if;
  return json_build_object(
    'signed_in', true,
    'daily_limit', lim,
    'left_today', greatest(0, lim - public.ratings_used_today(uid)),
    'plus', lim > 3,
    'already_rated', already
  );
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
  cat text;
  txt text;
begin
  if uid is null then raise exception 'You need to sign in to rate.'; end if;
  if name is null or char_length(name) < 3 or char_length(name) > 32 then
    raise exception 'Epic names are 3 to 32 characters.';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text));
  if public.ratings_used_today(uid) >= public.daily_limit(uid) then
    raise exception 'You have used all your ratings for today. Come back tomorrow.';
  end if;

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

-- Mark a review as helpful (or take the vote back). You can't vote on your own.
create or replace function public.toggle_helpful(p_review_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'You need to sign in.'; end if;
  if exists (select 1 from public.reviews where id = p_review_id and author_id = uid) then
    raise exception 'You cannot vote on your own review.';
  end if;
  if exists (select 1 from public.review_votes where review_id = p_review_id and voter_id = uid) then
    delete from public.review_votes where review_id = p_review_id and voter_id = uid;
    return false;
  end if;
  insert into public.review_votes (review_id, voter_id) values (p_review_id, uid);
  return true;
end;
$$;

-- Which reviews of a player the current user marked helpful.
create or replace function public.my_helpful_votes(p_player_id uuid)
returns setof uuid language sql stable security definer set search_path = public as $$
  select rv.review_id from public.review_votes rv
  join public.reviews r on r.id = rv.review_id
  where rv.voter_id = auth.uid() and r.player_id = p_player_id;
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

-- Leaderboards. Players need at least 2 ratings to show up.
create or replace function public.leaderboard(p_kind text, p_limit int default 25)
returns setof public.player_stats language sql stable security definer set search_path = public as $$
  select * from public.player_stats s
  where s.rating_count >= 2
  order by
    case p_kind when 'best' then -s.overall when 'toxic' then s.toxicity
                when 'comms' then -s.comms when 'skill' then -s.skill else -s.overall end,
    s.rating_count desc, s.epic_name
  limit least(greatest(p_limit, 1), 100);
$$;

revoke execute on function
  public.contains_banned_word(text), public.daily_limit(uuid), public.ratings_used_today(uuid),
  public.my_rating_status(text), public.leaderboard(text, int),
  public.submit_rating(text,int,int,int,int,int,jsonb), public.toggle_helpful(uuid),
  public.my_helpful_votes(uuid), public.report_review(uuid), public.pin_player(uuid)
from public, anon, authenticated;
grant execute on function public.my_rating_status(text) to anon, authenticated;
grant execute on function public.leaderboard(text, int) to anon, authenticated;
grant execute on function public.submit_rating(text,int,int,int,int,int,jsonb) to authenticated;
grant execute on function public.toggle_helpful(uuid) to authenticated;
grant execute on function public.my_helpful_votes(uuid) to authenticated;
grant execute on function public.report_review(uuid) to authenticated;
grant execute on function public.pin_player(uuid) to authenticated;

-- Sign-in handoff: lets a link opened on one device (e.g. a phone) sign in the
-- device that asked for it (e.g. a computer). Rows live for 15 minutes at most.
create table if not exists public.auth_handoffs (
  id uuid primary key,
  access_token text not null,
  refresh_token text not null,
  created_at timestamptz not null default now()
);
alter table public.auth_handoffs enable row level security;
revoke all on table public.auth_handoffs from public, anon, authenticated;

create or replace function public.put_handoff(p_id uuid, p_access text, p_refresh text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.auth_handoffs where created_at < now() - interval '15 minutes';
  insert into public.auth_handoffs (id, access_token, refresh_token)
    values (p_id, p_access, p_refresh) on conflict (id) do nothing;
end;
$$;

create or replace function public.take_handoff(p_id uuid)
returns table (at text, rt text) language plpgsql security definer set search_path = public as $$
begin
  return query
    delete from public.auth_handoffs h
    where h.id = p_id and h.created_at > now() - interval '15 minutes'
    returning h.access_token, h.refresh_token;
end;
$$;

revoke execute on function public.put_handoff(uuid, text, text), public.take_handoff(uuid) from public, anon, authenticated;
grant execute on function public.put_handoff(uuid, text, text), public.take_handoff(uuid) to anon, authenticated;

-- Parties: a private group for your squad. After a match everyone rates the
-- others. Party ratings stay inside the party: they don't change public
-- profiles and don't use your daily ratings.
create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.party_members (
  party_id uuid not null references public.parties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  epic_name text not null check (char_length(epic_name) between 3 and 32),
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);
create table if not exists public.party_ratings (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  overall smallint not null check (overall between 1 and 100),
  toxicity smallint not null check (toxicity between 1 and 100),
  teamwork smallint not null check (teamwork between 1 and 100),
  comms smallint not null check (comms between 1 and 100),
  skill smallint not null check (skill between 1 and 100),
  created_at timestamptz not null default now(),
  check (rater_id <> target_id)
);
create index if not exists party_ratings_lookup on public.party_ratings (party_id, target_id);
create index if not exists party_ratings_rater on public.party_ratings (party_id, rater_id, created_at desc);

alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.party_ratings enable row level security;
revoke all on table public.parties, public.party_members, public.party_ratings from public, anon, authenticated;

create or replace function public.party_clean_name(p text) returns text
language sql immutable as $$ select left(regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g'), 40) $$;

create or replace function public.create_party(p_name text, p_epic_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  n text := public.party_clean_name(p_name);
  epic text := left(public.party_clean_name(p_epic_name), 32);
  pid uuid;
begin
  if uid is null then raise exception 'You need to sign in first.'; end if;
  if char_length(n) < 2 then raise exception 'Give your party a name.'; end if;
  if char_length(epic) < 3 then raise exception 'Enter your Epic name (3 to 32 characters).'; end if;
  if public.contains_banned_word(n) then raise exception 'That party name is not allowed.'; end if;
  if (select count(*) from public.parties where owner_id = uid) >= 10 then
    raise exception 'You can own up to 10 parties.';
  end if;
  loop
    begin
      insert into public.parties (name, code, owner_id)
        values (n, upper(substr(md5(gen_random_uuid()::text), 1, 8)), uid) returning id into pid;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  insert into public.party_members (party_id, user_id, epic_name) values (pid, uid, epic);
  return pid;
end;
$$;

create or replace function public.join_party(p_code text, p_epic_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  epic text := left(public.party_clean_name(p_epic_name), 32);
  pid uuid;
begin
  if uid is null then raise exception 'You need to sign in first.'; end if;
  select id into pid from public.parties where code = upper(btrim(p_code));
  if pid is null then raise exception 'No party has that invite code.'; end if;
  if exists (select 1 from public.party_members where party_id = pid and user_id = uid) then return pid; end if;
  if char_length(epic) < 3 then raise exception 'Enter your Epic name (3 to 32 characters).'; end if;
  perform pg_advisory_xact_lock(hashtext(pid::text));
  if (select count(*) from public.party_members where party_id = pid) >= 16 then
    raise exception 'This party is full (16 players).';
  end if;
  if exists (select 1 from public.party_members where party_id = pid and lower(epic_name) = lower(epic)) then
    raise exception 'Someone in this party already uses that Epic name.';
  end if;
  insert into public.party_members (party_id, user_id, epic_name) values (pid, uid, epic);
  return pid;
end;
$$;

-- Leaving as the owner deletes the party for everyone.
create or replace function public.leave_party(p_party_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'You need to sign in first.'; end if;
  if exists (select 1 from public.parties where id = p_party_id and owner_id = uid) then
    delete from public.parties where id = p_party_id;
  else
    delete from public.party_members where party_id = p_party_id and user_id = uid;
  end if;
end;
$$;

create or replace function public.my_parties()
returns table (id uuid, name text, member_count int, is_owner boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.name,
    (select count(*)::int from public.party_members m2 where m2.party_id = p.id),
    p.owner_id = auth.uid()
  from public.parties p join public.party_members m on m.party_id = p.id
  where m.user_id = auth.uid()
  order by m.joined_at desc;
$$;

-- Everything the party page needs. Only members can see it.
create or replace function public.party_view(p_party_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not exists (
    select 1 from public.party_members where party_id = p_party_id and user_id = auth.uid()
  ) then null else jsonb_build_object(
    'id', p.id, 'name', p.name, 'code', p.code, 'is_owner', p.owner_id = auth.uid(),
    'rounds', (select count(distinct (r.rater_id, r.created_at)) from public.party_ratings r where r.party_id = p.id),
    'next_rate_at', (select max(r.created_at) + interval '15 minutes' from public.party_ratings r
                     where r.party_id = p.id and r.rater_id = auth.uid()),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', m.user_id, 'epic_name', m.epic_name, 'is_me', m.user_id = auth.uid(),
        'is_owner', m.user_id = p.owner_id,
        'ratings', s.n, 'overall', s.overall, 'toxicity', s.toxicity,
        'teamwork', s.teamwork, 'comms', s.comms, 'skill', s.skill
      ) order by s.overall desc nulls last, m.joined_at)
      from public.party_members m
      left join lateral (
        select count(*)::int n, round(avg(overall))::int overall, round(avg(toxicity))::int toxicity,
          round(avg(teamwork))::int teamwork, round(avg(comms))::int comms, round(avg(skill))::int skill
        from public.party_ratings r where r.party_id = p.id and r.target_id = m.user_id
      ) s on true
      where m.party_id = p.id
    ), '[]'::jsonb)
  ) end
  from public.parties p where p.id = p_party_id;
$$;

-- p_ratings: [{"user_id": "...", "overall": 80, "toxicity": 90, "teamwork": 70, "comms": 60, "skill": 75}, ...]
-- You can rate your party once every 15 minutes (about one match).
create or replace function public.rate_party(p_party_id uuid, p_ratings jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  tid uuid;
  saved int := 0;
  last_at timestamptz;
begin
  if uid is null then raise exception 'You need to sign in first.'; end if;
  if not exists (select 1 from public.party_members where party_id = p_party_id and user_id = uid) then
    raise exception 'You are not in this party.';
  end if;
  perform pg_advisory_xact_lock(hashtext(uid::text || p_party_id::text));
  select max(created_at) into last_at from public.party_ratings where party_id = p_party_id and rater_id = uid;
  if last_at is not null and last_at > now() - interval '15 minutes' then
    raise exception 'You just rated this party. You can rate again after your next match (15 minutes).';
  end if;
  for item in select * from jsonb_array_elements(coalesce(p_ratings, '[]'::jsonb)) loop
    tid := (item->>'user_id')::uuid;
    if tid = uid then continue; end if;
    if not exists (select 1 from public.party_members where party_id = p_party_id and user_id = tid) then continue; end if;
    insert into public.party_ratings (party_id, rater_id, target_id, overall, toxicity, teamwork, comms, skill)
    values (p_party_id, uid, tid,
      least(100, greatest(1, coalesce((item->>'overall')::int, 50))),
      least(100, greatest(1, coalesce((item->>'toxicity')::int, 50))),
      least(100, greatest(1, coalesce((item->>'teamwork')::int, 50))),
      least(100, greatest(1, coalesce((item->>'comms')::int, 50))),
      least(100, greatest(1, coalesce((item->>'skill')::int, 50))));
    saved := saved + 1;
  end loop;
  if saved = 0 then raise exception 'Pick at least one teammate to rate.'; end if;
  return saved;
end;
$$;

revoke execute on function public.create_party(text, text), public.join_party(text, text),
  public.leave_party(uuid), public.my_parties(), public.party_view(uuid), public.rate_party(uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.create_party(text, text), public.join_party(text, text),
  public.leave_party(uuid), public.my_parties(), public.party_view(uuid), public.rate_party(uuid, jsonb)
to authenticated;

-- Overall is always the average of toxicity, teamwork, comms and skill.
create or replace function public.set_overall_average() returns trigger
language plpgsql as $$
begin
  new.overall := round((new.toxicity + new.teamwork + new.comms + new.skill) / 4.0);
  return new;
end;
$$;
drop trigger if exists ratings_overall_average on public.ratings;
create trigger ratings_overall_average before insert or update on public.ratings
  for each row execute function public.set_overall_average();
drop trigger if exists party_ratings_overall_average on public.party_ratings;
create trigger party_ratings_overall_average before insert or update on public.party_ratings
  for each row execute function public.set_overall_average();
