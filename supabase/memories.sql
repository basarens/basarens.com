-- Run once in the Supabase SQL editor. No anonymous read or upload policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memories-inbox', 'memories-inbox', false, 20971520,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do nothing;

create table if not exists public.memories_uploads (
  id uuid primary key,
  path text not null unique,
  link_hash text not null,
  filename text not null,
  size bigint not null check (size > 0 and size <= 20971520),
  name text not null default '' check (length(name) <= 80),
  message text not null default '' check (length(message) <= 1200),
  status text not null default 'pending' check (status in ('pending','complete')),
  created_at timestamptz not null default now()
);
alter table public.memories_uploads enable row level security;
revoke all on public.memories_uploads from anon, authenticated;
grant all on public.memories_uploads to service_role;
create index if not exists memories_link_index on public.memories_uploads (link_hash);

-- Bound storage consumption per invitation, including unfinished reservations.
-- A database lock makes the cap work across concurrent/serverless requests.
create or replace function public.memories_check_quota() returns trigger
language plpgsql set search_path = public as $$
declare photo_count bigint; total_bytes bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.link_hash, 0));
  select count(*), coalesce(sum(size), 0) into photo_count, total_bytes
    from public.memories_uploads where link_hash = new.link_hash;
  if photo_count >= 1000 or total_bytes + new.size > 5368709120 then
    raise exception 'Invitation upload limit reached';
  end if;
  return new;
end;
$$;
drop trigger if exists memories_quota on public.memories_uploads;
create trigger memories_quota before insert on public.memories_uploads
for each row execute function public.memories_check_quota();
