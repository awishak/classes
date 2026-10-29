// Takeover, on the screen: /comm118/worksheets/takeover.
//
// A student takes over a team of their classmates and spends six weeks on
// its culture. engine.js decides everything; this file draws it and saves
// it. Every answer is a worksheet row (worktopia/store.js) through saver.js,
// so nothing typed is lost. A week's result is saved packed in its own row
// the moment the spend is chosen, so a reload replays the week the student
// saw even if the engine's words change later. The cast is saved too, so a
// roster change later never reshuffles a season already on file.
//
// Fields: sport, team, concepts, cast, then per week a to f: prompt, spend,
// result, reflect, source; poll on b, d and f; final a to c. engine.js F.
//
// Andrew, 2026-10-29: "eight bit graphics, almost like Zelda ... kind of
// fun noises ... when somebody's upset, they should have little lines coming
// out of their head ... when somebody's happy, they should cheer ... music
// cues that are happy, and when something difficult is happening, little
// difficult music cues ... little uniforms." Pixel font for the chrome, a
// mono for anything longer than a line. One look, dark, whatever the page's
// theme.

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "../visualstory/saver.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { supabaseStore } from "../worktopia/store.js";
import { gameClient } from "../gameClient.js";
import * as E from "./engine.js";
import { spriteFromName, spriteFromPhoto, renderSprite, drawField, drawMatch, uniform, MOOD_GLYPH } from "./pixel.js";
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
const askOf = (copy, prompt) => (prompt.kind === "thought" ? copy.say("reflectThought") : copy.say("reflect")).replace("{wonder}", String(prompt.text || "").trim().replace(/[.!?]+$/, ""));

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

// ─── pixels ───

const grids = new Map();
/** A sprite's grid: the photograph when it can be read, else the name, in the team's jersey. */
const gridFor = (name, photo, jersey) => {
  const fromPhoto = photo ? grids.get(photo) : null;
  return fromPhoto ? uniform(fromPhoto, jersey, 12) : uniform(spriteFromName(name), jersey, 8);
};
const fetchGrid = (photo) => {
  if (!photo || grids.has(photo)) return Promise.resolve(grids.get(photo) || null);
  return spriteFromPhoto(photo).then(g => { if (g) grids.set(photo, g); return g; });
};

function Sprite({ name, photo, scale = 4, jersey = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    let alive = true;
    const el = ref.current;
    if (!el) return undefined;
    renderSprite(el, gridFor(name, photo, jersey), scale);
    if (photo && !grids.has(photo)) fetchGrid(photo).then(g => { if (alive && g) renderSprite(el, gridFor(name, photo, jersey), scale); });
    return () => { alive = false; };
  }, [name, photo, scale, jersey]);
  return <canvas ref={ref} width={16 * scale} height={16 * scale} aria-hidden="true" />;
}

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
    const grids2 = [gridFor(left.name, left.photo, jersey), gridFor(right.name, right.photo, (jersey + 3) % 7)];
    const ms = reduced() ? 300 : 2800;
    const t0 = performance.now();
    sound.whistle();
    const frame = (now) => {
      if (!alive) return;
      const t = Math.min(1, (now - t0) / ms);
      const crossing = drawMatch(el, { sport, left: grids2[0], right: grids2[1], t });
      if (crossing !== lastCrossing) { lastCrossing = crossing; if (t > 0) sound.bounce(); }
      if (t < 1) requestAnimationFrame(frame); else onDone();
    };
    requestAnimationFrame(frame);
    return () => { alive = false; };
  // One scene a week; the names of the two players never change mid-scene.
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

function Hud({ copy, state }) {
  return (
    <div className="hud px">
      <span><Words k="capital" copy={copy} /> <b className="coins">{"●".repeat(Math.max(0, Math.min(12, state.capital)))}</b> <span className="n">{state.capital}</span></span>
      <span className="cul"><Words k="culture" copy={copy} /> <span className="bar"><i style={{ width: state.culture + "%" }} /></span> <span className="n">{state.culture}</span></span>
      <span><Words k="record" copy={copy} /> <span className="n">{state.wins}-{state.losses}</span></span>
    </div>
  );
}

// ─── the chat, one week ───

export function weekLines({ plan, result, cast, sport, team, name }) {
  const event = E.eventOf(result ? result.event : plan.event);
  const opp = E.opponentFor(name, plan.week, team);
  const lines = [{ who: "", text: E.tellEvent(event, { cast, sport, team, opp }) }];
  if (!result) return { lines, opp };
  const spend = E.spendOf(result.spend);
  lines.push({ who: "coach", text: spend.label + ". " + spend.line });
  E.CHARACTERS.forEach(c => lines.push({ who: cast[c.id], text: E.LINES[c.id][result.spend][result.moods[c.id]], mood: result.moods[c.id] }));
  lines.push({ who: "", text: (result.won ? "Won " : "Lost ") + E.scoreOf(sport, result.won, name, plan.week) + " to the " + opp + ".", match: result.won ? "won" : "lost" });
  lines.push({ who: "", text: "Culture " + (result.culture - result.delta) + " to " + result.culture + ". Capital " + result.capital + ".", meter: true });
  return { lines, opp };
}

// How a week felt, for the cue after the chat: a cheer, a groan, or nothing.
export const feelOf = (result) => !result ? "" : result.delta >= 8 ? "cheer" : result.delta <= -6 ? "groan" : "";

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

// ─── the season, read back ───

/** Every week on file, read only: the done screen, and the instructor's read. */
export function SeasonLog({ answers, name, classmates, copy }) {
  const sport = E.sportOf(answers[E.F.sport]);
  const concepts = parseConcepts(answers[E.F.concepts]);
  if (!sport || !concepts.length) return <p className="say">Nothing on file yet.</p>;
  const plan = E.planSeason({ name, concepts, topicsAnswers: {} });
  const cast = castOf(answers, name, classmates);
  const team = teamOf(answers, name);
  const { results, state } = E.replay(answers);
  return (
    <div className="log">
      <div className="px head2">{team} · {sport.name} · {state.wins}-{state.losses} · culture {state.culture} ({E.gradeOf(state.culture)})</div>
      {results.map((r, i) => {
        const week = plan[i];
        const prompt = parsePrompt(answers[E.F.prompt(week.week)]) || week.prompt;
        const { lines } = weekLines({ plan: week, result: r, cast, sport, team, name });
        return (
          <section key={week.week} className="week">
            <h3 className="px">{"Week " + week.n + " · " + E.conceptOf(week.concept).name}</h3>
            {lines.map((l, j) => <p key={j} className={"line" + (l.who ? "" : " sys")}>{l.who ? <b>{l.who === "coach" ? "You" : l.who}: </b> : null}{l.text}</p>)}
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
  const [screen, setScreen] = useState("");          // "" until loaded, then file | title | sport | team | meet | week | end | done
  const [cursor, setCursor] = useState(0);           // the week on screen, 0 to 5
  const [phase, setPhase] = useState("");            // in a week with a result just made: match, chat, then ""
  const [handing, setHanding] = useState("");
  const [muted, setMuted] = useState(false);
  const saver = useRef(null);
  const sound = useRef(null);
  const name = viewer?.name || "Coach";
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
  const bench = useMemo(() => { const in5 = new Set(Object.values(cast)); return classmates.filter(n => !in5.has(n)); }, [cast, classmates]);
  const team = teamOf(answers, name);
  const jersey = E.jerseyFor(team);
  const season = useMemo(() => E.replay(answers || {}), [answers]);

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
  const resume = () => {
    sound.current.unlock(); sound.current.pick();
    if (blank(answers[E.F.team])) { go("team"); return; }
    const open = firstOpen(answers);
    if (open >= E.WEEKS) { go("end"); return; }
    setCursor(open); setPhase(""); go("week");
  };
  const restart = async () => {
    try { await store.reset(); } catch { setStatus("retrying"); return; }
    saver.current.clear();
    setAnswers({}); setSubmitted(null); setCursor(0); setPhase(""); go("title");
  };
  const begin = () => { sound.current.unlock(); sound.current.pick(); go("sport"); };
  const chooseSport = (id) => {
    sound.current.pick();
    set(E.F.sport, id, true);
    go("team");
  };
  const chooseTeam = (t) => {
    sound.current.happy();
    set(E.F.team, t);
    if (!concepts.length) set(E.F.concepts, packConcepts(E.conceptsFor(topics || {})));
    if (!E.parseCast(answers[E.F.cast])) set(E.F.cast, E.packCast(E.deal(name, classmates).cast));
    saver.current.flush();
    go("meet");
  };
  const startSeason = () => { sound.current.pick(); setCursor(0); setPhase(""); go("week"); };

  const spend = (spendId) => {
    const week = plan[cursor];
    const result = E.resolve({ name, week: week.week, state: season.state, spendId, eventId: week.event });
    sound.current.coin();
    set(E.F.spend(week.week), spendId);
    set(E.F.result(week.week), E.packResult(result));
    if (blank(answers[E.F.prompt(week.week)])) set(E.F.prompt(week.week), packPrompt(week.prompt));
    saver.current.flush();
    setPhase("match");
  };
  const matchDone = () => setPhase(reduced() ? "" : "chat");
  const chatDone = (result) => {
    const feel = feelOf(result);
    if (feel === "cheer") sound.current.cheer(); else if (feel === "groan") sound.current.sad();
    setPhase("");
  };
  const nextWeek = () => {
    sound.current.pick();
    if (cursor + 1 >= E.WEEKS) { go("end"); return; }
    setCursor(cursor + 1); setPhase(""); go("week");
  };
  const handIn = async () => {
    const left = missingOf(answers);
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
        <h2 className="px">{team}</h2>
        <p className="say"><Words k="meet" copy={copy} /> <Words k="meetLine" copy={copy} /></p>
        <Field sport={sport.id} sign={E.signFor(name, "meet", team)} />
        <Squad cast={cast} bench={bench} photos={photos} scale={5} jersey={jersey} cheer="cheer" />
        <div className="cards">
          {E.CHARACTERS.map(c => <div key={c.id} className="card"><b className="px">{c.label}</b><span>{cast[c.id]}. {c.blurb}</span></div>)}
        </div>
        <button type="button" className="btn px primary" onClick={startSeason}>Start the season</button>
      </div>
    );
  } else if (screen === "week" && plan && sport) {
    const week = plan[cursor];
    const result = season.results[cursor] || null;
    const stateBefore = cursor === 0 ? E.start() : E.after(season.results[cursor - 1]);
    const stateNow = result ? E.after(result) : stateBefore;
    const { lines, opp } = weekLines({ plan: week, result, cast, sport, team, name });
    const prompt = parsePrompt(answers[E.F.prompt(week.week)]) || week.prompt;
    const ask = askOf(copy, prompt);
    const canNext = !blank(answers[E.F.reflect(week.week)]) && (!week.poll || !blank(answers[E.F.poll(week.week)]));
    const settled = result && phase === "";
    const feel = settled ? feelOf(result) : "";
    body = (
      <div className="screen">
        <Hud copy={copy} state={phase === "match" ? stateBefore : stateNow} />
        <h2 className="px">{(week.last ? copy.say("finals") + " " : "") + "Week " + week.n} <span className="dim">{"· " + E.conceptOf(week.concept).name}</span></h2>
        {phase === "match"
          ? <MatchScene key={week.week} sport={sport.id} left={{ name: cast[week.who], photo: photos[cast[week.who]] }} right={{ name: opp, photo: "" }} jersey={jersey} sound={sound.current} onDone={matchDone} label={copy.say("matchDay") + " " + opp.toUpperCase()} />
          : <Field sport={sport.id} sign={E.signFor(name, week.week, team)} />}
        <Squad cast={cast} bench={[]} photos={photos} moods={settled ? result.moods : null} lit={week.who} scale={4} jersey={jersey} cheer={feel} />
        {!result ? (
          <>
            <p className="event">{lines[0].text}</p>
            <h3 className="px"><Words k="spendAsk" copy={copy} /></h3>
            <div className="spends">
              {E.SPENDS.map(s => {
                const cost = E.costOf(s, stateBefore.culture);
                const can = cost <= stateBefore.capital;
                return (
                  <button key={s.id} type="button" className="spendbtn" disabled={!can || !ready} onClick={() => spend(s.id)} onMouseEnter={() => sound.current.blip()}>
                    <span className="px top"><span>{s.label}</span><span className="coins">{"●".repeat(cost)}</span></span>
                    <span className="line">{s.line}</span>
                    {!can ? <span className="px no">{copy.say("cannot")}</span> : null}
                  </button>
                );
              })}
            </div>
            <p className="say dim"><Words k="spendNote" copy={copy} /></p>
          </>
        ) : phase === "match" ? (
          <p className="event">{lines[0].text}</p>
        ) : (
          <>
            <Chat key={week.week} lines={lines} animate={phase === "chat"} sound={sound.current} onDone={() => chatDone(result)} copy={copy} />
            {settled ? (
              <div className="reflect">
                <p className="ask">{ask}</p>
                <textarea className="ta" rows={5} value={answers[E.F.reflect(week.week)] || ""} placeholder={copy.say("reflectHint")} onChange={e => set(E.F.reflect(week.week), e.target.value)} aria-label={"Week " + week.n + " answer"} />
                <label className="src"><span className="px small"><Words k="sourceAsk" copy={copy} /></span>
                  <input className="in" value={answers[E.F.source(week.week)] || ""} placeholder={copy.say("sourceHint")} onChange={e => set(E.F.source(week.week), e.target.value)} />
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
    const left = missingOf(answers);
    const last = season.results[season.results.length - 1] || null;
    body = (
      <div className="screen">
        <Hud copy={copy} state={season.state} />
        <h2 className="px"><Words k="seasonOver" copy={copy} /> <span className="dim">{team} · {season.state.wins}-{season.state.losses} · {E.gradeOf(season.state.culture)}</span></h2>
        <Field sport={sport.id} sign={E.signFor(name, "end", team)} />
        <Squad cast={cast} bench={bench} photos={photos} moods={last ? last.moods : null} scale={4} jersey={jersey} cheer={season.state.culture >= 65 ? "cheer" : ""} />
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
    <div className={"tk" + (readOnly ? " ro" : "")}>
      <style>{CSS}</style>
      <div className="cab">
        <div className="top">
          <span className="px credit"><Words k="credit" copy={copy} /></span>
          <span className="row">
            {editor ? <button type="button" className="btn px small" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing" : "Edit the words"}</button> : null}
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
.tk h1.px{font-size:26px;margin:12px 0 0;color:var(--gold);text-shadow:4px 4px 0 var(--blue)}
.tk h2.px{font-size:14px;margin:0;color:var(--gold)}
.tk h3.px{font-size:11px;margin:0;color:var(--sky)}
.tk .dim{color:var(--dim)}
.tk .say{margin:0;max-width:62ch}
.tk .say.big{font-size:19px;font-weight:600}
.tk .say.bad,.tk .status.bad{color:#fbbf24}
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
.tk .hud{display:flex;gap:20px;flex-wrap:wrap;align-items:center;background:var(--deep);border:3px solid var(--line);padding:10px 14px;color:var(--dim)}
.tk .hud .n{color:var(--text)}
.tk .hud .cul{display:inline-flex;align-items:center;gap:8px;flex:1;min-width:180px}
.tk .coins{color:var(--gold);letter-spacing:2px}
.tk .bar{display:inline-block;flex:1;height:12px;border:2px solid var(--line);background:var(--ink);min-width:80px}
.tk .bar i{display:block;height:100%;background:var(--green);transition:width .5s steps(8)}
.tk .event{margin:0;font-size:17px;background:var(--deep);border-left:6px solid var(--gold);padding:12px 14px}
.tk .spends{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
.tk .spendbtn{display:grid;gap:8px;text-align:left;background:var(--deep);border:3px solid var(--line);color:var(--text);padding:12px;cursor:pointer;font-family:var(--mono);box-shadow:4px 4px 0 var(--ink)}
.tk .spendbtn:hover{border-color:var(--gold);background:#1c1c3a}
.tk .spendbtn[disabled]{opacity:.45;cursor:default}
.tk .spendbtn .top{display:flex;justify-content:space-between;gap:8px;color:var(--gold)}
.tk .spendbtn .line{font-size:14px;color:var(--dim)}
.tk .spendbtn .no{color:var(--red);font-size:8px}
.tk .chat{display:grid;gap:8px;background:var(--deep);border:3px solid var(--green);padding:12px 14px;min-height:120px}
.tk .chead{color:var(--green)}
.tk .msg{display:flex;gap:10px;align-items:baseline;font-size:15px}
.tk .msg b{color:var(--gold);white-space:nowrap}
.tk .msg.sys{color:var(--dim);font-style:italic}
.tk .msg.won{color:var(--green);font-style:normal;font-weight:600}
.tk .msg.lost{color:#ff6a6a;font-style:normal;font-weight:600}
.tk .msg.meter{color:var(--sky);font-style:normal}
.tk .reflect{display:grid;gap:12px;background:var(--deep);border:3px solid var(--sky);padding:14px}
.tk .ask{margin:0;font-size:16px;line-height:1.5}
.tk .ta,.tk .in{width:100%;font-family:var(--mono);font-size:16px;color:var(--text);background:var(--ink);border:3px solid var(--line);padding:10px 12px;outline:none}
.tk .ta:focus,.tk .in:focus{border-color:var(--gold)}
.tk .ta{resize:vertical;min-height:120px}
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
.tk .source{margin:0;font-size:13px;color:var(--dim)}
.tk .log-wrap summary{cursor:pointer;color:var(--sky)}
.tk .words{gap:10px}
.tk .word{display:grid;gap:4px}
.tk .vsp-edit{display:block;width:100%;font:inherit;color:var(--text);background:var(--ink);border:2px dashed var(--line);padding:6px 8px;resize:none;overflow:hidden;line-height:1.45}
.tk.ro .top .btn{display:none}
@media (max-width:640px){.tk{padding:12px 8px 48px}.tk .cab{padding:12px}.tk .sports{grid-template-columns:1fr}.tk h1.px{font-size:18px}.tk .player{width:84px}}
@media (prefers-reduced-motion: reduce){.tk *{transition:none!important;animation:none!important}}
`;
