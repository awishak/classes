// The two concepts Andrew assigns each COMM 118 student for the Culture Guide.
//
//   node scripts/culture-assign.mjs            asks Claude for every student not yet assigned and prints the table
//   node scripts/culture-assign.mjs --suggest  writes the table to the plan row as cultureSuggested, for the assign page to show
//   node scripts/culture-assign.mjs --write    writes the table to the plan row as cultureAssigned
//   node scripts/culture-assign.mjs --show     prints what the plan row holds now
//
// The same brief the assign page sends (sitdown2/assign.jsx): the twenty
// concepts, the student's Concepts sheet entries, their Locker Room choices
// and reflections, and their picks so far, with no name. The answers are
// cached in private/culture-assign.json between runs, so a dry run and the
// write that follows agree. Run through esbuild, because the engine files
// are JSX:
//   npx esbuild scripts/culture-assign.mjs --bundle --platform=node --format=esm --packages=external --jsx=automatic --loader:.js=jsx --outfile=node_modules/.culture-assign.mjs && node node_modules/.culture-assign.mjs

import "./smoke-globals.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import * as E from "../src/engine/takeover/engine.js";
import { isLurker, MASCOT } from "../src/engine/sections.js";
import { TEAM_TOPICS_KEY, PARTS as TOPIC_PARTS, linesOf } from "../src/engine/teamtopics/sheet.jsx";
import { CULTURE_GUIDE_KEY, chosenOf, lockerAbout, nameOf } from "../src/engine/sitdown2/guide.jsx";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#")).map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY, anthropic = env.ANTHROPIC_API_KEY;
if (!key || !anthropic) { console.error("Need SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const CLASS = "comm118", PLAN = "comm118-f26-v1-plan";
const CACHE = new URL("private/culture-assign.json", ROOT);
const write = process.argv.includes("--write"), suggestOnly = process.argv.includes("--suggest"), show = process.argv.includes("--show");
const lower = (s) => String(s || "").trim().toLowerCase();

const SYSTEM = "You are helping a college instructor (COMM 118, Communication and Sport) assign two concepts to one student for a Culture Guide the student writes before a ten-minute one-on-one meeting. The student chooses four of six concepts; the instructor chooses the other two. You are given the twenty concepts from the chapter, what this student already wrote about some of them, and which the student has already chosen. Choose two the student has NOT already chosen, and never culture, which is the guide itself. Prefer a concept the student's own writing keeps pointing toward without naming, or a concept that would stretch them, over one they have already covered well. Answer with JSON only, no prose around it: {\"first\":{\"id\":\"<concept id>\",\"why\":\"<one full sentence>\"},\"second\":{\"id\":\"<concept id>\",\"why\":\"<one full sentence>\"}}. Each why is one plain full sentence under 30 words, addressed to the instructor, grounded in what the student wrote. No em dashes. No names.";

async function sheetsOf(worksheetKey) {
  const s = await (await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${worksheetKey}&group_key=eq.${CLASS}`, { headers: H })).json();
  const out = new Map();
  for (const sh of s) {
    const rows = await (await fetch(SUPABASE_URL + `/rest/v1/worksheet_answers?select=field,value,position&sheet_id=eq.${sh.id}&order=position`, { headers: { ...H, Range: "0-1999" } })).json();
    const a = {}; rows.forEach(r => { a[r.field] = (a[r.field] || "") + r.value; });
    out.set(lower(sh.viewer_id), { answers: a, submitted_at: sh.submitted_at });
  }
  return out;
}
function briefOf(topics, locker, picks) {
  const lines = ["Concepts, by id: " + E.CONCEPTS.filter(c => c.id !== "culture").map(c => c.id + " = " + c.name).join("; ")];
  const sheet = [];
  ["a", "b", "c", "d", "e"].forEach(s => {
    const t = String((topics || {})["topic:" + s] || "").trim();
    if (!t) return;
    sheet.push("Concept: " + t + " (" + (E.matchConcept(t) || "no id") + ")\n" + TOPIC_PARTS.map(p => p.box + ": " + linesOf((topics || {})[p.field + ":" + s]).join(" / ")).join("\n"));
  });
  lines.push(sheet.length ? "The Concepts sheet:\n" + sheet.join("\n\n") : "No Concepts sheet.");
  const season = [];
  E.CONCEPTS.forEach(c => lockerAbout(locker, c.id, "", []).forEach(w => { if (w.wrote) season.push("Locker Room, " + c.name + " (" + c.id + "): chose \"" + w.chose + "\" and wrote \"" + w.wrote + "\""); }));
  lines.push(season.length ? "Locker Room:\n" + season.join("\n") : "No Locker Room season.");
  lines.push(picks.length ? "Already chosen on the guide: " + picks.map(id => id + " = " + nameOf(id)).join(", ") : "Nothing chosen on the guide yet.");
  return lines.join("\n\n");
}
// The answer is JSON in spirit; a quoted phrase inside a why breaks a strict
// parse, so the two pairs are read with a pattern, and a thin or rate-limited
// answer is asked again.
const PAIR = (k) => new RegExp('"' + k + '"\\s*:\\s*\\{\\s*"id"\\s*:\\s*"([a-z]+)"\\s*,\\s*"why"\\s*:\\s*"([\\s\\S]*?)"\\s*\\}');
async function suggest(brief) {
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": anthropic, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-opus-5-5", max_tokens: 500, system: SYSTEM, messages: [{ role: "user", content: brief }] }) });
    const out = await r.json().catch(() => ({}));
    const text = (out.content || []).map(c => c.text || "").join("").trim();
    if (!r.ok || !text) { last = out.error?.message || ("HTTP " + r.status); await new Promise(res => setTimeout(res, 3000 * (attempt + 1))); continue; }
    const a = text.match(PAIR("first")), b = text.match(PAIR("second"));
    const ids = [a?.[1], b?.[1]].map(id => E.conceptOf(String(id || "").trim()) ? String(id).trim() : "");
    if (ids[0] && ids[1] && ids[0] !== ids[1]) return { ids, why: { [ids[0]]: a[2].replace(/\\"/g, '"').trim(), [ids[1]]: b[2].replace(/\\"/g, '"').trim() } };
    last = "could not read two concepts from: " + text.slice(0, 160).replace(/\n/g, " ");
  }
  throw new Error(last);
}

const plan = (await (await fetch(SUPABASE_URL + "/rest/v1/app_data?id=eq." + PLAN + "&select=data", { headers: H })).json())?.[0]?.data;
if (!plan) { console.error("No plan row."); process.exit(1); }
const roster = (plan.students || []).filter(s => s && s.email && !isLurker(s.name) && s.name !== MASCOT).sort((a, b) => a.name.localeCompare(b.name));
const have = plan.cultureAssigned || {};
if (show) { roster.forEach(s => { const a = have[lower(s.email)]; console.log(s.name.padEnd(22), a ? a.ids.map(nameOf).join(", ") : "not set"); }); process.exit(0); }

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const [topics, locker, guide] = await Promise.all([TEAM_TOPICS_KEY, E.TAKEOVER_KEY, CULTURE_GUIDE_KEY].map(sheetsOf));
for (const s of roster) {
  const em = lower(s.email);
  if (have[em]?.ids?.length === 2 || cache[em]) continue;
  const t = topics.get(em)?.answers || {}, l = locker.get(em)?.answers || {}, g = guide.get(em)?.answers || {};
  try { cache[em] = await suggest(briefOf(t, l, chosenOf(g).filter(Boolean))); }
  catch (e) { console.error("  " + s.name + ": " + e.message); }
  writeFileSync(CACHE, JSON.stringify(cache, null, 2));
}
for (const s of roster) {
  const em = lower(s.email);
  const a = have[em]?.ids?.length === 2 ? { ...have[em], set: true } : cache[em];
  const t = topics.get(em)?.answers || {};
  const wrote = ["a", "b", "c", "d", "e"].map(k => E.matchConcept(t["topic:" + k])).filter(Boolean).map(nameOf);
  console.log("\n" + s.name + (a?.set ? "  (set)" : "") + "\n  wrote about: " + (wrote.join(", ") || "nothing on file"));
  if (!a) { console.log("  no suggestion"); continue; }
  a.ids.forEach(id => console.log("  " + nameOf(id) + ": " + (a.why?.[id] || "")));
}
if (!write && !suggestOnly) { console.log("\nNothing written. Say --suggest to show these on the assign page, or --write to assign them."); process.exit(0); }
const fresh = (await (await fetch(SUPABASE_URL + "/rest/v1/app_data?id=eq." + PLAN + "&select=data", { headers: H })).json())?.[0]?.data;
const keyName = suggestOnly ? "cultureSuggested" : "cultureAssigned";
const next = { ...(fresh[keyName] || {}) };
roster.forEach(s => { const em = lower(s.email); if (cache[em] && (suggestOnly || !(next[em]?.ids?.length === 2))) next[em] = { ids: cache[em].ids, why: cache[em].why }; });
const r = await fetch(SUPABASE_URL + "/rest/v1/app_data?on_conflict=id", { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify([{ id: PLAN, data: { ...fresh, [keyName]: next } }]) });
console.log(r.ok ? "\nWritten: " + Object.keys(next).length + " students on " + keyName + "." : "\nWrite failed: " + r.status + " " + await r.text());
