begin;
alter table public.memories_uploads add column if not exists deleted_at timestamptz;
create table if not exists public.memories_removal_votes (
  photo_id uuid not null references public.memories_uploads(id) on delete cascade,
  user_id uuid not null references public.memories_members(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id,user_id)
);
alter table public.memories_removal_votes enable row level security;
revoke all on public.memories_removal_votes from anon,authenticated;
grant all on public.memories_removal_votes to service_role;
create or replace function public.memories_removal_action(photo uuid, voter uuid, operation text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare removed timestamptz; votes integer; member_role text;
begin
  select role into member_role from memories_members where user_id=voter and active;
  if member_role is null then raise exception 'Not authorized'; end if;
  select deleted_at into removed from memories_uploads where id=photo and status='complete' for update;
  if not found then raise exception 'Photo unavailable'; end if;
  if operation='restore' then
    if member_role <> 'owner' then raise exception 'Not authorized'; end if;
    update memories_uploads set deleted_at=null where id=photo;
    delete from memories_removal_votes where photo_id=photo;
    removed:=null;
  elsif removed is not null then
    raise exception 'Photo already removed';
  elsif operation='vote' then
    insert into memories_removal_votes(photo_id,user_id) values(photo,voter) on conflict do nothing;
  elsif operation='withdraw' then
    delete from memories_removal_votes where photo_id=photo and user_id=voter;
  else raise exception 'Invalid operation';
  end if;
  select count(*) into votes from memories_removal_votes v join memories_members m on m.user_id=v.user_id and m.active where v.photo_id=photo;
  if votes >= 2 and removed is null then
    removed:=now();
    update memories_uploads set deleted_at=removed where id=photo;
  end if;
  return jsonb_build_object('deleted',removed is not null,'votes',votes,'voted',exists(select 1 from memories_removal_votes where photo_id=photo and user_id=voter));
end $$;
revoke all on function public.memories_removal_action(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.memories_removal_action(uuid,uuid,text) to service_role;
commit;
