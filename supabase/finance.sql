-- Run once in the Supabase SQL editor. Create the two Auth users first.
create table if not exists public.finance_members (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.finance_accounts (
  iban text primary key,
  label text not null,
  kind text not null default 'current' check (kind in ('current', 'savings')),
  owner text not null default 'shared' check (owner in ('shared', 'personal'))
);

create table if not exists public.finance_transactions (
  fingerprint text primary key,
  account_iban text not null references public.finance_accounts(iban),
  counterparty_iban text,
  booked_on date not null,
  sequence bigint not null default 0,
  amount_cents bigint not null,
  balance_cents bigint,
  counterparty text,
  description text not null default '',
  category text not null default 'Overig',
  is_internal_transfer boolean not null default false
);

create index if not exists finance_transactions_date_idx
  on public.finance_transactions (booked_on desc, sequence desc);

create table if not exists public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  target_cents bigint not null check (target_cents > 0),
  created_at timestamptz not null default now()
);

alter table public.finance_members enable row level security;
alter table public.finance_accounts enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_goals enable row level security;

revoke all on public.finance_members, public.finance_accounts,
  public.finance_transactions, public.finance_goals from anon, authenticated;
grant select on public.finance_members to authenticated;
grant select, insert, update on public.finance_accounts to authenticated;
grant select, insert on public.finance_transactions to authenticated;
grant select, insert on public.finance_goals to authenticated;

create policy "members can read own membership"
  on public.finance_members for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "members can read accounts"
  on public.finance_accounts for select to authenticated
  using (exists (select 1 from public.finance_members where user_id = (select auth.uid())));
create policy "members can add accounts"
  on public.finance_accounts for insert to authenticated
  with check (exists (select 1 from public.finance_members where user_id = (select auth.uid())));
create policy "members can update accounts"
  on public.finance_accounts for update to authenticated
  using (exists (select 1 from public.finance_members where user_id = (select auth.uid())))
  with check (exists (select 1 from public.finance_members where user_id = (select auth.uid())));

create policy "members can read transactions"
  on public.finance_transactions for select to authenticated
  using (exists (select 1 from public.finance_members where user_id = (select auth.uid())));
create policy "members can add transactions"
  on public.finance_transactions for insert to authenticated
  with check (exists (select 1 from public.finance_members where user_id = (select auth.uid())));

create policy "members can read goals"
  on public.finance_goals for select to authenticated
  using (exists (select 1 from public.finance_members where user_id = (select auth.uid())));
create policy "members can add goals"
  on public.finance_goals for insert to authenticated
  with check (exists (select 1 from public.finance_members where user_id = (select auth.uid())));

-- After creating each user in Authentication > Users, add only those two IDs:
-- insert into public.finance_members (user_id) values ('USER_UUID_1'), ('USER_UUID_2');
