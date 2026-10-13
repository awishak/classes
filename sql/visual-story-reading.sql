-- The visual story's reading phase: pods, stages and comments.
--
-- Run once in the Supabase SQL editor for the classes project, after
-- visual-story-portal.sql. Safe to run again. Planned 2026-10-13 at
-- /comm3/visualessayplanning.
--
-- The rules in words:
--   Nobody reads or writes these tables from a browser. Everything goes
--   through /api/visual-story, which checks who is asking against the
--   roster and the section, keeps names off the stories until Andrew
--   releases them, and opens and closes comments when he says. The service
--   key the route holds passes these rules; every other key gets nothing,
--   because no policy lets anyone in.
--   The stage is the one thing anyone may read, so a page can say whether
--   the stories are open yet.

create table if not exists story_pods (
  group_key  text not null,
  section    text not null default '',
  pod        int  not null check (pod between 1 and 99),
  viewer_id  text not null check (viewer_id = lower(viewer_id)),
  primary key (group_key, viewer_id)
);
alter table story_pods enable row level security;

create table if not exists story_stage (
  worksheet_key text not null,
  group_key     text not null,
  section       text not null default '',
  stage         text not null default 'building' check (stage in ('building', 'reading', 'closed', 'released')),
  updated_at    timestamptz not null default now(),
  primary key (worksheet_key, group_key, section)
);
alter table story_stage enable row level security;
drop policy if exists story_stage_see on story_stage;
create policy story_stage_see on story_stage for select using (true);

create table if not exists story_comments (
  id            uuid primary key default gen_random_uuid(),
  story_sheet   uuid not null references worksheet_sheets(id) on delete cascade,
  author        text not null check (author = lower(author)),
  best          text not null check (length(best) between 1 and 3000),
  shone         text not null check (length(shone) between 1 and 3000),
  encourage     text not null check (length(encourage) between 1 and 3000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (story_sheet, author)
);
create index if not exists story_comments_author on story_comments (author);
alter table story_comments enable row level security;
