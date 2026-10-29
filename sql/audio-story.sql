-- The audio story's due date, so the database locks the sheet after it.
--
-- Run once in the Supabase SQL editor for the classes project. Safe to run
-- again. The lock itself is sql/visual-story-portal.sql's: worksheet_locked()
-- reads worksheet_deadlines by worksheet_key and group_key, and the
-- restrictive policies on worksheet_answers and worksheet_sheets refuse every
-- save and submit once now() is past due_at, unless a worksheet_unlocks row
-- lets the student through (the Unlock buttons on ?review). Without this row
-- nothing locks; the sheet says so on the review page.
--
-- The audio story (COMM 3 assignment id "audio") is due Sunday, November 15,
-- at 11:59 PM Pacific, which is standard time by then.

insert into worksheet_deadlines (worksheet_key, group_key, due_at)
values ('audio-story', 'comm3', '2026-11-15 23:59:00-08')
on conflict (worksheet_key, group_key) do update set due_at = excluded.due_at;
