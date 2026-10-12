begin;
create table if not exists public.memories_mail_preferences (
  user_id uuid primary key references public.memories_members(user_id) on delete cascade,
  enabled boolean not null default false,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  updated_at timestamptz not null default now()
);
create table if not exists public.memories_mail_deliveries (
  period text not null check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  user_id uuid not null references public.memories_members(user_id) on delete cascade,
  state text not null default 'pending' check (state in ('pending','sending','sent','skipped','failed','uncertain')),
  payload jsonb,
  photo_ids uuid[] not null,
  provider_id text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  primary key (period,user_id)
);
alter table public.memories_mail_preferences enable row level security;
alter table public.memories_mail_deliveries enable row level security;
revoke all on public.memories_mail_preferences,public.memories_mail_deliveries from anon,authenticated;
grant all on public.memories_mail_preferences,public.memories_mail_deliveries to service_role;
create or replace function public.memories_claim_mail(mail_period text, recipient uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update memories_mail_deliveries d set state='sending',claimed_at=now()
  where d.period=mail_period and d.user_id=recipient and d.state in ('pending','failed')
  and exists(select 1 from memories_members m join memories_mail_preferences p on p.user_id=m.user_id where m.user_id=recipient and m.active and p.enabled);
  return found;
end $$;
revoke all on function public.memories_claim_mail(text,uuid) from public,anon,authenticated;
grant execute on function public.memories_claim_mail(text,uuid) to service_role;
commit;
