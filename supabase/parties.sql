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
