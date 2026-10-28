-- The first time a worksheet was handed in, kept when it is handed in again.
--
-- Run once in the Supabase SQL editor for the classes project. Safe to run
-- again. Andrew, 2026-10-28: "if a student submits something and it's
-- complete and then they resubmit it and just kind of fix something, that's
-- fine. You can count it as on time. But when the student submits something
-- late, I just want to know." A submit overwrites submitted_at, so the
-- on-time one was lost. The database sets this column the first time a sheet
-- is submitted and never again; the site reads it, falling back to
-- submitted_at until this has run.

alter table worksheet_sheets add column if not exists first_submitted_at timestamptz;

create or replace function worksheet_first_submit() returns trigger
language plpgsql as $$
begin
  if new.submitted_at is not null and new.first_submitted_at is null then
    new.first_submitted_at := new.submitted_at;
  end if;
  return new;
end $$;

drop trigger if exists worksheet_first_submit on worksheet_sheets;
create trigger worksheet_first_submit before insert or update on worksheet_sheets
  for each row execute function worksheet_first_submit();

-- What is already there: the current submit time is the first one we know of.
update worksheet_sheets set first_submitted_at = submitted_at
  where first_submitted_at is null and submitted_at is not null;
