// How far along one student's worksheet is, 0 to 1, from its answers.
//
// Andrew, 2026-10-16: "i want a list of completed vs not. like give me graphs
// on that page. every student in terms of 0 to 100 percent completion." Each
// sheet built in this repo knows its own shape, so each gets its own measure.
// A sheet from the package is measured against the class: the fields one
// student answered over the most any student answered.

import { WORKTOPIA_KEY, F } from "./worktopia/terminal.js";
import { THREE_BY_FIVE_KEY } from "./threebyfive/sheet.js";
import { VISUAL_PRE_KEY, FIELDS as PRE_FIELDS } from "./visualstory/pre.jsx";
import { VISUAL_STORY_KEY } from "./visualstory/story.jsx";
import { storyOf, wordCount, imageCount, MIN_IMAGES, MIN_WORDS } from "./visualstory/model.js";

const has = (a, f) => !!String(a?.[f] ?? "").trim();
const clamp = (x) => Math.max(0, Math.min(1, x));
const parse = (v) => { try { return JSON.parse(v); } catch { return null; } };

// Worktopia: the first round's six parts, then the eight closing questions.
const WORKTOPIA_FIELDS = [F.name, F.title(0), F.skills(0), F.human(0), F.why(0), F.duties(0), F.value(0), F.industry, F.fading, F.rising, F.coworkers, F.meeting, F.thursday, F.stars, F.review];

// 3x5: the best roll, three categories named and nine frames placed.
const threeByFive = (a) => {
  const rolls = Object.keys(a || {}).filter(k => k.startsWith("roll:")).map(k => parse(a[k])).filter(r => r && typeof r === "object");
  if (!rolls.length) return 0;
  return Math.max(...rolls.map(r => {
    const cats = (r.cats || []).filter(c => String(c || "").trim()).length;
    const frames = (r.frames || []).flat().filter(Boolean).length;
    return clamp((cats + frames) / 12);
  }));
};

// The visual story: a headline, enough pictures, enough words.
const visualStory = (a) => {
  const story = storyOf(a || {});
  const parts = [story.headline.trim() ? 1 : 0, clamp(imageCount(story) / MIN_IMAGES), clamp(wordCount(story) / MIN_WORDS)];
  return parts.reduce((n, x) => n + x, 0) / parts.length;
};

const MEASURES = {
  [WORKTOPIA_KEY]: (a) => WORKTOPIA_FIELDS.filter(f => has(a, f)).length / WORKTOPIA_FIELDS.length,
  [THREE_BY_FIVE_KEY]: threeByFive,
  [VISUAL_PRE_KEY]: (a) => PRE_FIELDS.filter(f => has(a, f)).length / PRE_FIELDS.length,
  [VISUAL_STORY_KEY]: visualStory,
};

const answered = (a) => Object.keys(a || {}).filter(f => has(a, f)).length;

/** Progress for every sheet of one worksheet: { [viewer_id]: 0..1 }. sheets: [{ viewer_id, answers }]. */
export function progressOf(key, sheets) {
  const out = {};
  const measure = MEASURES[key];
  if (measure) { sheets.forEach(s => { out[s.viewer_id] = clamp(measure(s.answers)); }); return out; }
  const most = Math.max(1, ...sheets.map(s => answered(s.answers)));
  sheets.forEach(s => { out[s.viewer_id] = clamp(answered(s.answers) / most); });
  return out;
}

export const percentOf = (x) => Math.round(clamp(x || 0) * 100);
