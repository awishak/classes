-- The best image, picked from a story's thumbnails instead of described.
--
-- Run once in the Supabase SQL editor for the classes project, after
-- visual-story-reading.sql. Safe to run again. Asked for 2026-10-13: the
-- first comment on a story is the best image, and a reader taps the image.
--
-- best_image holds the picked block's id (letters only, the field rule).
-- Comments saved before this line ran have none, so the default is ''.

alter table story_comments add column if not exists best_image text not null default ''
  check (best_image ~ '^[a-z]*$');
