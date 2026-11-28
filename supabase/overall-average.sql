-- FNRate update (2026-11-28). Safe to run more than once.
-- 1) Overall is always the average of toxicity, teamwork, comms and skill.
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

-- 2) Give ninjan4372 a fair rating (75 in every category) after the test mix-up.
update public.ratings set toxicity = 75, teamwork = 75, comms = 75, skill = 75
where player_id = (select id from public.players where epic_name = 'ninjan4372');

-- 3) Recalculate overall on every existing rating.
update public.ratings set overall = overall;
update public.party_ratings set overall = overall;

-- 4) Leaderboards need 2 ratings instead of 3.
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
-- (keeps the existing grants on leaderboard)

-- Check: ninjan4372 should now show 75.
select epic_name, rating_count, overall, toxicity, teamwork, comms, skill
from public.player_stats where epic_name = 'ninjan4372';
