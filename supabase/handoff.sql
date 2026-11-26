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
