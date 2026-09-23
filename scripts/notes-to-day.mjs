// A Markdown file of lecture notes onto a class day.
//
// Andrew wrote the two framing lectures as one file and wanted them on the
// COMM 3 days without losing what the days already hold. The shape of the file
// is the shape of a day:
//
//   **WEDNESDAY: ...**        a day
//   **2. Fisher's ... (5 min)**   a section of that day
//   Walter Fisher, "..." (1984)   a row, and a block behind it
//   - Homo narrans: ...           that block's body
//   - Two tests:                  still the body, indented lines and all
//
// A section whose lines are all bullets has no headings to make rows from, so
// each bullet is a row of its own and nothing becomes a block. A row that ends
// in a web address keeps the address on the block and the citation as its name.
//
// The day keeps every section it had. New sections land after the first one
// and before whatever was there, so the day still opens and closes the way it
// did.
//
//   node scripts/notes-to-day.mjs <file.md> --class comm3-f26-v1 \
//     --day "WEDNESDAY=Sep 23" --day "FRIDAY=Sep 25"
//
// Say --write to do it. Without it, nothing is written and the day is printed.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Reading the file is worth having on its own, so the parser is importable and
// the rest of this only runs when the script is the thing being run.
const RUN_AS_SCRIPT = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

const SUPABASE_URL = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8")
  .match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (RUN_AS_SCRIPT && !key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };

// ─── the file ───

const bold = (line) => line.match(/^\*\*(.+?)\*\*$/)?.[1] || "";
const DAY_HEAD = /^([A-Z][A-Z ]+):\s*(.+)$/;
const SECTION_HEAD = /^(\d+)\.\s*(.+)$/;
const URL_AT_END = /(https?:\/\/\S+?)[.)]?\s*$/;

export function parseNotes(md) {
  const days = [];
  let day = null;
  let section = null;
  let row = null;
  let bulletsOnly = true;

  const endSection = () => {
    if (!section) return;
    // A section of nothing but bullets has no headings to make rows from, so
    // each bullet at the left margin is a row and whatever is indented under
    // it is that row's body.
    if (bulletsOnly) section.rows = section.loose;
    day.sections.push(section);
    section = null; row = null;
  };

  for (const raw of md.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim() || line.trim() === "---") continue;

    const strong = bold(line.trim());
    if (strong) {
      const d = strong.match(DAY_HEAD);
      if (d) { endSection(); if (day) days.push(day); day = { name: d[1].trim(), what: d[2].trim(), sections: [] }; continue; }
      const s = strong.match(SECTION_HEAD);
      if (s && day) { endSection(); section = { title: s[2].trim(), rows: [], loose: [] }; bulletsOnly = true; row = null; continue; }
      // A bold line that is neither: the file's own title.
      continue;
    }
    if (!section) continue;

    const bullet = line.match(/^(\s*)-\s+(.*)$/);
    if (bullet) {
      const indent = bullet[1].length;
      const text = bullet[2].trim();
      if (row) { row.body.push(indent ? "  " + text : text); continue; }
      const last = section.loose[section.loose.length - 1];
      if (indent && last) last.body.push(text);
      else section.loose.push({ title: text, body: [] });
      continue;
    }
    // A line with no dash names a row, and everything under it is its body.
    bulletsOnly = false;
    row = { title: line.trim(), body: [] };
    section.rows.push(row);
  }
  endSection();
  if (day) days.push(day);
  return days;
}

// ─── the store ───

const read = async (id) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  return ((await r.json())[0] || {}).data ?? null;
};
const put = async (id, data) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`write ${id}: ${r.status} ${(await r.text()).slice(0, 200)}`);
};

if (!RUN_AS_SCRIPT) { /* imported for the parser alone */ } else await main();

async function main() {
const args = process.argv.slice(2);
const write = args.includes("--write");
const file = args.find(a => !a.startsWith("--") && a.endsWith(".md"));
const flag = (name) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : ""; };
const dayArgs = args.map((a, i) => (a === "--day" ? args[i + 1] : null)).filter(Boolean);
const classKey = flag("class");
if (!file || !classKey || !dayArgs.length) {
  console.error('node scripts/notes-to-day.mjs <file.md> --class comm3-f26-v1 --day "WEDNESDAY=Sep 23" [--write]');
  process.exit(1);
}
const classId = classKey.split("-")[0];
const wanted = Object.fromEntries(dayArgs.map(s => { const i = s.indexOf("="); return [s.slice(0, i).trim().toUpperCase(), s.slice(i + 1).trim()]; }));

const stamp = Date.now().toString(36);
let n = 0;
const nextId = (what) => `md-${stamp}-${what}-${n++}`;

const parsed = parseNotes(readFileSync(file, "utf8"));
const data = await read(classKey);
if (!data) { console.error(`${classKey}: no row`); process.exit(1); }

const blocks = { ...(data.blocks || {}) };
const dayPlans = { ...(data.dayPlans || {}) };
const today = new Date().toISOString().slice(0, 10);
const report = [];

for (const day of parsed) {
  const date = wanted[day.name];
  if (!date) continue;
  const plan = dayPlans[date] ? { ...dayPlans[date] } : { slots: {}, blocks: [], slides: "", notes: "" };
  const slots = { ...(plan.slots || {}) };
  const had = (plan.order || []).filter(k => k in slots).concat(Object.keys(slots).filter(k => !(plan.order || []).includes(k)));

  const made = [];
  for (const section of day.sections) {
    const slot = `sec-${stamp}-${made.length}`;
    const items = section.rows.map(r => {
      if (!r.body.length) return { id: nextId("row"), text: r.title };
      const url = (r.title.match(URL_AT_END) || [])[1] || "";
      const title = url ? r.title.replace(URL_AT_END, "").replace(/[\s.]+$/, "") : r.title;
      const id = nextId("blk");
      blocks[id] = {
        id, type: url ? "link" : "note", title, body: r.body.join("\n"), url,
        headline: "", children: [], tags: [], concept: "", source: "", refId: "", media: null, ask: "",
        created: today, scheduled: [date], scheduledIn: { [classId]: [date] },
      };
      return { id: nextId("row"), blockId: id };
    });
    slots[slot] = { title: section.title, note: "", items };
    made.push(slot);
  }

  // The day still opens with what it opened with, and ends with what it ended
  // with: the new sections go in behind the first one.
  const order = had.length ? [had[0], ...made, ...had.slice(1)] : made;
  dayPlans[date] = { ...plan, slots, order };
  report.push({ date, made, sections: day.sections.map((s, i) => [made[i], s.title, s.rows.length]), order });
}

for (const r of report) {
  console.log(`\n${r.date}: ${r.made.length} section(s) added, day now reads`);
  r.order.forEach((k, i) => {
    const s = dayPlans[r.date].slots[k];
    const items = Array.isArray(s?.items) ? s.items.length : 1;
    const mine = r.made.includes(k) ? "  <- new" : "";
    console.log(`  ${i + 1}. ${JSON.stringify(s?.title || k)} — ${items} row(s)${mine}`);
  });
}

if (!write) { console.log("\n(say --write to do it)"); process.exit(0); }

// Somebody else may have written the class between the read and now, and this
// writes the whole row. Look again, and stop rather than put a stale copy over
// whatever landed.
const fresh = await read(classKey);
const moved = JSON.stringify(fresh) !== JSON.stringify(data);
if (moved) { console.error("\nThe class changed while this was being worked out. Nothing written. Run it again."); process.exit(1); }

const bak = `${classKey}-bak-notes-${today}`;
await put(bak, data);
await put(classKey, { ...data, blocks, dayPlans });

// Read it back before saying it worked.
const after = await read(classKey);
const ok = report.every(r => (after.dayPlans?.[r.date]?.order || []).join("|") === r.order.join("|"));
console.log(ok ? `\ndone. backup: ${bak}` : "\nWROTE, BUT THE DAY DID NOT READ BACK AS EXPECTED. The backup is " + bak);
}
