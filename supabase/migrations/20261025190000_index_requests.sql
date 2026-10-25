-- Durable source-indexing queue. The queue is separate from correction intake.
create extension if not exists pgcrypto;

create table if not exists public.index_requests (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('anilist')),
  provider_id text not null,
  requested_title text not null,
  provider_url text not null,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'resolving', 'accepted', 'needs_review', 'rejected', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  lease_token uuid,
  resolved_anime_id integer references public.anime(id) on delete set null,
  last_error text,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_id)
);

create index if not exists index_requests_ready_idx
  on public.index_requests (status, next_attempt_at, requested_at);
create index if not exists index_requests_resolved_anime_idx
  on public.index_requests (resolved_anime_id);

alter table public.index_requests enable row level security;
revoke all on public.index_requests from anon, authenticated;

create or replace function public.enqueue_index_request(
  p_provider text,
  p_provider_id text,
  p_requested_title text,
  p_provider_url text
)
returns table (request_id uuid, request_status text, anime_id integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.index_requests;
begin
  if p_provider <> 'anilist' then
    raise exception 'Unsupported source provider';
  end if;
  if p_provider_id !~ '^[0-9]{1,12}$' then
    raise exception 'Invalid provider ID';
  end if;
  if length(trim(coalesce(p_requested_title, ''))) < 1 or length(p_requested_title) > 160 then
    raise exception 'Invalid requested title';
  end if;
  if p_provider_url !~ '^https://anilist\.co/anime/[0-9]+/?$' then
    raise exception 'Invalid provider URL';
  end if;

  insert into public.index_requests (provider, provider_id, requested_title, provider_url)
  values (p_provider, p_provider_id, trim(p_requested_title), p_provider_url)
  on conflict (provider, provider_id) do update
    set requested_title = excluded.requested_title,
        provider_url = excluded.provider_url,
        updated_at = now(),
        last_error = null,
        next_attempt_at = least(public.index_requests.next_attempt_at, now())
  returning * into existing;

  return query select existing.id, existing.status, existing.resolved_anime_id;
end;
$$;

grant execute on function public.enqueue_index_request(text, text, text, text) to anon, authenticated;
