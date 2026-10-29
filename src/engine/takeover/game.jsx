// Takeover, on the screen: /comm118/worksheets/takeover.
//
// A student takes over a team of their classmates and spends six weeks on
// it. engine.js decides everything; this file draws it and saves it. Every
// answer is a worksheet row (worktopia/store.js) through saver.js, so
// nothing typed is lost. A week's result is saved packed in its own row the
// moment the choice is made, so a reload replays the week the student saw
// even if the engine's words change later. The cast is saved too, so a
// roster change later never reshuffles a season already on file.
//
// Fields: sport, team, concepts, cast, then per week a to f: prompt, choice,
// result, reflect, source; poll on b, d and f; final a to c. engine.js F.
//
// Andrew, 2026-10-29: "eight bit graphics, almost like Zelda ... kind of
// fun noises ... when somebody's upset, they should have little lines coming
// out of their head ... when somebody's happy, they should cheer ... little
// uniforms." And on the second pass: "we need a back button on each page
// so people can at least go back ... a card that explains what's happening
// here ... show the numbers getting bigger, like show the bars moving."

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "../visualstory/saver.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { supabaseStore } from "../worktopia/store.js";
import { gameClient } from "../gameClient.js";
import * as E from "./engine.js";
import { spriteFromName, renderSprite, drawField, drawMatch, uniform, journalist, MOOD_GLYPH } from "./pixel.js";
import { createSound } from "./sound.js";

export { TAKEOVER_KEY, TAKEOVER_TITLE } from "./engine.js";
// The sheet whose answers set a student's season (teamtopics/sheet.jsx).
const TOPICS_KEY = "team-topics";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
const loadFont = () => {
  if (typeof document === "undefined" || document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = FONT_HREF; document.head.appendChild(l);
};
const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── the file, read ───

/** The saved concepts, "goals:a,failure:b,culture:" back to the plan's shape. */
export const parseConcepts = (s) => String(s || "").split(",").map(x => x.trim()).filter(Boolean).map(x => { const [id, slot] = x.split(":"); return E.conceptOf(id) ? { id, slot: slot || "" } : null; }).filter(Boolean);
export const packConcepts = (list) => list.map(c => c.id + ":" + (c.slot || "")).join(",");
const parsePrompt = (s) => { const i = String(s || "").indexOf("|"); return i < 0 ? null : { kind: s.slice(0, i), text: s.slice(i + 1) }; };
const packPrompt = (p) => p.kind + "|" + p.text;
const blank = (v) => !String(v || "").trim();
// Andrew's prompt with the student's own words in the blank. Their sentence
// loses its final period, since the prompt supplies one.
const askOf = (copy, prompt) => prompt.kind === "press" ? copy.say("reflectPress") : prompt.kind === "final" ? copy.say("reflectFinal")
  : copy.say("reflect").replace("{wonder}", String(prompt.text || "").trim().replace(/[.!?]+$/, ""));

/** What the file still needs before the season can be handed in. */
export function missingOf(answers) {
  const a = answers || {};
  const out = [];
  if (blank(a[E.F.sport])) out.push("a sport");
  if (blank(a[E.F.team])) out.push("a team");
  E.LETTERS.forEach((w, i) => {
    if (blank(a[E.F.result(w)])) out.push("week " + (i + 1));
    else if (blank(a[E.F.reflect(w)])) out.push("week " + (i + 1) + "'s answer");
    if (E.POLL_WEEKS.includes(w) && !blank(a[E.F.result(w)]) && blank(a[E.F.poll(w)])) out.push("week " + (i + 1) + "'s poll");
  });
  [0, 1, 2].forEach(i => { if (blank(a[E.F.final(i)])) out.push("final question " + (i + 1)); });
  return out;
}

/** Who plays which part on a file, or a fresh deal when the file has none. */
export const castOf = (answers, name, classmates) => E.parseCast((answers || {})[E.F.cast]) || E.deal(name, classmates).cast;
export const teamOf = (answers, name) => String((answers || {})[E.F.team] || "").trim() || E.teamNameFor(name);
/** The rest of the squad, and the one the finale is about. */
export const benchOf = (cast, classmates) => { const in5 = new Set(Object.values(cast)); return (classmates || []).filter(n => !in5.has(n)); };
export const benchNameOf = (cast, classmates, name) => { const b = benchOf(cast, classmates); return b.length ? E.pick(b, name, "hurt") : E.FILL.find(f => !Object.values(cast).includes(f)); };

// ─── pixels ───

// Every player is drawn from their name: hair, jersey, number. The card
// photographs are not used. Andrew, 2026-10-29: "the avatars need to be
// people not picture squares."
const gridFor = (name, photo, jersey) => uniform(spriteFromName(name), jersey, 8);

function Sprite({ name, photo, scale = 4, jersey = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el) renderSprite(el, gridFor(name, photo, jersey), scale);
  }, [name, photo, scale, jersey]);
  return <canvas ref={ref} width={16 * scale} height={16 * scale} aria-hidden="true" />;
}

// A sprite that is not a player: the reporter.
function Fixed({ grid: g, scale = 4 }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) renderSprite(ref.current, g, scale); }, [g, scale]);
  return <canvas ref={ref} width={16 * scale} height={16 * scale} aria-hidden="true" />;
}
const REPORTER = journalist();

function Field({ sport, sign }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) drawField(ref.current, sport); }, [sport]);
  return (
    <div className="ground">
      <canvas ref={ref} className="field" width={320} height={96} aria-hidden="true" />
      {sign ? <span className="sign px">{sign}</span> : null}
    </div>
  );
}

// The ball goes back and forth, then the week's result comes in.
function MatchScene({ sport, left, right, jersey, sound, onDone, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let alive = true, lastCrossing = -1;
    const two = [gridFor(left.name, left.photo, jersey), gridFor(right.name, right.photo, (jersey + 3) % 7)];
    const ms = reduced() ? 300 : 2800;
    const t0 = performance.now();
    sound.whistle();
    const frame = (now) => {
      if (!alive) return;
      const t = Math.min(1, (now - t0) / ms);
      const crossing = drawMatch(el, { sport, left: two[0], right: two[1], t });
      if (crossing !== lastCrossing) { lastCrossing = crossing; if (t > 0) sound.bounce(); }
      if (t < 1) requestAnimationFrame(frame); else onDone();
    };
    requestAnimationFrame(frame);
    return () => { alive = false; };
  // One scene a week; the two players never change mid-scene.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="ground">
      <canvas ref={ref} className="field" width={320} height={96} aria-hidden="true" />
      <span className="sign px">{label}</span>
    </div>
  );
}

function Player({ name, photo, role, mood, scale = 4, lit, jersey }) {
  return (
    <div className={"player" + (lit ? " lit" : "") + (mood ? " " + mood : "")}>
      <Sprite name={name} photo={photo} scale={scale} jersey={jersey} />
      <span className="name">{name}</span>
      {role ? <span className="role px">{role}</span> : null}
      {mood ? <span className={"mood px " + mood} aria-label={"mood " + mood}>{MOOD_GLYPH[mood]}</span> : null}
    </div>
  );
}

function Squad({ cast, bench, photos, moods, lit, scale, jersey, cheer }) {
  return (
    <div className={"squad" + (cheer ? " " + cheer : "")}>
      {E.CHARACTERS.map(c => <Player key={c.id} name={cast[c.id]} photo={photos[cast[c.id]]} role={c.label} mood={moods ? moods[c.id] : null} lit={lit === c.id} scale={scale} jersey={jersey} />)}
      {bench.length ? <div className="bench">{bench.map(n => <Player key={n} name={n} photo={photos[n]} scale={2} jersey={jersey} />)}</div> : null}
    </div>
  );
}

// The three numbers and the coins. deltas, when given, show beside each bar
// and the bars slide to the new numbers. Andrew: "show the bars moving."
const signed = (n) => (n > 0 ? "+" : "") + n;
function Meter({ label, value, delta }) {
  return (
    <span className="meter">
      <span className="ml">{label}</span>
      <span className="bar"><i style={{ width: value + "%" }} /></span>
      <span className="n">{value}</span>
      {delta != null && delta !== 0 ? <span className={"delta " + (delta > 0 ? "up" : "down")}>{signed(delta)}</span> : null}
    </span>
  );
}
function Hud({ copy, state, deltas }) {
  return (
    <div className="hud px">
      <span className="cap"><span className="ml"><Words k="capital" copy={copy} /></span> <b className="coins">{E.coins(state.capital)}</b> <span className="n">{state.capital}</span>{deltas && deltas.back != null ? <span className="delta up">{"+" + deltas.back + " back"}</span> : null}</span>
      <Meter label={copy.say("culture")} value={state.culture} delta={deltas ? deltas.culture : null} />
      <Meter label={copy.say("skills")} value={state.skills} delta={deltas ? deltas.skills : null} />
      <Meter label={copy.say("success")} value={state.success} delta={deltas ? deltas.success : null} />
      <span className="rec"><span className="ml"><Words k="record" copy={copy} /></span> <span className="n">{state.wins}-{state.losses}</span></span>
    </div>
  );
}

// The back button every page has. Andrew: "they have to be able to go back
// and look at stuff."
function Nav({ copy, onBack, children }) {
  return (
    <div className="nav">
      {onBack ? <button type="button" className="btn px small" onClick={onBack}>{"< " + copy.say("back")}</button> : <span />}
      <span className="row">{children}</span>
    </div>
  );
}

// ─── the chat, one week ───

export function weekLines({ plan, result, cast, sport, team, name, bench }) {
  const sit = E.situationOf(plan.situation);
  const opp = E.opponentFor(name, plan.week, team);
  const ctx = { cast, sport, team, opp, bench, who: sit.who };
  const lines = [{ who: "", text: E.tell(sit.text, ctx) }];
  if (!result) return { lines, opp, ctx };
  const options = (result.options || [result.option]).map(id => E.anyOptionOf(sit, id)).filter(Boolean);
  lines.push({ who: "coach", text: options.map(o => E.tell(o.label, ctx) + ". " + E.tell(o.line, ctx)).join(" ") });
  const tag = E.TAGS[result.tag] ? result.tag : (options[0] || {}).tag || "same";
  E.CHARACTERS.forEach(c => lines.push({ who: cast[c.id], text: E.LINES[c.id][tag][result.moods[c.id]], mood: result.moods[c.id] }));
  lines.push({ who: "", text: (result.won ? "Won " : "Lost ") + E.scoreOf(sport, result.won, name, plan.week) + " to the " + opp + ".", match: result.won ? "won" : "lost" });
  lines.push({ who: "", text: "Culture " + (result.culture - result.dCulture) + " to " + result.culture + ". Skills " + (result.skills - result.dSkills) + " to " + result.skills + ". Success " + (result.success - result.dSuccess) + " to " + result.success + ". " + result.back + " capital back, " + result.capital + " now.", meter: true });
  return { lines, opp, ctx };
}

function Chat({ lines, animate, sound, onDone, copy }) {
  const [shown, setShown] = useState(animate ? 1 : lines.length);
  useEffect(() => {
    if (!animate) { setShown(lines.length); return undefined; }
    let i = 1; const timers = [];
    const step = () => {
      if (i >= lines.length) { if (onDone) onDone(); return; }
      i += 1; setShown(i);
      const line = lines[i - 1];
      if (line.match) { if (line.match === "won") sound.win(); else sound.lose(); } else sound.chat();
      timers.push(setTimeout(step, line.match ? 900 : 650));
    };
    timers.push(setTimeout(step, 500));
    return () => timers.forEach(clearTimeout);
  // The lines of a week never change once the week is resolved.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, lines.length]);
  return (
    <div className="chat" aria-live="polite">
      <div className="chead px"><Words k="chat" copy={copy} /></div>
      {lines.slice(0, shown).map((l, i) => (
        <div key={i} className={"msg" + (l.who ? "" : " sys") + (l.match ? " " + l.match : "") + (l.meter ? " meter" : "")}>
          {l.who ? <b>{l.who === "coach" ? "You" : l.who}</b> : null}
          <span>{l.text}{l.mood ? <span className={"mood px " + l.mood}> {MOOD_GLYPH[l.mood]}</span> : null}</span>
        </div>
      ))}
    </div>
  );
}

// The final whistle: no chat on the last week. Andrew, 2026-10-29: "I don't
// like the group chat at the end." The result, the three numbers, and where
// each player ended up over the season, in plain words.
const STANDING = { up: "with you", flat: "still deciding", down: "not with you" };
export function SeasonWrap({ results, state, cast, copy, matchLine }) {
  const tallies = {};
  E.CHARACTERS.forEach(c => { tallies[c.id] = results.reduce((t, r) => t + (r.moods[c.id] === "up" ? 1 : r.moods[c.id] === "down" ? -1 : 0), 0); });
  return (
    <div className="wrap">
      <div className="chead px"><Words k="wrap" copy={copy} /></div>
      <p className={"line " + (matchLine.match === "won" ? "won" : "lost")}>{matchLine.text}</p>
      <p className="line">{copy.say("record") + " " + state.wins + "-" + state.losses + ". " + copy.say("culture") + " " + state.culture + " (" + E.gradeOf(state.culture) + "). " + copy.say("skills") + " " + state.skills + " (" + E.gradeOf(state.skills) + "). " + copy.say("success") + " " + state.success + " (" + E.gradeOf(state.success) + ")."}</p>
      <ul className="standings">
        {E.CHARACTERS.map(c => { const t = tallies[c.id]; const k = t >= 2 ? "up" : t <= -2 ? "down" : "flat"; return <li key={c.id}><b>{cast[c.id]}</b>{", " + c.label.toLowerCase() + ": " + STANDING[k] + "."}</li>; })}
      </ul>
    </div>
  );
}

function FinalWhistle({ result, lines, animate, sound, onDone, season, cast, copy }) {
  const [shown, setShown] = useState(!animate);
  useEffect(() => {
    if (!animate) { setShown(true); return undefined; }
    const t = setTimeout(() => { if (result.won) sound.win(); else sound.lose(); setShown(true); onDone(); }, 600);
    return () => clearTimeout(t);
  // Once a finale.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);
  if (!shown) return <div className="wrap"><div className="chead px"><Words k="wrap" copy={copy} /></div></div>;
  const matchLine = lines.find(l => l.match) || { text: "", match: result.won ? "won" : "lost" };
  return <SeasonWrap results={season.results} state={season.state} cast={cast} copy={copy} matchLine={matchLine} />;
}

// ─── the season, read back ───

/** Every week on file, read only: the done screen, and the instructor's read. */
export function SeasonLog({ answers, name, classmates, copy }) {
  const sport = E.sportOf(answers[E.F.sport]);
  const concepts = parseConcepts(answers[E.F.concepts]);
  if (!sport || !concepts.length) return <p className="say">Nothing on file yet.</p>;
  const plan = E.planSeason({ name, concepts, topicsAnswers: {} });
  const cast = castOf(answers, name, classmates);
  const team = teamOf(answers, name);
  const bench = benchNameOf(cast, classmates, name);
  const { results, state } = E.replay(answers, name);
  return (
    <div className="log">
      <div className="px head2">{team + " · " + sport.name + " · " + state.wins + "-" + state.losses + " · culture " + state.culture + " · skills " + state.skills + " · success " + state.success + " (" + E.gradeOf(state.success) + ")"}</div>
      {results.map((r, i) => {
        const week = plan[i];
        const prompt = parsePrompt(answers[E.F.prompt(week.week)]) || week.prompt;
        const { lines } = weekLines({ plan: week, result: r, cast, sport, team, name, bench });
        return (
          <section key={week.week} className="week">
            <h3 className="px">{"Week " + week.n + " · " + week.label}</h3>
            {lines.filter(l => !l.who || l.who === "coach").map((l, j) => <p key={j} className={"line" + (l.who ? "" : " sys")}>{l.who ? <b>You: </b> : null}{l.text}</p>)}
            <p className="ask">{askOf(copy, prompt)}</p>
            <p className="answer">{answers[E.F.reflect(week.week)] || <i>No answer yet.</i>}</p>
            {answers[E.F.source(week.week)] ? <p className="source">{copy.say("sourceAsk")}: {answers[E.F.source(week.week)]}</p> : null}
            {week.poll ? <p className="source">{copy.say("pollAsk")} {answers[E.F.poll(week.week)] || <i>Not answered.</i>}</p> : null}
          </section>
        );
      })}
      {results.length === E.WEEKS ? (
        <section className="week">
          <h3 className="px"><Words k="seasonOver" copy={copy} /></h3>
          {[0, 1, 2].map(i => <div key={i}><p className="ask">{copy.say("final." + "abc"[i])}</p><p className="answer">{answers[E.F.final(i)] || <i>No answer yet.</i>}</p></div>)}
        </section>
      ) : null}
    </div>
  );
}

// ─── the game ───

const STATUS = { loading: "Loading", saved: "Saved", saving: "Saving", retrying: "Not saved yet, trying again", "failed-load": "Could not load your season. Reload to try again." };
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function TakeoverGame({ store, viewer, photo, photos = {}, classmates = [], classId, readOnly = false, storage, editor = false, topicsStore }) {
  const copy = useCopy(editor, E.COPY_ROW, E.DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const [topics, setTopics] = useState(null);        // the student's team topics answers, {} when none
  const [topicsFailed, setTopicsFailed] = useState(false);
  const [screen, setScreen] = useState("");          // "" until loaded, then file | title | sport | team | meet | how | week | end | done
  const [howFrom, setHowFrom] = useState("meet");     // where Back on the how card goes
  const [cursor, setCursor] = useState(0);           // the week on screen, 0 to 5
  const [phase, setPhase] = useState("");            // in a week with a result just made: match, chat, then ""
  const [handing, setHanding] = useState("");
  const [muted, setMuted] = useState(false);
  const [picked, setPicked] = useState([]);          // the options chosen so far this week, from MULTI_FROM on
  const [seenMulti, setSeenMulti] = useState(false); // the pop-up about more than one choice, shown once
  const [runThrough, setRunThrough] = useState(false); // the instructor's run-through: Next without the boxes
  const saver = useRef(null);
  const sound = useRef(null);
  const rootRef = useRef(null);
  const name = viewer?.name || "Coach";

  // The numbers stay on screen while the page scrolls. Andrew, 2026-10-29:
  // "a sticky bar at the top with the stats and stuff." The class page has
  // its own sticky bar above the sheet, so the HUD sits just under whatever
  // sticky thing comes before it.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof getComputedStyle === "undefined") return undefined;
    const measure = () => {
      let top = 0;
      for (let node = el; node && node !== document.body; node = node.parentElement) {
        let sib = node.previousElementSibling;
        while (sib) { if (getComputedStyle(sib).position === "sticky") top = Math.max(top, sib.getBoundingClientRect().height); sib = sib.previousElementSibling; }
      }
      el.style.setProperty("--tk-top", Math.round(top) + "px");
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const ready = topics !== null;

  useEffect(() => { loadFont(); }, []);
  useEffect(() => {
    sound.current = createSound();
    return () => sound.current.destroy();
  }, []);

  // The file.
  useEffect(() => {
    const draftKey = E.TAKEOVER_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
    const s = createSaver({ store, draftKey, storage: readOnly ? null : (storage ?? (typeof localStorage !== "undefined" ? localStorage : null)), onStatus: setStatus });
    saver.current = s;
    let alive = true;
    s.load().then(got => { if (alive) { setAnswers(got.answers); setSubmitted(got.submitted_at); } })
      .catch(() => { if (alive) setStatus("failed-load"); });
    if (readOnly) return () => { alive = false; s.destroy(); };
    const flush = () => s.flush();
    const hidden = () => { if (document.visibilityState === "hidden") s.flush(); };
    const leaving = (e) => { if (Object.keys(s.pending()).length) { s.flush(); e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("beforeunload", leaving);
    return () => {
      alive = false;
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("beforeunload", leaving);
      s.flush(); s.destroy();
    };
  }, [store, viewer?.id, classId, readOnly, storage]);

  // The student's concepts sheet, which sets their season. A read that fails
  // is said, not papered over with the class's concepts.
  useEffect(() => {
    if (readOnly) { setTopics({}); return undefined; }
    let alive = true;
    const t = topicsStore || (classId && viewer?.id ? supabaseStore({ supabase: gameClient, worksheetKey: TOPICS_KEY, groupKey: classId, viewerId: viewer.id }) : null);
    if (!t) { setTopics({}); return undefined; }
    t.load().then(got => { if (alive) setTopics(got.answers || {}); }).catch(() => { if (alive) setTopicsFailed(true); });
    return () => { alive = false; };
  }, [readOnly, classId, viewer?.id, topicsStore]);

  const set = (field, value, now = false) => {
    if (readOnly) return;
    setAnswers(a => ({ ...a, [field]: value }));
    saver.current.change(field, value);
    if (now) saver.current.flush();
  };

  // What the file says.
  const sport = E.sportOf(answers ? answers[E.F.sport] : "");
  const concepts = useMemo(() => parseConcepts(answers ? answers[E.F.concepts] : ""), [answers]);
  const plan = useMemo(() => sport && concepts.length ? E.planSeason({ name, concepts, topicsAnswers: topics || {} }) : null, [sport, concepts, name, topics]);
  const cast = useMemo(() => castOf(answers, name, classmates), [answers, name, classmates]);
  const bench = useMemo(() => benchOf(cast, classmates), [cast, classmates]);
  const benchName = useMemo(() => benchNameOf(cast, classmates, name), [cast, classmates, name]);
  const team = teamOf(answers, name);
  const jersey = E.jerseyFor(team);
  const season = useMemo(() => E.replay(answers || {}, name), [answers, name]);
  const bought = useMemo(() => E.boughtOf(season.results), [season.results]);

  // The first week that is not finished: no result, or no answer, or no poll.
  const firstOpen = (a) => {
    for (let i = 0; i < E.WEEKS; i++) {
      const w = E.LETTERS[i];
      if (blank(a[E.F.result(w)]) || blank(a[E.F.reflect(w)]) || (E.POLL_WEEKS.includes(w) && blank(a[E.F.poll(w)]))) return i;
    }
    return E.WEEKS;
  };

  // Where to open, once the file is read.
  useEffect(() => {
    if (!answers || screen) return;
    if (readOnly) { setScreen("done"); return; }
    if (submitted) { setScreen("done"); return; }
    if (!blank(answers[E.F.sport])) { setScreen("file"); return; }
    setScreen("title");
  }, [answers, submitted, readOnly, screen]);

  const go = (where) => { setScreen(where); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
  const toWeek = (i) => { setCursor(i); setPhase(""); setPicked([]); go("week"); };
  const continueSeason = () => {
    const open = firstOpen(answers);
    if (open >= E.WEEKS) { go("end"); return; }
    toWeek(open);
  };
  const resume = () => {
    sound.current.unlock(); sound.current.pick();
    if (blank(answers[E.F.team])) { go("team"); return; }
    if (!season.results.length) { go("meet"); return; }
    continueSeason();
  };
  const restart = async () => {
    try { await store.reset(); } catch { setStatus("retrying"); return; }
    saver.current.clear();
    setAnswers({}); setSubmitted(null); setCursor(0); setPhase(""); go("title");
  };
  const begin = () => { sound.current.unlock(); sound.current.pick(); go("sport"); };
  const chooseSport = (id) => { sound.current.pick(); set(E.F.sport, id, true); go("team"); };
  const chooseTeam = (t) => {
    sound.current.happy();
    set(E.F.team, t);
    if (!concepts.length) set(E.F.concepts, packConcepts(E.conceptsFor(topics || {})));
    if (!E.parseCast(answers[E.F.cast])) set(E.F.cast, E.packCast(E.deal(name, classmates).cast));
    saver.current.flush();
    go("meet");
  };
  const showHow = (from) => { sound.current.pick(); setHowFrom(from); go("how"); };

  const choose = (optionIds) => {
    const week = plan[cursor];
    const result = E.resolve({ name, week: week.week, state: season.state, situationId: week.situation, optionIds, bought });
    sound.current.coin();
    set(E.F.choice(week.week), result.options.join(","));
    set(E.F.result(week.week), E.packResult(result));
    if (blank(answers[E.F.prompt(week.week)])) set(E.F.prompt(week.week), packPrompt(week.prompt));
    saver.current.flush();
    setPicked([]);
    setPhase("match");
  };
  const togglePick = (id) => { sound.current.blip(); setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); };
  const matchDone = () => setPhase(reduced() ? "" : "chat");
  const chatDone = (result) => {
    const feel = E.feelOf(result);
    if (feel === "cheer") sound.current.cheer(); else if (feel === "groan") sound.current.sad();
    setPhase("");
  };
  const nextWeek = () => {
    sound.current.pick();
    if (cursor + 1 >= E.WEEKS) { go("end"); return; }
    toWeek(cursor + 1);
  };
  const backWeek = () => { sound.current.blip(); if (cursor === 0) go("meet"); else toWeek(cursor - 1); };
  const handIn = async () => {
    const left = runThrough ? [] : missingOf(answers);
    if (left.length) { setHanding("missing"); return; }
    setHanding("sending");
    try {
      await saver.current.flush();
      if (Object.keys(saver.current.pending()).length) { setHanding("unsaved"); return; }
      const at = await store.submit();
      setSubmitted(at || new Date().toISOString());
      setHanding("");
      sound.current.confirm();
      go("done");
    } catch { setHanding("failed"); }
  };
  const takeBack = async () => {
    try { await store.recall(); setSubmitted(null); setHanding(""); go("end"); } catch { setHanding("failed"); }
  };
  const toggleMute = () => { const m = sound.current.mute(); setMuted(m); };

  // ─── screens ───

  let body = null;
  if (!answers || !screen) {
    body = <p className="say">{status === "failed-load" ? STATUS["failed-load"] : STATUS.loading}</p>;
  } else if (screen === "done") {
    body = (
      <div className="screen">
        {!readOnly ? (
          <div className="row">
            <p className="say"><b>{copy.say("submitted")}</b>{submitted ? " " + when(submitted) : ""}</p>
            {submitted ? <button type="button" className="btn px" onClick={takeBack}>{copy.say("recall")}</button> : null}
          </div>
        ) : null}
        <SeasonLog answers={answers} name={name} classmates={classmates} copy={copy} />
      </div>
    );
  } else if (screen === "file") {
    body = (
      <div className="screen center">
        <p className="say"><Words k="onFile" copy={copy} /></p>
        {topicsFailed ? <p className="say bad">Your concepts sheet could not be read. Reload the page and try again.</p> : null}
        <div className="row">
          <button type="button" className="btn px primary" onClick={resume} disabled={!ready}>{ready ? copy.say("resume") : "Loading"}</button>
          <button type="button" className="btn px" onClick={restart}>{copy.say("restart")}</button>
        </div>
      </div>
    );
  } else if (screen === "title") {
    body = (
      <div className="screen center title">
        <h1 className="px"><Words k="title" copy={copy} /></h1>
        <div className="coach"><Sprite name={name} photo={photo} scale={6} jersey={jersey} /><span className="px">Coach {name}</span></div>
        <p className="say big"><Words k="start" copy={copy} /></p>
        <p className="say"><Words k="intro" copy={copy} /></p>
        {topicsFailed ? <p className="say bad">Your concepts sheet could not be read. Reload the page and try again.</p>
          : <button type="button" className="btn px primary blink" onClick={begin} disabled={!ready}>{ready ? "Press start" : "Loading"}</button>}
      </div>
    );
  } else if (screen === "sport") {
    body = (
      <div className="screen center">
        <Nav copy={copy} onBack={() => go("title")} />
        <h2 className="px"><Words k="pickSport" copy={copy} /></h2>
        <div className="sports">
          {E.SPORTS.map(s => (
            <button key={s.id} type="button" className="sport" onClick={() => chooseSport(s.id)} onMouseEnter={() => sound.current.blip()}>
              <Field sport={s.id} />
              <span className="px">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (screen === "team") {
    body = (
      <div className="screen center">
        <Nav copy={copy} onBack={() => go("sport")} />
        <h2 className="px"><Words k="pickTeam" copy={copy} /></h2>
        <p className="say"><Words k="pickTeamLine" copy={copy} /></p>
        <div className="teams">
          {E.teamChoicesFor(name).map(t => (
            <button key={t} type="button" className="teambtn" onClick={() => chooseTeam(t)} onMouseEnter={() => sound.current.blip()}>
              <Sprite name={name} photo={photo} scale={3} jersey={E.jerseyFor(t)} />
              <span className="px">{t}</span>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (screen === "meet" && sport) {
    body = (
      <div className="screen center">
        <Nav copy={copy} onBack={() => go("team")} />
        <h2 className="px">{team}</h2>
        <p className="say"><Words k="meet" copy={copy} /> <Words k="meetLine" copy={copy} /></p>
        <Field sport={sport.id} sign={E.signFor(name, "meet", team)} />
        <Squad cast={cast} bench={bench} photos={photos} scale={5} jersey={jersey} cheer="cheer" />
        <div className="cards">
          {E.CHARACTERS.map(c => <div key={c.id} className="card"><b className="px">{c.label}</b><span>{cast[c.id]}. {c.blurb}</span></div>)}
        </div>
        <button type="button" className="btn px primary" onClick={() => showHow("meet")}>{copy.say("howTitle")}</button>
      </div>
    );
  } else if (screen === "how" && sport) {
    body = (
      <div className="screen">
        <Nav copy={copy} onBack={() => { if (howFrom === "week") toWeek(cursor); else go(howFrom); }} />
        <Hud copy={copy} state={season.state} />
        <h2 className="px"><Words k="howTitle" copy={copy} /></h2>
        <div className="how"><Words k="how" copy={copy} as="p" className="say pre" /></div>
        <div className="legend">
          {Object.entries(E.TAGS).map(([id, t]) => <div key={id} className="card"><b className="px">{t.label}</b><span>{t.line}</span></div>)}
        </div>
        {howFrom !== "week" ? <button type="button" className="btn px primary" onClick={() => { sound.current.pick(); continueSeason(); }}>{copy.say("howGo")}</button> : null}
      </div>
    );
  } else if (screen === "week" && plan && sport) {
    const week = plan[cursor];
    const result = season.results[cursor] || null;
    const stateBefore = cursor === 0 ? E.startState(name) : E.after(season.results[cursor - 1]);
    const stateNow = result ? E.after(result) : stateBefore;
    const { lines, opp, ctx } = weekLines({ plan: week, result, cast, sport, team, name, bench: benchName });
    const sit = E.situationOf(week.situation);
    const prompt = parsePrompt(answers[E.F.prompt(week.week)]) || week.prompt;
    const canNext = runThrough || (!blank(answers[E.F.reflect(week.week)]) && (!week.poll || !blank(answers[E.F.poll(week.week)])));
    const priceOf = (o) => E.costOf(o, week.week);
    const pickedCost = picked.reduce((t, id) => { const o = E.anyOptionOf(sit, id); return t + (o ? priceOf(o) : 0); }, 0);
    const pickedWeek = picked.some(id => E.optionOf(sit, id));
    const boughtBefore = E.boughtOf(season.results.slice(0, cursor));
    const extras = week.multi ? E.EXTRAS.filter(o => !boughtBefore.includes(o.id)) : [];
    const optionButton = (o) => {
      const on = picked.includes(o.id);
      const price = priceOf(o);
      const can = week.multi ? (on || price + pickedCost <= stateBefore.capital) : price <= stateBefore.capital;
      return (
        <button key={o.id} type="button" className="spendbtn" aria-pressed={week.multi ? on : undefined} disabled={!can || !ready} onClick={() => week.multi ? togglePick(o.id) : choose([o.id])} onMouseEnter={() => sound.current.blip()}>
          <span className="px top"><span>{E.tell(o.label, ctx)}</span><span className="coins">{price ? E.coins(price) : "free"}</span></span>
          <span className="line">{E.tell(o.line, ctx)}</span>
          <span className="px tag">{E.TAGS[o.tag].label}</span>
          {!can ? <span className="px no">{copy.say("cannot")}</span> : null}
        </button>
      );
    };
    const popup = week.multi && week.n === E.MULTI_FROM && !result && !seenMulti;
    const settled = result && phase === "";
    const feel = settled ? E.feelOf(result) : "";
    const deltas = settled ? { culture: result.dCulture, skills: result.dSkills, success: result.dSuccess, back: result.back } : null;
    body = (
      <div className="screen">
        <Nav copy={copy} onBack={backWeek}><button type="button" className="btn px small" onClick={() => showHow("week")}>{copy.say("howTitle")}</button></Nav>
        <Hud copy={copy} state={settled ? stateNow : stateBefore} deltas={deltas} />
        <h2 className="px">{"Week " + week.n} <span className="dim">{"· " + week.label}</span></h2>
        {popup ? (
          <div className="popup" role="dialog" aria-label={copy.say("multiTitle")}>
            <div className="popin">
              <b className="px"><Words k="multiTitle" copy={copy} /></b>
              <p className="say"><Words k="multi" copy={copy} /></p>
              <button type="button" className="btn px primary" onClick={() => { sound.current.pick(); setSeenMulti(true); }}>OK</button>
            </div>
          </div>
        ) : null}
        {phase === "match"
          ? <MatchScene key={week.week} sport={sport.id} left={{ name: cast[week.who || "star"], photo: photos[cast[week.who || "star"]] }} right={{ name: opp, photo: "" }} jersey={jersey} sound={sound.current} onDone={matchDone} label={copy.say("matchDay") + " " + opp.toUpperCase()} />
          : <Field sport={sport.id} sign={E.signFor(name, week.week, team)} />}
        <Squad cast={cast} bench={[]} photos={photos} moods={settled ? result.moods : null} lit={week.who} scale={4} jersey={jersey} cheer={feel} />
        {sit.id === "press" ? <div className="reporter"><Fixed grid={REPORTER} scale={4} /><span className="px small"><Words k="pressName" copy={copy} /></span></div> : null}
        {!result ? (
          <>
            <p className="event">{lines[0].text}</p>
            <h3 className="px"><Words k="chooseAsk" copy={copy} /></h3>
            {week.multi ? <p className="say dim"><Words k="multi" copy={copy} /></p> : null}
            <div className="spends">{sit.options.map(optionButton)}</div>
            {extras.length ? (
              <>
                <h3 className="px"><Words k="also" copy={copy} /></h3>
                <div className="spends extras">{extras.map(optionButton)}</div>
              </>
            ) : null}
            {week.multi ? (
              <div className="row end">
                <span className="px"><Words k="total" copy={copy} /> <span className="coins">{E.coins(pickedCost)}</span> {pickedCost} / {stateBefore.capital}</span>
                <button type="button" className="btn px primary" disabled={!pickedWeek || !ready} onClick={() => choose(picked)}>{copy.say("doIt")}</button>
              </div>
            ) : null}
            <p className="say dim"><Words k="chooseNote" copy={copy} /></p>
          </>
        ) : phase === "match" ? (
          <p className="event">{lines[0].text}</p>
        ) : (
          <>
            {week.last
              ? <FinalWhistle key={week.week} result={result} lines={lines} animate={phase === "chat"} sound={sound.current} onDone={() => chatDone(result)} season={season} cast={cast} copy={copy} />
              : <Chat key={week.week} lines={lines} animate={phase === "chat"} sound={sound.current} onDone={() => chatDone(result)} copy={copy} />}
            {settled ? (
              <div className="reflect">
                <p className="ask">{askOf(copy, prompt)}</p>
                <textarea className="ta" rows={5} value={answers[E.F.reflect(week.week)] || ""} placeholder={copy.say("reflectHint")} onChange={e => set(E.F.reflect(week.week), e.target.value)} aria-label={"Week " + week.n + " answer"} />
                <label className="src"><span className="px small"><Words k="sourceAsk" copy={copy} /></span>
                  <textarea className="ta short" rows={2} value={answers[E.F.source(week.week)] || ""} placeholder={copy.say("sourceHint")} onChange={e => set(E.F.source(week.week), e.target.value)} />
                </label>
                {week.poll ? (
                  <div className="poll">
                    <span className="px small"><Words k="pollAsk" copy={copy} /></span>
                    <div className="row">
                      {week.poll.map(o => <button key={o} type="button" className="btn px" aria-pressed={answers[E.F.poll(week.week)] === o} onClick={() => { sound.current.pick(); set(E.F.poll(week.week), o, true); }}>{o}</button>)}
                    </div>
                  </div>
                ) : null}
                <div className="row end">
                  <span className="status px">{STATUS[status] || ""}</span>
                  <button type="button" className="btn px primary" disabled={!canNext} onClick={nextWeek}>{week.last ? copy.say("seasonOver") : copy.say("next")}</button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  } else if (screen === "end" && sport) {
    const left = runThrough ? [] : missingOf(answers);
    const last = season.results[season.results.length - 1] || null;
    body = (
      <div className="screen">
        <Nav copy={copy} onBack={() => toWeek(Math.max(0, season.results.length - 1))}><button type="button" className="btn px small" onClick={() => showHow("end")}>{copy.say("howTitle")}</button></Nav>
        <Hud copy={copy} state={season.state} />
        <h2 className="px"><Words k="seasonOver" copy={copy} /> <span className="dim">{team + " · " + season.state.wins + "-" + season.state.losses + " · " + E.gradeOf(season.state.success)}</span></h2>
        <Field sport={sport.id} sign={E.signFor(name, "end", team)} />
        <Squad cast={cast} bench={bench} photos={photos} moods={last ? last.moods : null} scale={4} jersey={jersey} cheer={season.state.success >= 65 ? "cheer" : ""} />
        <div className="reflect">
          {[0, 1, 2].map(i => (
            <div key={i}>
              <p className="ask"><Words k={"final." + "abc"[i]} copy={copy} /></p>
              <textarea className="ta" rows={4} value={answers[E.F.final(i)] || ""} onChange={e => set(E.F.final(i), e.target.value)} aria-label={"Final question " + (i + 1)} />
            </div>
          ))}
          <div className="row end">
            <span className={"status px" + (handing ? " bad" : "")}>
              {handing === "missing" ? "Still missing: " + left.join(", ") + "." : handing === "sending" ? "Handing in" : handing === "unsaved" ? "Some answers are not saved yet. Wait a moment and try again." : handing === "failed" ? "Could not hand in. Try again." : STATUS[status] || ""}
            </span>
            <button type="button" className="btn px primary" onClick={handIn} disabled={handing === "sending"}>{copy.say("submit")}</button>
          </div>
        </div>
        <details className="log-wrap"><summary className="px small">The season so far</summary><SeasonLog answers={answers} name={name} classmates={classmates} copy={copy} /></details>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={"tk" + (readOnly ? " ro" : "")}>
      <style>{CSS}</style>
      <div className="cab">
        <div className="top">
          <span className="px credit"><Words k="credit" copy={copy} /></span>
          <span className="row">
            {editor ? <button type="button" className="btn px small" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing" : "Edit the words"}</button> : null}
            {editor ? <button type="button" className="btn px small" aria-pressed={runThrough} onClick={() => setRunThrough(r => !r)}>{copy.say("runThrough")}</button> : null}
            {editor && copy.status ? <span className="status px">{copy.status}</span> : null}
            {!readOnly ? <button type="button" className="btn px small" aria-pressed={muted} onClick={toggleMute}>{muted ? "Sound off" : "Sound on"}</button> : null}
          </span>
        </div>
        {editing ? <EditWords copy={copy} /> : body}
      </div>
    </div>
  );
}

// Every word the student reads, in one place for the instructor to change.
function EditWords({ copy }) {
  return (
    <div className="screen words">
      {Object.keys(E.DEFAULT_COPY).map(k => (
        <label key={k} className="word"><span className="px small">{k}</span><Words k={k} copy={copy} editing as="span" /></label>
      ))}
    </div>
  );
}

/** Mount the game. Returns { destroy }. */
export function mountTakeover(root, { store, viewer, photo, photos, classmates, readOnly = false, classId, editor = false, topicsStore } = {}) {
  const r = createRoot(root);
  r.render(<TakeoverGame store={store} viewer={viewer} photo={photo} photos={photos || {}} classmates={classmates || []} readOnly={readOnly} classId={classId} editor={editor && !readOnly} topicsStore={topicsStore} />);
  return { destroy() { r.unmount(); } };
}

export const CSS = `
.tk{--ink:#0f0f1a;--panel:#141428;--deep:#0a0a16;--line:#e0e0e0;--text:#e8e8f0;--dim:#a0a0b8;--gold:#f8e020;--sky:#58b8f8;--green:#38b838;--red:#d03030;--blue:#2060d0;--mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;--pixel:'Press Start 2P',monospace}
.tk{box-sizing:border-box;background:var(--ink);color:var(--text);font-family:var(--mono);font-size:16px;line-height:1.5;padding:24px 16px 64px;min-height:100vh}
.tk *{box-sizing:border-box}
.tk .px{font-family:var(--pixel);font-size:11px;line-height:1.9;letter-spacing:0}
.tk .px.small{font-size:9px}
.tk .cab{max-width:820px;margin:0 auto;background:var(--panel);border:4px solid var(--line);box-shadow:0 0 0 4px var(--ink),0 0 0 8px var(--sky);padding:20px}
.tk .top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:16px;border-bottom:4px dotted #2a2a48;margin-bottom:16px}
.tk .credit{color:var(--dim)}
.tk .screen{display:grid;gap:18px}
.tk .screen.center{justify-items:center;text-align:center}
.tk .nav{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%}
.tk h1.px{font-size:26px;margin:12px 0 0;color:var(--gold);text-shadow:4px 4px 0 var(--blue)}
.tk h2.px{font-size:14px;margin:0;color:var(--gold)}
.tk h3.px{font-size:11px;margin:0;color:var(--sky)}
.tk .dim{color:var(--dim)}
.tk .say{margin:0;max-width:62ch}
.tk .say.big{font-size:19px;font-weight:600}
.tk .say.pre{white-space:pre-line;max-width:none}
.tk .say.bad,.tk .status.bad{color:#fbbf24}
.tk .how{background:var(--deep);border:3px solid var(--gold);padding:16px 18px;font-size:16px}
.tk .legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.tk .coach{display:grid;justify-items:center;gap:8px}
.tk canvas{image-rendering:pixelated;image-rendering:crisp-edges}
.tk .ground{position:relative;width:100%;max-width:640px;margin:0 auto}
.tk .field{display:block;width:100%;height:auto;border:4px solid var(--line)}
.tk .sign{position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#fff;color:var(--ink);font-size:8px;padding:4px 8px;border:3px solid var(--ink);white-space:nowrap;max-width:92%;overflow:hidden;text-overflow:ellipsis}
.tk .btn{font-family:var(--pixel);font-size:11px;line-height:1.6;color:var(--text);background:#1c1c3a;border:3px solid var(--line);padding:12px 16px;cursor:pointer;box-shadow:4px 4px 0 var(--ink)}
.tk .btn:hover{background:var(--blue)}
.tk .btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)}
.tk .btn.primary{background:var(--green);color:var(--ink);border-color:#fff}
.tk .btn.primary:hover{background:#4ad04a}
.tk .btn.small{padding:6px 10px;font-size:9px;box-shadow:2px 2px 0 var(--ink)}
.tk .btn[disabled]{opacity:.4;cursor:default;transform:none}
.tk .btn[aria-pressed="true"]{background:var(--gold);color:var(--ink);border-color:#fff}
.tk .blink{animation:tk-pulse 1s steps(2,start) infinite}
@keyframes tk-pulse{to{filter:brightness(1.35)}}
@keyframes tk-blink{to{visibility:hidden}}
@keyframes tk-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes tk-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes tk-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.2);opacity:1}100%{transform:scale(1)}}
.tk .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.tk .row.end{justify-content:space-between}
.tk .sports{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:100%}
.tk .sport{display:grid;gap:10px;justify-items:center;background:var(--deep);border:3px solid var(--line);padding:12px;cursor:pointer;color:var(--text)}
.tk .sport:hover{border-color:var(--gold);background:#1c1c3a}
.tk .sport .ground{max-width:100%}
.tk .teams{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;width:100%}
.tk .teambtn{display:flex;gap:12px;align-items:center;background:var(--deep);border:3px solid var(--line);padding:10px 12px;cursor:pointer;color:var(--text);text-align:left;box-shadow:4px 4px 0 var(--ink)}
.tk .teambtn:hover{border-color:var(--gold);background:#1c1c3a}
.tk .teambtn .px{font-size:9px;line-height:1.6}
.tk .squad{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;width:100%}
.tk .player{position:relative;display:grid;justify-items:center;gap:4px;width:104px;padding:14px 2px 6px;border:3px solid transparent}
.tk .player.lit{border-color:var(--gold);background:#1c1c3a}
.tk .player .name{font-size:12px;line-height:1.25;text-align:center;overflow-wrap:anywhere}
.tk .player .role{color:var(--sky);font-size:8px;text-align:center}
.tk .player.up canvas{animation:tk-bounce .45s steps(2) 8}
.tk .player.down canvas{animation:tk-shake .25s steps(2) 12}
.tk .player.down::before{content:"\\ | /";position:absolute;top:0;left:50%;transform:translateX(-50%);font-family:var(--pixel);font-size:9px;color:var(--red);animation:tk-blink .4s steps(2,start) 10}
.tk .squad.cheer .player canvas{animation:tk-bounce .4s steps(2) 10}
.tk .squad.cheer .player:nth-child(2n) canvas{animation-delay:.2s}
.tk .squad.groan .player canvas{animation:tk-shake .3s steps(2) 8}
.tk .mood{font-size:12px}
.tk .mood.up{color:var(--green)}.tk .mood.flat{color:var(--dim)}.tk .mood.down{color:var(--red)}
.tk .bench{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;width:100%;padding-top:8px;border-top:3px dotted #2a2a48}
.tk .bench .player{width:72px;padding:2px}
.tk .bench .player .name{font-size:10px}
.tk .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;width:100%;text-align:left}
.tk .card{display:grid;gap:6px;background:var(--deep);border:3px solid #2a2a48;padding:10px 12px;font-size:14px}
.tk .card b{color:var(--sky);font-size:9px}
.tk .hud{position:sticky;top:var(--tk-top,0px);z-index:20;display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;align-items:center;background:var(--deep);border:3px solid var(--line);padding:8px 14px;color:var(--dim);box-shadow:0 6px 0 var(--ink)}
.tk .hud .cap,.tk .hud .rec{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tk .hud .n{color:var(--text)}
.tk .hud .ml{white-space:nowrap}
.tk .meter{display:flex;align-items:center;gap:8px;min-width:0}
.tk .coins{color:var(--gold);letter-spacing:2px}
.tk .bar{display:inline-block;flex:1;height:12px;border:2px solid var(--line);background:var(--ink);min-width:60px}
.tk .bar i{display:block;height:100%;background:var(--green);transition:width .9s steps(12)}
.tk .delta{font-size:9px;padding:2px 5px;border:2px solid currentColor;animation:tk-pop .5s steps(3) 1}
.tk .delta.up{color:var(--green)}.tk .delta.down{color:#ff6a6a}
.tk .event{margin:0;font-size:17px;background:var(--deep);border-left:6px solid var(--gold);padding:12px 14px}
.tk .spends{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.tk .spendbtn{display:grid;gap:8px;text-align:left;background:var(--deep);border:3px solid var(--line);color:var(--text);padding:12px;cursor:pointer;font-family:var(--mono);box-shadow:4px 4px 0 var(--ink);align-content:start}
.tk .spendbtn:hover{border-color:var(--gold);background:#1c1c3a}
.tk .spendbtn[disabled]{opacity:.45;cursor:default}
.tk .spendbtn[aria-pressed="true"]{border-color:var(--gold);background:#2a2a10;box-shadow:4px 4px 0 var(--gold)}
.tk .reporter{display:flex;align-items:center;gap:12px;justify-content:center;color:var(--sky)}
.tk .popup{position:fixed;inset:0;background:rgba(10,10,22,.8);display:grid;place-items:center;z-index:50;padding:16px}
.tk .popin{display:grid;gap:14px;justify-items:center;text-align:center;background:var(--panel);border:4px solid var(--gold);box-shadow:0 0 0 4px var(--ink),0 0 0 8px var(--sky);padding:24px;max-width:520px}
.tk .popin b{color:var(--gold);font-size:12px}
.tk .spendbtn .top{display:flex;justify-content:space-between;gap:8px;color:var(--gold);align-items:flex-start}
.tk .spendbtn .top .coins{white-space:nowrap}
.tk .spendbtn .line{font-size:14px;color:var(--text)}
.tk .spendbtn .tag{font-size:8px;color:var(--sky)}
.tk .spendbtn .no{color:var(--red);font-size:8px}
.tk .chat,.tk .wrap{display:grid;gap:8px;background:var(--deep);border:3px solid var(--green);padding:12px 14px;min-height:120px}
.tk .wrap .line{font-size:15px}
.tk .standings{margin:0;padding-left:18px;font-size:15px;display:grid;gap:4px}
.tk .standings b{color:var(--gold)}
.tk .spends.extras .spendbtn{border-style:dashed}
.tk .chead{color:var(--green)}
.tk .msg{display:flex;gap:10px;align-items:baseline;font-size:15px}
.tk .msg b{color:var(--gold);white-space:nowrap}
.tk .msg.sys{color:var(--dim);font-style:italic}
.tk .msg.won{color:var(--green);font-style:normal;font-weight:600}
.tk .msg.lost{color:#ff6a6a;font-style:normal;font-weight:600}
.tk .msg.meter{color:var(--sky);font-style:normal}
.tk .reflect{display:grid;gap:12px;background:var(--deep);border:3px solid var(--sky);padding:14px}
.tk .ask{margin:0;font-size:16px;line-height:1.5}
.tk .ta{width:100%;font-family:var(--mono);font-size:16px;color:var(--text);background:var(--ink);border:3px solid var(--line);padding:10px 12px;outline:none;resize:vertical;min-height:120px}
.tk .ta.short{min-height:64px}
.tk .ta:focus{border-color:var(--gold)}
.tk .src{display:grid;gap:6px}
.tk .poll{display:grid;gap:8px}
.tk .status{color:var(--dim);font-size:9px}
.tk .log{display:grid;gap:16px}
.tk .head2{color:var(--gold);font-size:10px}
.tk .week{display:grid;gap:6px;background:var(--deep);border:3px solid #2a2a48;padding:12px 14px}
.tk .week h3{margin:0 0 4px}
.tk .line{margin:0;font-size:14px}
.tk .line.sys{color:var(--dim);font-style:italic}
.tk .line b{color:var(--gold)}
.tk .week .ask{color:var(--sky);font-size:14px;padding-top:6px}
.tk .answer{margin:0;white-space:pre-wrap;font-size:15px}
.tk .source{margin:0;font-size:13px;color:var(--dim);white-space:pre-wrap}
.tk .log-wrap summary{cursor:pointer;color:var(--sky)}
.tk .words{gap:10px}
.tk .word{display:grid;gap:4px}
.tk .vsp-edit{display:block;width:100%;font:inherit;color:var(--text);background:var(--ink);border:2px dashed var(--line);padding:6px 8px;resize:none;overflow:hidden;line-height:1.45}
.tk.ro .top .btn{display:none}
@media (max-width:640px){.tk{padding:12px 8px 48px}.tk .cab{padding:12px}.tk .sports{grid-template-columns:1fr}.tk h1.px{font-size:18px}.tk .player{width:84px}.tk .hud{grid-template-columns:1fr}}
@media (prefers-reduced-motion: reduce){.tk *{transition:none!important;animation:none!important}}
`;
