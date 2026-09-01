// Voice rules the build can actually enforce, on the words that reach a screen.
//
// Two of the rules in VOICE.md are mechanical, and both have been broken over
// and over — the corrections log has six entries for the first one alone, and
// I broke it again this session in "+ a headline for it". A rule I have to
// remember is a rule I will miss. A rule the build checks is not.
//
//   1. No clause closes on a bare "it", "this", "that", "one" or "them".
//      Name the thing.
//   2. No em dashes in words the user reads. The guardrail is on Claude, not
//      on Andrew — he uses them freely in his own writing.
//
// Only user-facing strings are checked: JSX text, and the props that become
// text (title, placeholder, aria-label, label, alt). Comments and code are
// left alone, and a line can opt out with `voice-ok`.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname;
// The forked pre-engine class files are frozen and not worth rewriting. The
// seed library is generated from teaching/seeds.md, which is Andrew writing in
// his own voice: the em dash rule is a guardrail on Claude, and running it over
// his own sentences would be the check correcting the author.
const SKIP = /(^|\/)(Comm2|Comm4|Comm118|Comm3)\.jsx$|(^|\/)config\/seed-library\.js$/;

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    if (/\.jsx?$/.test(full) && !SKIP.test(full)) files.push(full);
  }
})(ROOT);

const TEXT_PROP = /\b(title|placeholder|aria-label|alt|label)\s*=\s*(?:\{)?["']([^"']{4,200})["']/g;
const JSX_TEXT = />([A-Z][^<>{}\n]{6,200}?)</g;
// The fallback idiom, which is where most UI copy actually lives:
//   {headline || "+ a headline for this reading"}
//   {done ? "Put this row back on the list" : "Tick this row off"}
// The first version of this check looked only at props and JSX text, so it
// scanned right past the very string that prompted it.
const JSX_EXPR = /(?:\|\||\?|:|\{)\s*["']([A-Za-z+][^"']{5,200})["']/g;
// A clause ending on a word that names nothing.
const DANGLER = /\b(it|this|that|one|them)\s*[.,;!?]?\s*$/i;
// Names of things are not clauses. "This or That" is a game we play, and no
// amount of naming the thing helps a proper noun.
// Set phrases and the names of things. "Got it" is the label on a button a
// student taps to say they understood, and no amount of naming the thing
// improves a two-word set phrase.
const NAMES = new Set(["this or that", "got it"]);

let bad = 0;
const say = (file, line, text, why) => {
  bad++;
  console.error(`  ${file.replace(ROOT, "src/")}:${line}  ${why}`);
  console.error(`      ${JSON.stringify(text.length > 90 ? text.slice(0, 90) + "…" : text)}`);
};

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.includes("voice-ok")) return;
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    const found = [];
    for (const m of line.matchAll(TEXT_PROP)) found.push(m[2]);
    for (const m of line.matchAll(JSX_TEXT)) found.push(m[1]);
    if (/\.jsx$/.test(file)) for (const m of line.matchAll(JSX_EXPR)) found.push(m[1]);

    for (const raw of found) {
      const text = raw.trim();
      if (!text || !/[a-z]/i.test(text)) continue;
      // Check each clause, because the rule covers clauses and not only
      // whole sentences.
      for (const clause of text.split(/[.;,]|\s—\s/)) {
        const c = clause.trim();
        if (NAMES.has(c.toLowerCase())) continue;
        if (DANGLER.test(c)) { say(file, i + 1, text, "clause ends on a word that names nothing"); break; }
      }
      if (text.includes("—")) say(file, i + 1, text, "em dash in words the reader sees");
    }
  });
}

if (bad) {
  console.error(`\ncheck-voice: ${bad} line(s) break a voice rule. Name the thing, or drop the dash.`);
  process.exit(1);
}
console.log(`check-voice: ${files.length} files scanned, UI copy holds the line`);
