-- Visual story pre-production: Andrew's review of a student's topic.
--
-- Run once in the Supabase SQL editor for the classes project. Safe to run
-- again. Planned 2026-10-13 at /comm3/visualessayplanning.
--
-- The rules in words:
--   One review per sheet: approved or needs work, with a note.
--   A student reads the review on their own sheet and nothing else.
--   Nobody writes a review from a browser. Andrew's page writes through
--   /api/worksheet-submits, which checks that he is signed in and holds the
--   service key, and the service key passes these rules.

create table if not exists worksheet_reviews (
  sheet_id    uuid primary key references worksheet_sheets(id) on delete cascade,
  status      text not null check (status in ('approved', 'needs_work')),
  note        text not null default '' check (length(note) <= 2000),
  reviewed_at timestamptz not null default now()
);
comment on table worksheet_reviews is 'The instructor''s review of one worksheet sheet, read by the student who owns the sheet.';

alter table worksheet_reviews enable row level security;

drop policy if exists worksheet_reviews_see on worksheet_reviews;
create policy worksheet_reviews_see on worksheet_reviews for select
  using (worksheet_owns(sheet_id) or worksheet_is_host());
