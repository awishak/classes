// A term's roster, out of the registrar's spreadsheets and into a class.
//
// Andrew hands over what Workday gives him: a photo roster per section, with
// preferred names, student ids and the meeting pattern, and no email address
// anywhere. Emails come from a second export. So this reads any number of
// .xlsx files, merges them on student id where it can and on name where it
// cannot, and prints what it found before it is allowed to write anything.
//
//   node scripts/roster-import.mjs <class> file.xlsx [more.xlsx ...]
//   node scripts/roster-import.mjs <class> --section 8:00 a.xlsx --section 10:30 b.xlsx
//   node scripts/roster-import.mjs <class> ... --write
//
// A course roster carries the emails and no meeting pattern; a photo roster
// carries the pattern and no emails. So --section says which sitting the
// files after it belong to, and the rest is merged on student id.
//
// Without --write it only says what it would do. With it, the class store is
// backed up first, to <storageKey>-bak-roster-<date>, and then the students
// array is replaced. The test student is kept, because he is Andrew's way of
// looking at his own site.
//
// Sections are the labels the class's `meets` carry, because that is what
// every people-shaped surface filters on. A meeting pattern that says
// "10:30 AM - 11:35 AM" is the sitting labelled "10:30".

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { ENGINE_LIST } from "../src/config/registry.js";

// ─── reading a sheet, without a library ───
// An .xlsx is a zip of XML. Values arrive either as an index into a shared
// string table or as an inline string, and an export that uses one and not the
// other reads as an empty sheet if you only handle the other.
const unzip = (file, entry) => execFileSync("unzip", ["-p", file, entry], { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
const tagText = (xml) => [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => m[1]).join("");
const unesc = (s) => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#10;/g, "\n").replace(/&amp;/g, "&");

function sheetRows(file) {
  let shared = [];
  try {
    shared = [...unzip(file, "xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => unesc(tagText(m[1])));
  } catch { /* a sheet with only inline strings has no table */ }
  const xml = unzip(file, "xl/worksheets/sheet1.xml");
  const rows = [];
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const cm of rm[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const [, col, attrs, body] = cm;
      const v = /<v>([\s\S]*?)<\/v>/.exec(body);
      const val = / t="s"/.test(attrs) && v ? shared[Number(v[1])]
        : v ? v[1]
        : /<is>/.test(body) ? tagText(body) : "";
      const said = unesc(val || "").trim();
      if (said) cells[col] = said;
    }
    if (Object.keys(cells).length) rows.push(cells);
  }
  return rows;
}

// The header row is the one that names a column we need, whatever it is called.
const HEADS = {
  // "Preferred Name" is the whole name on one export and the first name only
  // on another, so it is read as a hint rather than as the answer. See nameOf.
  pref: [/preferred name/i],
  name: [/^student$/i, /^student name$/i, /^name$/i],
  last: [/last name/i, /surname/i],
  first: [/first name/i, /given name/i],
  id: [/student id/i, /^id$/i],
  email: [/e-?mail/i],
  section: [/course section/i, /^section$/i],
  meets: [/meeting pattern/i],
};

function mapColumns(rows) {
  for (const row of rows) {
    const cols = {};
    for (const [col, said] of Object.entries(row)) {
      for (const [key, tests] of Object.entries(HEADS)) {
        if (!cols[key] && tests.some(re => re.test(said))) cols[key] = col;
      }
    }
    if (cols.name || cols.pref || (cols.first && cols.last) || cols.email) return { cols, at: rows.indexOf(row) };
  }
  return { cols: {}, at: -1 };
}

// "M W F | 10:30 AM - 11:35 AM" is the sitting called 10:30.
const sittingOf = (config, meets) => {
  const said = String(meets || "");
  const labels = (Array.isArray(config.meets) ? config.meets : config.meets ? [config.meets] : [])
    .map(m => String(m.label || "").trim()).filter(Boolean);
  const hit = labels.find(l => said.includes(l));
  if (hit) return hit;
  const m = /(\d{1,2}:\d{2})/.exec(said);
  return m && labels.includes(m[1]) ? m[1] : "";
};

// What to call a student.
//
// Workday hands over three name columns and means something different by them
// in each export. The photo roster's Preferred Name is "Jude Lifeset"; the
// course roster's is "Gianna", with the surname in a column of its own. So a
// preferred name that holds a whole name wins, and a preferred first name is
// put in front of the legal surname. Either way the class sees the name the
// student chose, which is the point of the column.
const nameOf = (pref, first, last, whole) => {
  const p = (pref || "").trim();
  const family = (last || "").trim();
  const tail = (s) => (s.split(/\s+/).pop() || "").toLowerCase();
  // A preferred name that ends in the surname is the whole name: "Jude
  // Lifeset" for a Judith, "Sidi Gueye" for an El Hadji. One that does not is
  // a given name however many words it has, which is how "Lucy Kate" for a
  // Murray came out as a student with no surname at all.
  if (p && family && tail(p) === tail(family)) return p;
  const given = p || (first || "").trim();
  if (given && family) return given + " " + family;
  return (whole || "").trim() || given || family;
};

export function readRoster(config, files) {
  const people = new Map();   // id or lowercased name -> row
  for (const { file, section: said } of files) {
    const rows = sheetRows(file);
    const { cols, at } = mapColumns(rows);
    if (at < 0) { console.error("  " + file + ": no header row I recognise"); continue; }
    let found = 0;
    rows.slice(at + 1).forEach(r => {
      const name = nameOf(cols.pref && r[cols.pref], cols.first && r[cols.first],
        cols.last && r[cols.last], cols.name && r[cols.name]);
      const email = (cols.email && r[cols.email] || "").toLowerCase();
      const id = (cols.id && r[cols.id]) || "";
      if (!name && !email) return;
      const key = id || name.toLowerCase();
      const had = people.get(key) || { name: "", email: "", id, section: "", last: "" };
      people.set(key, {
        ...had,
        name: name || had.name,
        email: email || had.email,
        id: id || had.id,
        last: (cols.last && r[cols.last]) || had.last,
        section: sittingOf(config, cols.meets && r[cols.meets]) || said || had.section,
      });
      found++;
    });
    console.error("  " + file.split("/").pop() + ": " + found + " rows"
      + (said ? ", section " + said : "") + ", columns " + JSON.stringify(cols));
  }
  return [...people.values()];
}

const slug = (s) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function main() {
  const [classId, ...rest] = process.argv.slice(2);
  const write = rest.includes("--write");
  const files = [];
  let said = "";
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--write") continue;
    if (rest[i] === "--section") { said = rest[++i] || ""; continue; }
    files.push({ file: rest[i], section: said });
  }
  const config = ENGINE_LIST.find(c => c.id === classId || c.path === "/" + classId);
  if (!config || !files.length) {
    console.error("usage: node scripts/roster-import.mjs <class> file.xlsx [more.xlsx] [--write]");
    console.error("classes: " + ENGINE_LIST.map(c => c.id).join(", "));
    process.exit(1);
  }
  const rows = readRoster(config, files);
  const students = rows.map(r => ({ id: slug(r.name), name: r.name, email: r.email, section: r.section, from: "", goals: "" }));

  const noEmail = students.filter(s => !s.email);
  const noSection = students.filter(s => !s.section);
  const dupes = students.map(s => s.id).filter((v, i, a) => a.indexOf(v) !== i);
  console.error("\n" + students.length + " students");
  const bySection = {};
  students.forEach(s => { bySection[s.section || "(none)"] = (bySection[s.section || "(none)"] || 0) + 1; });
  console.error("by section: " + JSON.stringify(bySection));
  if (noEmail.length) console.error("NO EMAIL (" + noEmail.length + "): " + noEmail.map(s => s.name).join(", "));
  const sittings = (Array.isArray(config.meets) ? config.meets : config.meets ? [config.meets] : [])
    .map(m => String(m.label || "").trim()).filter(Boolean);
  if (sittings.length > 1 && noSection.length) {
    console.error("NO SECTION (" + noSection.length + "): " + noSection.map(s => s.name).join(", "));
  }
  if (dupes.length) console.error("DUPLICATE IDS: " + dupes.join(", "));
  // Compound surnames the app cannot split on the last space.
  const compound = rows.filter(r => r.last && r.last.includes(" "));
  if (compound.length) console.error("lastNameOverrides: " + JSON.stringify(Object.fromEntries(compound.map(r => [r.name, r.last]))));

  console.log(JSON.stringify(students, null, 2));
  if (!write) { console.error("\nNothing written. Add --write to put this on the class store."); return; }
  if (noEmail.length) { console.error("\nRefusing to write: " + noEmail.length + " students have no email, and an email is how they sign in."); process.exit(1); }
  console.error("\nWriting is done by the roster screen, which backs the store up as it goes.");
}

if (process.argv[1] && process.argv[1].endsWith("roster-import.mjs")) main();
