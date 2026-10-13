-- The visual story portal: private photos, the lock at the due date, the
-- unlock for late work, and Report a problem.
--
-- Run once in the Supabase SQL editor for the classes project, after
-- visual-story-pre.sql. Safe to run again. Planned 2026-10-13 at
-- /comm3/visualessayplanning.
--
-- The rules in words:
--   Photos live in a private bucket, one folder per class and student:
--   <class>/<email>/<file>. A student uploads, reads and removes only their
--   own folder. Andrew, as a host, reads every folder. Classmates see photos
--   later only through the server, which signs links one story at a time.
--   A worksheet with a deadline locks at that moment: no answer is added or
--   removed and nothing is submitted after it, unless Andrew has unlocked
--   that student's sheet, until the time he set. The database decides, not
--   the page.
--   A student can file a problem report as themselves. Only a host reads
--   the reports.

-- The bucket. Private, 10 MB a file, pictures only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visual-story', 'visual-story', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists visual_story_own_add on storage.objects;
create policy visual_story_own_add on storage.objects for insert to authenticated
  with check (bucket_id = 'visual-story' and (storage.foldername(name))[2] = worksheet_viewer());
drop policy if exists visual_story_own_see on storage.objects;
create policy visual_story_own_see on storage.objects for select to authenticated
  using (bucket_id = 'visual-story' and ((storage.foldername(name))[2] = worksheet_viewer() or worksheet_is_host()));
drop policy if exists visual_story_own_drop on storage.objects;
create policy visual_story_own_drop on storage.objects for delete to authenticated
  using (bucket_id = 'visual-story' and (storage.foldername(name))[2] = worksheet_viewer());

-- Deadlines, one per worksheet and class, and unlocks, one per sheet.
create table if not exists worksheet_deadlines (
  worksheet_key text not null,
  group_key     text not null,
  due_at        timestamptz not null,
  primary key (worksheet_key, group_key)
);
create table if not exists worksheet_unlocks (
  sheet_id uuid primary key references worksheet_sheets(id) on delete cascade,
  until    timestamptz not null
);
alter table worksheet_deadlines enable row level security;
alter table worksheet_unlocks enable row level security;
drop policy if exists worksheet_deadlines_see on worksheet_deadlines;
create policy worksheet_deadlines_see on worksheet_deadlines for select using (true);
drop policy if exists worksheet_unlocks_see on worksheet_unlocks;
create policy worksheet_unlocks_see on worksheet_unlocks for select using (worksheet_owns(sheet_id) or worksheet_is_host());

create or replace function worksheet_locked(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from worksheet_sheets w
    join worksheet_deadlines d on d.worksheet_key = w.worksheet_key and d.group_key = w.group_key
    where w.id = s and now() > d.due_at
      and not exists (select 1 from worksheet_unlocks u where u.sheet_id = w.id and u.until > now())
  )
$$;

-- Restrictive, so they stand on top of the worksheets package's own rules.
drop policy if exists worksheet_answers_lock_add on worksheet_answers;
create policy worksheet_answers_lock_add on worksheet_answers as restrictive for insert
  with check (not worksheet_locked(sheet_id));
drop policy if exists worksheet_answers_lock_drop on worksheet_answers;
create policy worksheet_answers_lock_drop on worksheet_answers as restrictive for delete
  using (not worksheet_locked(sheet_id));
drop policy if exists worksheet_sheets_lock_submit on worksheet_sheets;
create policy worksheet_sheets_lock_submit on worksheet_sheets as restrictive for update
  using (not worksheet_locked(id));

-- The visual story is due Friday, October 23, at 11:59 PM Pacific.
insert into worksheet_deadlines (worksheet_key, group_key, due_at)
values ('visual-story', 'comm3', '2026-10-23 23:59:00-07')
on conflict (worksheet_key, group_key) do update set due_at = excluded.due_at;
-- A deadline already past, on a class that does not exist, so the lock can
-- be tested without touching a real class.
insert into worksheet_deadlines (worksheet_key, group_key, due_at)
values ('visual-story', 'locktest', '2000-01-01 00:00:00+00')
on conflict (worksheet_key, group_key) do update set due_at = excluded.due_at;

-- Report a problem.
create table if not exists worksheet_reports (
  id            uuid primary key default gen_random_uuid(),
  viewer_id     text not null default worksheet_viewer(),
  worksheet_key text not null,
  group_key     text not null,
  message       text not null default '' check (length(message) <= 4000),
  details       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
alter table worksheet_reports enable row level security;
drop policy if exists worksheet_reports_add on worksheet_reports;
create policy worksheet_reports_add on worksheet_reports for insert to authenticated
  with check (viewer_id = worksheet_viewer() and worksheet_viewer() <> '');
drop policy if exists worksheet_reports_see on worksheet_reports;
create policy worksheet_reports_see on worksheet_reports for select using (worksheet_is_host());
