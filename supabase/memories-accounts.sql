-- Prepare named archive access without granting anonymous or public access.
-- Memberships must only be created for friends explicitly approved by Bas.
begin;
create table if not exists public.memories_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(email)),
  display_name text not null check (length(display_name) between 1 and 80),
  role text not null default 'friend' check (role in ('owner','friend')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.memories_members enable row level security;
revoke all on public.memories_members from anon, authenticated;
grant all on public.memories_members to service_role;
alter table public.memories_uploads
  add column if not exists uploaded_by uuid references auth.users(id),
  add column if not exists edited_by uuid references auth.users(id);
create table if not exists public.memories_login_limits (
  key text primary key,
  started_at timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.memories_login_limits enable row level security;
revoke all on public.memories_login_limits from anon, authenticated;
grant all on public.memories_login_limits to service_role;
create or replace function public.memories_login_allowed(limit_key text, max_attempts integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.memories_login_limits (key, attempts) values (limit_key, 1)
  on conflict (key) do update set
    attempts = case when memories_login_limits.started_at < now() - interval '1 hour' then 1 else memories_login_limits.attempts + 1 end,
    started_at = case when memories_login_limits.started_at < now() - interval '1 hour' then now() else memories_login_limits.started_at end
  returning attempts into n;
  return n <= max_attempts;
end $$;
revoke all on function public.memories_login_allowed(text, integer) from public, anon, authenticated;
grant execute on function public.memories_login_allowed(text, integer) to service_role;
commit;
