// Ten teaching moves, seeded into the shared repository.
//
// They are blocks like anything else — activity type, tagged "teaching move" —
// so they can be dropped into a day, edited, and added to. The research on
// empty states is blunt about this: a blank box with a plus on it is the worst
// version, and three to five real examples is what makes people start. Ten,
// because these are cheap to skim and he asked for ten.
//
//   node scripts/seed-moves.mjs           dry run
//   node scripts/seed-moves.mjs --write   writes

import { readFileSync } from "node:fs";
const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const BASE = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const MOVES = [
  ["Think, pair, share", "Ask an open question. A minute alone writing, two minutes with the person next to them, then call on pairs rather than individuals — nobody is exposed and everybody has already said it once."],
  ["Muddiest point", "What was the least clear thing today. Ninety seconds, anonymous, on the way out. It tells me what to open with next time."],
  ["One-minute paper", "The two most important points from today, in their words, before they leave. Cheap retrieval practice and it doubles as attendance."],
  ["Peer instruction", "Ask, everyone commits alone, close the floor, they argue, ask again. Aim for a question a third to two thirds get right first time; below that the argument dies. The second vote is the whole point."],
  ["Fishbowl", "An inner circle discusses, the outer circle watches for something specific, then they swap. Works when the reading is contested rather than settled."],
  ["Jigsaw", "Split the material four ways. Each group becomes the expert on its quarter, then regroup so every new group has one of each and has to teach the others."],
  ["Gallery walk", "Work goes up on the walls. They circulate with a question to answer at each stop. Gets a stuck room out of its chairs."],
  ["This or that", "A forced choice with no middle option, then ask the people who chose least popular to defend it. Fast, loud, and a good opener."],
  ["Devil's advocate", "I take the position nobody in the room holds and make them argue me out of it. Only works if I actually make the strong version of the case."],
  ["Exit ticket", "One question on the way out that they cannot answer without having been here. Not attendance — a check on whether the thing landed."],
];

const get = async (id) => (await (await fetch(BASE + "/rest/v1/app_data?id=eq." + id + "&select=data", { headers })).json())?.[0]?.data || null;

const cur = (await get("ishak-blocks-v1")) || {};
const blocks = { ...(cur.blocks || {}) };
const have = new Set(Object.values(blocks).map(b => (b.title || "").toLowerCase()));

let added = 0;
MOVES.forEach(([title, body], i) => {
  if (have.has(title.toLowerCase())) return;
  const id = "move-" + (i + 1);
  blocks[id] = {
    id, type: "activity", title, body, url: "", headline: "",
    children: [], tags: ["teaching move"], concept: "", source: "", refId: "",
    created: "2026-08-26", scheduled: [],
  };
  added++;
});

console.log("  " + added + " moves to add · shared store would hold " + Object.keys(blocks).length + " blocks");
MOVES.forEach(([t]) => console.log("     " + t));

if (process.argv.includes("--write")) {
  const r = await fetch(BASE + "/rest/v1/app_data?on_conflict=id", {
    method: "POST", headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: "ishak-blocks-v1", data: { ...cur, blocks }, updated_at: new Date().toISOString() }),
  });
  console.log(r.ok ? "  written" : "  FAILED " + r.status);
} else {
  console.log("\n  dry run. add --write to do it.");
}
