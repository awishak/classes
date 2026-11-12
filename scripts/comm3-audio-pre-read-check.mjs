// Ask the live site for Claude's read of the audio story pre-production, the
// way the review page does, and say what came back. With no sign-in the
// answer has to be 401; with the instructor PIN from .env.local, the read.
//
//   node scripts/comm3-audio-pre-read-check.mjs

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const URL_ = "https://classes.andrewishak.com/api/sitdown-sheet?sheet=audio-pre&class=comm3";

const anon = await fetch(URL_);
console.log("no sign-in:", anon.status);
if (!env.INSTRUCTOR_PIN) { console.log("No INSTRUCTOR_PIN in .env.local, so the signed-in read is not checked."); process.exit(0); }
const r = await fetch(URL_ + "&pin=" + encodeURIComponent(env.INSTRUCTOR_PIN));
const out = r.ok ? await r.json() : null;
const list = out ? Object.values(out.students || {}) : [];
console.log("with the PIN:", r.status, out ? `${list.length} reads, pulled ${out.at}, ${(out.notes || []).length} notes` : await r.text());
if (list.length) console.log("  first read has:", Object.keys(list[0]).join(", "));
// Which Culture Guide file the same route still serves, to see the old sheets were not disturbed.
const cg = await fetch("https://classes.andrewishak.com/api/sitdown-sheet?sheet=2&class=comm118&pin=" + encodeURIComponent(env.INSTRUCTOR_PIN));
console.log("Culture Guide read, same route:", cg.status);
