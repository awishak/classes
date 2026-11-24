// One student's standing, line by line, the way his Summary works it out:
// each weighted challenge, its grade and score, and the sum. A grade that is
// sorted and not released is counted and marked. Reads only. Prints a
// student's grades, so run it for yourself.
//
//   node scripts/standing.mjs comm118 "<name on the roster>"
import { readFileSync } from "node:fs";
import { assignmentsOf } from "../src/engine/profileTask.js";
import { bucketOf, cardLetter, letterOf, scoreOf, gradeScore } from "../src/engine/grades.js";
import comm3 from "../src/config/comm3.js";
import comm118 from "../src/config/comm118.js";
const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + ": " + r.status); return r.json(); };
const [which, name] = process.argv.slice(2);
const config = { comm3, comm118 }[which];
const row = (await get(`app_data?id=eq.${config.storageKey}&select=data`))[0].data, plan = (await get(`app_data?id=eq.${config.storageKey}-plan&select=data`))[0].data;
const data = { ...row, ...plan };
let earned = 0, weight = 0;
console.log(name + ", " + config.code + "\n");
console.log("weight  grade                 score  counts  challenge");
for (const a of assignmentsOf(config, data)) {
  const g = (data.assignmentLog?.[a.id]?.[name] || []).filter(e => e.type === "grade" && !e.deleted).sort((x, y) => x.ts - y.ts).pop();
  const card = data.gradeBoard?.[a.id]?.cards?.[name], b = card?.bucket ? bucketOf(card.bucket) : null;
  const heldScore = b ? scoreOf(card, b) : null;
  const held = b && (!g || g.bucket !== b.id || gradeScore(g) !== (heldScore ?? null));
  const letter = held ? cardLetter(card, b) + " (not released)" : g ? g.letter : "";
  const score = held ? heldScore : gradeScore(g);
  const w = a.weight || 0, counts = w > 0 && score != null;
  if (counts) { earned += score * w; weight += w; }
  console.log(String(w).padStart(5) + "   " + (letter || "no grade").padEnd(21) + " " + String(score ?? "").padStart(5) + "  " + (counts ? String(Math.round(score * w) / 100).padStart(6) : w > 0 ? "    no" : "     0") + "  " + a.title);
}
const pct = weight ? Math.round(earned / weight) : null;
console.log("\nGraded so far: " + weight + " of 100 points of weight. Earned " + (Math.round(earned) / 100) + " of " + weight + ".");
console.log("Standing: " + pct + ", " + letterOf(pct));
