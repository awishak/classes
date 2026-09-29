# Splitting the class row

Written 2026-09-28. The plan for taking the lesson plan out of the row that
thirty student phones write, and making the database refuse a student's write
to it. Read this whole file before doing anything. HANDOFF.md is still the
shape of the site; this is one job on top of it.

## Why

Every class is one JSON row, `app_data.id = <storageKey>`, written whole by
every browser that touches it: the dashboard, both of Andrew's machines, and
every student's phone. There is no server in the middle. The merge that decides
whose copy wins runs in each browser (`mergeClass` in `src/engine/store.js`),
against whatever that browser thinks the class looked like when it started.

Every failure of the last week is that rule going wrong in a different way:

- Two students posting at once, and the second write erased the first. The
  merge rule, 2026-09-21.
- A day's work on the laptop never landed and nothing said so. The pending
  queue, 2026-09-22.
- Around the Horn's reader in the top bar rolled the dashboard back mid
  sentence. One pipeline per class, commit 2d5148c.
- A line typed into the middle of a section came back at the bottom. The
  merge kept the server's order and appended, commit 619f6df.
- A student's phone that could not read the class came up empty, seeded
  itself from config, and the merge wrote the seed's day title, section names
  and seed rows back over Andrew's, during class. Commit 4777f03.

Each fix was real and there will be another, because the merge has to be right
about every field of the class from inside a phone on bad wifi. Andrew's own
rules say server authoritative, enforce it in the database. The writes do
neither. This job makes the first move: a student's phone can never touch the
lesson plan, however broken its connection or the merge.

## Where it stands, 2026-09-29

The code side is built and deployed: pieces 1, 2, 4, 6 and 7, and the
migration script from piece 5. The store reads two rows behind one hook,
writes the row whose keys changed, drops a plan write from a page that is not
the instructor's, and treats a refusal from the database as a drop rather
than a retry. The shim sends the signed-in person's token on plan rows and
falls back to anon once, so it works before and after the SQL. The seed
effect runs only from an instructor's page.

Left for Andrew, on any machine, in this order:

1. Run the SQL in piece 3 in the Supabase SQL editor, reading the first
   result before the rest.
2. Reload every dashboard tab on both machines.
3. `SUPABASE_SERVICE_ROLE_KEY=... node scripts/split-plan.mjs --dry`, read
   it, then the same without `--dry`.
4. Check, per the Verify section.

One consequence of the SQL to know about: after it runs, a dashboard opened
with the remembered PIN and no sign-in cannot write the lesson plan, because
the database only counts a session. The podium machine has to sign in at
/login like everyone else. Until the SQL runs, the PIN still works.

## Decisions to confirm before starting

Defaults are what gets built if nothing is said.

1. **The service key.** The migration script needs `SUPABASE_SERVICE_ROLE_KEY`.
   Default: Andrew runs the script himself with the key in his shell. The
   alternative is `vercel link` in the repo so `vercel env pull` fetches it.
   The key is never committed and never printed.
2. **The SQL.** Default: Andrew runs it in the Supabase SQL editor, in the
   order given below, reading each result. Writes to the live database were
   refused when Claude tried one on 2026-09-28, so expect this to be Andrew's.
3. **Keys both sides write:** `assignmentLog` (student turns in, instructor
   grades), `requests` (student asks, instructor marks done), `log` (game
   points, Horn awards), `students` if onboarding ever appends. Default: all
   four stay in the class row, since a student has to be able to write them.
4. **Anything on the instructor list below a student should change?** Default:
   no.

## What moves where

The precedent is the photographs: `src/engine/photos.js` keeps faces in
`<storageKey>-photos` and `useWithPhotos` puts them back on the profiles for
display. Same shape, one more row.

New row `<storageKey>-plan`, written only by an instructor session:

```
dayPlans  schedule  library  blocks  assignments  dueCards  stocked  scratch
roomGround  seedVersion  athSeats  commentDrafts  gradeBoard  triviaPool
headlineCategories  instructorCard  courseTitle  assignmentsBlurb
leaderboardExplain  scheduleDocUrl  gameLinks  profileTaskOff  portedFrom
pins  attendance  students
```

Class row `<storageKey>`, unchanged, because students write them:

```
profiles  threads  threadSeen  welcomeSeen  noticeSeen  away  dueLog
submissions  assignmentLog  requests  log
```

Sizes on 2026-09-28, so you know what a student stops carrying: COMM 3's row
is about 200 KB, and dayPlans (83 KB), blocks (21 KB), assignmentLog (12 KB)
and schedule (5 KB) alone are 120 KB of it. COMM 118's blocks are 116 KB.

Two keys were classified by name and need a look at their writer before the
list is final: `dueCards` (`src/engine/DueCard.jsx`) and `profileTaskOff`
(`src/engine/AssignmentsCard.jsx:855`). If a student's page writes either, it
goes to the class row.

Rows that already live beside the class and do not change: `-photos`,
`-live`, `-questions`, `-boards`, `-poll`, `-headlines`, the game rows, and
`ishak-blocks-v1` (the shared library).

## The pieces

### 1. The store reads and writes two rows behind the same hook

`src/engine/store.js`. Every surface keeps calling `useClassData(storageKey)`
and `update(prev => next)`. No call site changes.

- `PLAN_KEYS`, the set above, and `planKeyOf(key) = key + "-plan"`. Which keys
  are class keys: the storageKeys in `ENGINE_LIST` (`src/config/registry.js`;
  the configs import nothing from the engine, so there is no cycle).
- `useClassData(key)` on a class key subscribes to both pipelines (the
  per-row pipeline already exists: `pipeFor`, `tell`, `takeServer`,
  `pushUpdate`, `pump`). `data` is `{ ...classRow, ...planRow }`, plan keys
  over class keys. A plan key the plan row lacks falls back to the class row,
  which is what makes deploy-before-migrate safe.
- `pushUpdate` on a class key runs the mutator over the merged view, then
  splits `next` by key: plan keys to the plan pipeline, the rest to the class
  pipeline, and only a part whose canon changed goes out. `apply` splits the
  same way. `saveMerged` (attendance marks) writes class keys only; assert it.
- `loadClass(key)` on a class key reads both rows and merges, so
  `src/engine/RepoPage.jsx:168`, `src/engine/qbank.js:78` and
  `src/LoginPage.jsx:40` come along for free.
- History: new versions of a day go under `<key>-plan-history-<date>-<ts>`.
  `loadDayHistory` reads both the old and the new prefix. `src/engine/DayTools.jsx:121`
  lists daily backups from `<key>-bak-`; it lists `<key>-plan-bak-` as well.
- A page whose session is not an instructor drops the plan part of a write
  with a `console.warn`, never queues it. Otherwise the database's refusal
  would be retried for ever and the bar would say Not saved on a student's
  phone. The check is `isInstructorEmail(getSession()?.user?.email)` from
  `src/engine/session.js` and `src/instructors.js`.
- Direct writers that bypass the hook and touch plan keys: `src/engine/RepoPage.jsx:250`
  writes whole class rows with `saveClass` when blocks are moved between
  classes. Route it through the split (a `savePlan` beside `saveClass`).
  `boards.js`, `live.js`, `questions.js`, `auth.js` write their own rows and
  are fine.

### 2. The shim sends the signed-in person's token

`src/storage-shim.js`. `set` and `delete` go out with `Authorization: Bearer
<user access token>` when a session exists, `apikey` still the anon key. The
shim cannot import `session.js` (session imports the shim's constants), so the
shim gets `window.storage.setToken(fn)` and `session.js` registers
`accessToken` (which already refreshes a token within a minute of expiry) the
first time it keeps a session. Reads stay anon.

A `401` or `403` on a write is a refusal, not an outage: `set` returns a
distinct value for it (say `false`), and the pipeline drops that part rather
than retrying. `undefined` stays the failed-read answer from 4777f03.

The smoke's fake `window.storage` objects (`scripts/smoke.jsx`, search for
`window.storage = {`) need `setToken` or the shim call guarded with `?.`.

### 3. The database refuses a student's write to a plan row

Run in the Supabase SQL editor, in this order. Read the first result before
running the rest.

```sql
-- 1. What is there now. If relrowsecurity is true and policies exist, read
--    them before adding more: a new permissive policy widens, never narrows.
select relname, relrowsecurity, relforcerowsecurity
from pg_class where relname = 'app_data';
select policyname, cmd, roles, qual, with_check
from pg_policies where tablename = 'app_data';
```

```sql
-- 2. Who teaches. Mirrors src/instructors.js. Nothing in the browser can
--    read this table; the function below reads it as its owner.
create table if not exists public.instructors (email text primary key);
insert into public.instructors (email)
values ('andrewishak@gmail.com'), ('aishak@scu.edu')
on conflict do nothing;
alter table public.instructors enable row level security;

create or replace function public.is_instructor()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.instructors
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_instructor() from public;
grant execute on function public.is_instructor() to anon, authenticated;
```

```sql
-- 3. The rows. A plan row is '<key>-plan', and its backups and history are
--    '<key>-plan-bak-...' and '<key>-plan-history-...'. Everything else is
--    as it was: anyone reads, anyone writes.
alter table public.app_data enable row level security;

create policy "anyone reads"
  on public.app_data for select
  to anon, authenticated
  using (true);

create policy "ordinary rows: anyone inserts"
  on public.app_data for insert
  to anon, authenticated
  with check (id not like '%-plan' and id not like '%-plan-%');

create policy "ordinary rows: anyone updates"
  on public.app_data for update
  to anon, authenticated
  using (id not like '%-plan' and id not like '%-plan-%')
  with check (id not like '%-plan' and id not like '%-plan-%');

create policy "ordinary rows: anyone deletes"
  on public.app_data for delete
  to anon, authenticated
  using (id not like '%-plan' and id not like '%-plan-%');

create policy "plan rows: instructors insert"
  on public.app_data for insert
  to authenticated
  with check ((id like '%-plan' or id like '%-plan-%') and public.is_instructor());

create policy "plan rows: instructors update"
  on public.app_data for update
  to authenticated
  using ((id like '%-plan' or id like '%-plan-%') and public.is_instructor())
  with check ((id like '%-plan' or id like '%-plan-%') and public.is_instructor());

create policy "plan rows: instructors delete"
  on public.app_data for delete
  to authenticated
  using ((id like '%-plan' or id like '%-plan-%') and public.is_instructor());
```

Notes on this SQL:

- The shim's upsert (`POST ... on_conflict=id` with `resolution=merge-duplicates`)
  needs both the insert and the update policy to pass. That is why each side
  has both.
- A request carrying the anon key as bearer runs as `anon`; one carrying a
  user's token runs as `authenticated`. The plan policies are `authenticated`
  only, so the anon key alone can never write a plan row, whatever the bundle
  does.
- The service role bypasses row security. The API routes in `api/` and the
  migration script are unaffected.
- Realtime `postgres_changes` respects the select policy, which is open, so
  the live feed keeps working for everyone.
- Existing backup rows `<key>-bak-...` and history rows `<key>-history-...`
  do not match `%-plan%` and stay writable as before.

Check it worked, from any shell, with the anon key from `src/storage-shim.js`:
an upsert to `comm999-v1-plan` with the anon bearer must come back `401` or
`403`, and a read of it must still come back `200`.

### 4. The class site seeds only for an instructor

`src/engine/ClassApp.jsx`, the effect that starts `if (!stored || !data ||
!config.seedVersion) return;`. Add: return unless the session's email is an
instructor's. Every key it writes is a plan key now; a student's page has no
business seeding anything, and with the policy above it could not anyway.

### 5. The migration script

`scripts/split-plan.mjs`. Plain Node, `fetch`, no bundling. Reads
`SUPABASE_SERVICE_ROLE_KEY` from the environment and refuses to start without
it. Hardcode the current classes: `comm118-f26-v1`, `comm3-f26-v1`,
`comm999-v1`. The archived spring classes (`comm2-s26-v1`, `comm4-s26-v1`)
stay as they are; the fallback in the store reads them unchanged.

For each key, in order:

1. `GET` the class row. If a `<key>-plan` row exists and the class row holds
   none of `PLAN_KEYS`, print "already split" and move on. Idempotent.
2. Write `<key>-before-split-<YYYY-MM-DD>` with the whole class row. Skip if it
   exists. This is the rollback.
3. Plan part: pick `PLAN_KEYS` off the class row. If a `<key>-plan` row already
   exists (the deployed code will have created one at Andrew's first edit),
   its keys win over the class row's copy, because it is newer. Upsert
   `<key>-plan`.
4. `PATCH` the class row with the plan keys removed. Whole `data` object, since
   the column is jsonb.
5. Read both rows back and print their key lists and sizes.

Headers: `apikey` and `Authorization: Bearer` both the service key,
`Content-Type: application/json`, `Prefer: return=representation`. The REST
base is `https://ybuchgebudixbyrcxpik.supabase.co/rest/v1/app_data`.

Order of operations on the day: deploy the code, reload every dashboard tab on
both machines (an old bundle still writes plan keys into the class row), then
run the script. Between deploy and script the site works: plan keys the plan
row lacks come from the class row.

### 6. Smoke

`scripts/smoke.jsx`, beside the pipeline cases (search for `one pipeline`):

- A save that changes a plan key and a class key writes two rows, each
  holding only its keys.
- A save that changes only a class key writes one row.
- The merged view prefers the plan row; a class with no plan row still reads
  every key from the class row.
- A session that is not an instructor's cannot queue a plan write.
- `loadClass` on a class key returns the merged view.
- The seeding effect source still carries its guard (a source check, like the
  one already there).

Then `npm run build`, which runs the checks and the smoke before Vite.

### 7. HANDOFF.md

A section under "What this is": the two rows, which keys live where, that the
database refuses a student's write to a plan row, and where the split lives in
the store. Point at this file for the reasoning.

## Verify

- `npm run build` clean.
- Push to `main`. `vercel --prod` is rate limited; the repo integration is the
  deploy. Compare the live bundle hash against `dist/assets/index-*.js`:
  `curl -s https://classes.andrewishak.com/ | grep -o 'assets/index-[^"]*\.js'`.
  Read it twice; one edge can serve the old bundle briefly.
- Reload the dashboard, edit a day, and read `comm3-f26-v1-plan` from the REST
  endpoint with the anon key: the edit is there and the class row did not
  change.
- Sign in as a student in a private window (the roster sheet mints codes) and
  post a message: it lands in the class row and nothing touches the plan row.
- Run the migration. Read both rows back. Reload the dashboard and the class
  site and look at a seeded day, the schedule, a student profile and the
  inbox.

## Rollback

The code falls back to the class row for any plan key the plan row lacks, so
before the migration nothing needs undoing. After it, each class has
`<key>-before-split-<date>` holding the whole row as it was; putting that back
over the class row and deleting `<key>-plan` is the whole rollback. The
policies can be dropped by name.

## Loose ends from 2026-09-28, unrelated to the split

- COMM 3, Sep 28: the section reads "Lesson plan" where Andrew had named it
  "Presidential Stories", and the seeded "How the day runs" row he had deleted
  is back at the end of that section. Both are the revert described above.
  Rename and delete by hand on the dashboard.
- COMM 999, Sep 28: a test left seven empty sections and a line reading "A
  line for the headline". Delete them on the dashboard. Today's backup row
  `comm999-v1-bak-2026-09-28` holds the day as it was.

## Later, not now

The second move, once the split has run for a while: stop writing whole rows.
Each save sends the path and the new value to a Postgres function that applies
it inside the database, and the merge rule in the browser goes away. That
touches every write in the engine and is its own plan.
