-- HTML stories, the best image said in words, and a section that opens on its own.
--
-- Run once in the Supabase SQL editor for the classes project, after
-- visual-story-best-image.sql. Safe to run again. Andrew, 2026-10-21: a
-- student who made the story as an HTML file hands in a headline, a feature
-- image and the file, nothing else; the file sits inside the stories page;
-- the reader says which image was best in words, since there is nothing to
-- tap; and both COMM 3 sections open for reading on their own at 12:05 AM on
-- Monday, October 26.

-- The bucket takes an HTML file now, and a self-contained one with its
-- pictures inside can run past 10 MB, so the cap is 30 MB.
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'text/html'],
       file_size_limit = 31457280
 where id = 'visual-story';

-- When a building section opens on its own. Null means only the button opens it.
alter table story_stage add column if not exists opens_at timestamptz;

-- The best image in words, for a story with no pictures to tap.
alter table story_comments add column if not exists best_where text not null default ''
  check (length(best_where) <= 1000);

insert into story_stage (worksheet_key, group_key, section, stage, opens_at)
values ('visual-story', 'comm3', '8:00', 'building', '2026-10-26 00:05:00-07'),
       ('visual-story', 'comm3', '10:30', 'building', '2026-10-26 00:05:00-07')
on conflict (worksheet_key, group_key, section) do update set opens_at = excluded.opens_at;
