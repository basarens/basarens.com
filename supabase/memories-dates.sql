-- Optional capture date, separate from the upload timestamp. Existing photos stay undated.
begin;
alter table public.memories_uploads
  add column if not exists photo_year integer,
  add column if not exists photo_month integer,
  add column if not exists photo_day integer;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.memories_uploads'::regclass and conname = 'memories_photo_date_valid') then
    alter table public.memories_uploads add constraint memories_photo_date_valid check (
      (photo_year is null or photo_year between 1 and 9999)
      and (photo_month is null or (photo_year is not null and photo_month between 1 and 12))
      and (photo_day is null or (photo_year is not null and photo_month is not null and photo_day between 1 and
        extract(day from (make_date(photo_year, photo_month, 1) + interval '1 month - 1 day'))))
    );
  end if;
end $$;
create index if not exists memories_photo_date_index on public.memories_uploads (photo_year, photo_month, photo_day) where status = 'complete';
commit;
